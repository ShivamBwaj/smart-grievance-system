import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const data = await getAnalytics();
  return NextResponse.json(data);
}
