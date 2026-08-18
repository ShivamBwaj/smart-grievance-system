// One-pass complaint classifier. Uses OpenAI when OPENAI_API_KEY is set,
// otherwise a local keyword heuristic so intake never breaks.
// Ported from the Next app's lib/classify.ts.

import OpenAI from "openai";
import { CATEGORIES, PRIORITIES, SENTIMENTS, SLA_HOURS, departmentFor } from "./domain.js";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const asCategory = (v) => (CATEGORIES.includes(v) ? v : "other");
const asPriority = (v) => (PRIORITIES.includes(v) ? v : "medium");
const asSentiment = (v) => (SENTIMENTS.includes(v) ? v : "neutral");
const clamp = (n, min, max) => (Number.isNaN(n) ? min : Math.min(max, Math.max(min, n)));

export async function classifyComplaint(opts) {
  if (!process.env.OPENAI_API_KEY) return heuristicClassify(opts);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const open = (opts.candidates || []).filter((c) => c.status !== "resolved" && c.status !== "rejected");

  const instructions = `You are CivicLens, the grievance engine for Greater Chennai Corporation, India.

Read the citizen complaint (any language: Tamil, Hindi, English, or mixed). Return a single JSON object with:
- language: ISO 639-1 code
- languageName: English name of the language
- translatedText: faithful English translation (if already English, copy it)
- summary: one sentence, max 140 chars, English
- category: one of electricity | water | sanitation | roads | public_services | corruption | other
- ward: best guess from this list if possible: Ward 8 - Anna Nagar, Ward 12 - T. Nagar, Ward 18 - Adyar, Ward 23 - Mylapore, Ward 31 - Velachery, Ward 42 - Guindy, Ward 51 - Egmore. If unknown, pick the closest or "Ward 12 - T. Nagar".
- locationExtracted: landmark / street from the text, or the provided GPS label
- priority: low | medium | high | urgent
  urgent = immediate danger (open manhole, live wire, flooding into homes, violence)
  high = service outage affecting many people or health risk
  medium = persistent civic issue
  low = cosmetic / informational
- severity: integer 1-10
- sentiment: distress | anger | neutral | hopeful
- confidence: 0-1 how sure you are of category+department
- reasoning: 2 short sentences an officer can read. Cite the words you used.
- isEmergency: boolean
- slaHours: urgent=4, high=24, medium=72, low=168 unless danger requires faster
- duplicateOfId: id of an open candidate that is clearly the SAME physical issue (same place + same problem), else null

Departments:
electricity -> Electrical & Street Lighting (ELC)
water -> Public Health Engineering - Water (WTR)
sanitation -> Health & Sanitation (SAN)
roads -> Public Works - Roads (PWD)
public_services -> Public Services & General Admin (PUB)
corruption -> Vigilance Cell (VIG)
other -> Central Grievance Cell (CGC)

Open tickets to consider for duplicates:
${open.slice(0, 18).map((c) => `${c.id} | ${c.category} | ${c.ward} | ${c.locationLabel} | ${c.summary}`).join("\n") || "(none)"}`;

  const userBits = [
    {
      type: "text",
      text: `Complaint text:\n${opts.text || "(no text - classify from the photo)"}\n\nGPS / location label: ${opts.locationLabel || "none"}\nlat: ${opts.lat ?? "n/a"} lng: ${opts.lng ?? "n/a"}`,
    },
  ];
  if (opts.imageDataUrl) userBits.push({ type: "image_url", image_url: { url: opts.imageDataUrl } });

  let raw = "{}";
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: userBits },
      ],
    });
    raw = completion.choices[0]?.message?.content || "{}";
  } catch (err) {
    console.error("[classify] OpenAI failed, using heuristic:", err?.message || err);
    return heuristicClassify(opts);
  }

  let parsed = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    return heuristicClassify(opts);
  }

  const category = asCategory(parsed.category);
  const dept = departmentFor(category);
  const priority = asPriority(parsed.priority);
  const slaHours = typeof parsed.slaHours === "number" ? parsed.slaHours : SLA_HOURS[priority];

  return {
    language: String(parsed.language || "en"),
    languageName: String(parsed.languageName || "English"),
    translatedText: String(parsed.translatedText || opts.text),
    summary: String(parsed.summary || (opts.text || "").slice(0, 140)),
    category,
    department: dept.name,
    departmentCode: dept.code,
    ward: String(parsed.ward || "Ward 12 - T. Nagar"),
    locationExtracted: String(parsed.locationExtracted || opts.locationLabel || "Chennai"),
    priority,
    severity: clamp(Number(parsed.severity) || 5, 1, 10),
    sentiment: asSentiment(parsed.sentiment),
    confidence: clamp(Number(parsed.confidence) || 0.7, 0, 1),
    reasoning: String(parsed.reasoning || "Classified from complaint text."),
    isEmergency: Boolean(parsed.isEmergency) || priority === "urgent",
    slaHours,
    duplicateOfId:
      typeof parsed.duplicateOfId === "string" && parsed.duplicateOfId.startsWith("CL-")
        ? parsed.duplicateOfId
        : null,
  };
}

