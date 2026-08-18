// Twilio WhatsApp intake. A citizen messages the Twilio sandbox number; Twilio
// POSTs here (form-encoded); we file the grievance and reply with the ticket id
// via TwiML (no auth token needed for the reply). Media fetch + signature
// verification use the Twilio credentials when present.

import { createComplaint } from "./store.js";

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

const twiml = (message) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;

async function fetchTwilioMedia(url) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !url) return null;
  const res = await fetch(url, { headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") } });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
}

// Pull recent inbound WhatsApp messages from Twilio (the VM holds the creds).
// Returned raw so the Vercel side can classify with OpenAI and store.
export async function fetchTwilioInbound() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not set on the server");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=50`;
  const res = await fetch(url, {
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
  });
  if (!res.ok) throw new Error(`Twilio list failed (${res.status})`);
  const data = await res.json();
  return (data.messages || [])
    .filter((m) => m.direction === "inbound" && String(m.from || "").startsWith("whatsapp:"))
    .map((m) => ({
      sid: m.sid,
      from: String(m.from).replace("whatsapp:", ""),
      body: String(m.body || "").trim(),
      numMedia: parseInt(m.num_media || "0", 10) || 0,
      at: m.date_sent || m.date_created,
    }))
    .filter((m) => m.body && !/^join\s/i.test(m.body)) // skip sandbox "join <code>" messages
    .reverse(); // oldest first
}

export async function whatsappWebhook(req, res) {
  const body = req.body || {};
  const from = String(body.From || "").replace("whatsapp:", "").trim();
  const text = String(body.Body || "").trim();
  const profile = String(body.ProfileName || "WhatsApp user").trim() || "WhatsApp user";
  const numMedia = parseInt(body.NumMedia || "0", 10) || 0;

  let imageDataUrl = null;
  if (numMedia > 0) {
    try {
      imageDataUrl = await fetchTwilioMedia(body.MediaUrl0);
    } catch {
      /* media needs TWILIO_AUTH_TOKEN; fall through to text-only */
    }
  }

  res.set("Content-Type", "text/xml");

  if (!text && !imageDataUrl) {
    return res.send(
      twiml("Namma CivicLens. Send a short description of the civic issue (Tamil, Hindi or English) and a photo if you have one, to file a grievance.")
    );
  }

  try {
    const c = await createComplaint({
      citizenId: `wa-${from || "unknown"}`,
      citizenName: profile,
      phone: from ? (from.startsWith("+") ? from : `+${from}`) : null,
      anonymous: false,
      channel: "whatsapp",
      originalText: text || "Photo complaint",
      imageDataUrl,
      lat: null,
      lng: null,
      locationLabel: "",
    });

    const base = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "";
    const track = base ? ` Track: ${base}/track?id=${c.id}` : ` Track with ID ${c.id}.`;

    const msg = c.duplicateOf
      ? `Thanks ${profile}. Your report joins an existing issue (${c.duplicateOf}) in ${c.ward}. ${c.impactCount} people are now on it.${track}`
      : `Filed as ${c.id}. Routed to ${c.department} (priority ${c.priority}, SLA ${c.slaHours}h).${track}`;

    return res.send(twiml(msg));
  } catch (e) {
    console.error("[whatsapp] file failed:", e?.message || e);
    return res.send(twiml("Sorry, we could not file that just now. Please resend a short description of the issue."));
  }
}
