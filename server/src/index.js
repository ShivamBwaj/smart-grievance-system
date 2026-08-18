// CivicLens backend: Express + SQLite. Serves the same /api contract the
// Next.js frontend used to serve locally, now with persistent storage.

import express from "express";
import cors from "cors";
import {
  listComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  upvoteComplaint,
  getAnalytics,
  readAllRaw,
  replaceAllRaw,
} from "./store.js";
import { whatsappWebhook, fetchTwilioInbound } from "./whatsapp.js";

const app = express();
app.disable("x-powered-by");
app.use(cors());
// Twilio posts form-encoded webhooks; the rest of the API is JSON (photos as data URLs).
app.use("/api/whatsapp", express.urlencoded({ extended: false }));
app.use(express.json({ limit: "12mb" }));

// WhatsApp (Twilio) intake: file a grievance from a chat message, reply with the id.
app.post("/api/whatsapp", whatsappWebhook);
app.get("/api/whatsapp", (_req, res) =>
  res.type("text/plain").send("CivicLens WhatsApp webhook. Point your Twilio sandbox 'When a message comes in' here (POST).")
);
// Raw inbound WhatsApp messages (VM holds Twilio creds; Vercel classifies + stores).
app.get("/api/whatsapp/inbound", async (_req, res) => {
  try {
    res.json(await fetchTwilioInbound());
  } catch (e) {
    res.status(502).json({ error: e?.message || "Twilio fetch failed" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "civiclens-api" }));

// Raw storage for the Vercel frontend (which owns AI classification).
app.get("/api/_all", (_req, res) => res.json(readAllRaw()));
app.put("/api/_all", (req, res) => {
  try {
    const n = replaceAllRaw(req.body);
    res.json({ ok: true, count: n });
  } catch (e) {
    res.status(400).json({ error: e?.message || "bad payload" });
  }
});

app.get("/api/complaints", (_req, res) => {
  res.json(listComplaints());
});

app.post("/api/complaints", async (req, res) => {
  try {
    const body = req.body || {};
    const originalText = String(body.originalText || "").trim();
    if (!originalText && !body.imageDataUrl) {
      return res.status(400).json({ error: "Write something, or attach a photo." });
    }
    const complaint = await createComplaint({
      citizenId: String(body.citizenId || "guest"),
      citizenName: String(body.citizenName || "Citizen"),
      phone: body.phone ?? null,
      anonymous: Boolean(body.anonymous),
      channel: body.channel || "text",
      originalText: originalText || "Photo complaint",
      imageDataUrl: body.imageDataUrl ?? null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      locationLabel: body.locationLabel || "",
    });
    res.status(201).json(complaint);
  } catch (e) {
    console.error("[POST /api/complaints]", e);
    res.status(500).json({ error: e?.message || "Failed to file" });
  }
});

app.get("/api/complaints/:id", (req, res) => {
  const c = getComplaint(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(c);
});

app.patch("/api/complaints/:id", async (req, res) => {
  const c = await updateComplaint(req.params.id, req.body || {});
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(c);
});

app.post("/api/complaints/:id/upvote", async (req, res) => {
  const c = await upvoteComplaint(req.params.id, (req.body || {}).voterId || "anon");
  if (!c) return res.status(404).json({ error: "Not found" });
  res.json(c);
});

app.get("/api/analytics", (_req, res) => {
  res.json(getAnalytics());
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`CivicLens API listening on http://${HOST}:${PORT}`);
});
