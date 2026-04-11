import { NextResponse } from "next/server";
import { getLineupLogs } from "@/lib/kv";

export const runtime = "nodejs";

/** Public read-only endpoint — returns all logged lineups, newest first. */
export async function GET() {
  const logs = await getLineupLogs();
  return NextResponse.json(logs);
}
