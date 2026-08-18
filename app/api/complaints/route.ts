import { NextResponse } from "next/server";
import { createComplaint, listComplaints } from "@/lib/store";
import type { Channel } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const rows = await listComplaints();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const originalText = String(body.originalText || "").trim();
    const channel = (body.channel || "text") as Channel;
    if (!originalText && !body.imageDataUrl) {
      return NextResponse.json({ error: "Write something, or attach a photo." }, { status: 400 });
    }
    const complaint = await createComplaint({
      citizenId: String(body.citizenId || "guest"),
      citizenName: String(body.citizenName || "Citizen"),
      phone: body.phone ?? null,
      anonymous: Boolean(body.anonymous),
      channel,
      originalText: originalText || "Photo complaint",
      imageDataUrl: body.imageDataUrl ?? null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      locationLabel: body.locationLabel || "",
    });
    return NextResponse.json(complaint, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
