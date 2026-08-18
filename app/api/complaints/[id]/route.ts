import { NextResponse } from "next/server";
import { departmentFor } from "@/lib/departments";
import { getComplaint, updateComplaint } from "@/lib/store";
import type { Category, Priority, Status } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = await getComplaint(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const category = body.category as Category | undefined;
  const dept = category ? departmentFor(category) : null;
  const row = await updateComplaint(id, {
    status: body.status as Status | undefined,
    officer: body.officer,
    category,
    department: dept?.name,
    departmentCode: dept?.code,
    priority: body.priority as Priority | undefined,
    overrideNotes: body.overrideNotes,
    verifiedByHuman: body.verifiedByHuman,
    feedbackRating: body.feedbackRating,
    resolutionImageDataUrl: body.resolutionImageDataUrl,
    ward: body.ward,
    note: body.note,
    actor: body.actor,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
