import { NextResponse } from "next/server";
import { createComplaint, listComplaints } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

// The VM holds the Twilio credentials and proxies the raw inbound list; here on
// Vercel we classify each new message with OpenAI and persist it (to the VM's
// SQLite via lib/store). Officers/supervisors trigger this from the Ops console.
const BACKEND = process.env.BACKEND_URL || "http://52.184.22.2";

type Inbound = { sid: string; from: string; body: string; numMedia: number; at?: string };

export async function POST() {
  try {
    const res = await fetch(`${BACKEND}/api/whatsapp/inbound`, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.error || `Twilio fetch failed (${res.status})` }, { status: 502 });
    }
    const inbound = (await res.json()) as Inbound[];

    const existing = await listComplaints();
    const seen = (m: Inbound) =>
      existing.some(
        (c) => c.waSid === m.sid || (c.citizenId === `wa-${m.from}` && (c.originalText || "").trim() === m.body),
      );

    const fresh = inbound.filter((m) => !seen(m));
    const created: string[] = [];
    for (const m of fresh) {
      const c = await createComplaint({
        citizenId: `wa-${m.from}`,
        citizenName: `WhatsApp ${m.from}`,
        phone: m.from.startsWith("+") ? m.from : `+${m.from}`,
        channel: "whatsapp",
        originalText: m.body,
        waSid: m.sid,
        locationLabel: "",
      });
      created.push(c.id);
    }

    return NextResponse.json({
      scanned: inbound.length,
      created: created.length,
      createdIds: created,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 500 });
  }
}
