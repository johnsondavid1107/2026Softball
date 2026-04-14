import { NextResponse } from "next/server";
import { getAllEventOverrides } from "@/lib/kv";

export const runtime = "nodejs";

/** Public read-only endpoint — returns all active event overrides. */
export async function GET() {
  const overrides = await getAllEventOverrides();
  return NextResponse.json(overrides);
}
