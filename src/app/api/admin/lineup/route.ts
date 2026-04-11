import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getLineupLogs, saveLineupLog, clearLineupLogs, type LineupLog } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getLineupLogs());
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const log = (await req.json()) as LineupLog;
  if (!log.id || !log.loggedAt || !Array.isArray(log.entries)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await saveLineupLog(log);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await clearLineupLogs();
  return NextResponse.json({ ok: true });
}
