import { NextResponse } from "next/server";
import { upvoteComplaint } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const voterId = String(body.voterId || "guest");
  const row = await upvoteComplaint(id, voterId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