export function heuristicClassify(opts) {
  const t = (opts.text || "").toLowerCase();
  const hi = /[ऀ-ॿ]/.test(opts.text || "");
  const ta = /[஀-௿]/.test(opts.text || "");

  let category = "other";
  if (/pothole|road|street|manhole|footpath|சாலை/.test(t) || /गड्ढ|सड़क/.test(opts.text || "")) category = "roads";
  else if (/water|pipeline|tanker|நீர்/.test(t) || /पानी|नल/.test(opts.text || "")) category = "water";
  else if (/garbage|trash|waste|sewage|drain|toilet|குப்பை/.test(t) || /कचरा|नाली/.test(opts.text || "")) category = "sanitation";
  else if (/light|electric|wire|transformer|power|மின்/.test(t) || /बिजली|लाइट/.test(opts.text || "")) category = "electricity";
  else if (/bribe|corrupt|harass|रिश्वत/.test(t)) category = "corruption";
  else if (/park|school|hospital|certificate|birth|death/.test(t)) category = "public_services";

  const urgent = /manhole|live wire|flood|collapse|fire|blood|attack|open drain child/.test(t);
  const high = /no water|no electricity|overflow|blocked|days/.test(t) || /नहीं आ रहा/.test(opts.text || "");
  const priority = urgent ? "urgent" : high ? "high" : category === "other" ? "low" : "medium";
  const dept = departmentFor(category);
  const language = ta ? "ta" : hi ? "hi" : "en";

  return {
    language,
    languageName: ta ? "Tamil" : hi ? "Hindi" : "English",
    translatedText: opts.text,
    summary: (opts.text || "").replace(/\s+/g, " ").slice(0, 140),
    category,
    department: dept.name,
    departmentCode: dept.code,
    ward: guessWard(opts.locationLabel || opts.text || ""),
    locationExtracted: opts.locationLabel || "Chennai",
    priority,
    severity: urgent ? 9 : high ? 7 : 5,
    sentiment: /angry|furious|disgust/.test(t) ? "anger" : urgent ? "distress" : "neutral",
    confidence: 0.62,
    reasoning: "Local fallback classifier (no OPENAI_API_KEY). Keyword match only - confirm before routing.",
    isEmergency: urgent,
    slaHours: SLA_HOURS[priority],
    duplicateOfId: null,
  };
}

function guessWard(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("anna nagar")) return "Ward 8 - Anna Nagar";
  if (t.includes("t. nagar") || t.includes("t nagar") || t.includes("pondy bazaar")) return "Ward 12 - T. Nagar";
  if (t.includes("adyar")) return "Ward 18 - Adyar";
  if (t.includes("mylapore") || t.includes("luz")) return "Ward 23 - Mylapore";
  if (t.includes("velachery") || t.includes("taramani")) return "Ward 31 - Velachery";
  if (t.includes("guindy")) return "Ward 42 - Guindy";
  if (t.includes("egmore") || t.includes("perambur")) return "Ward 51 - Egmore";
  return "Ward 12 - T. Nagar";
}
