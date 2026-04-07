import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { setBanner, clearBanner } from "@/lib/kv";

export const runtime = "nodejs";

function guard(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  await setBanner(message);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  await clearBanner();
  return NextResponse.json({ ok: true });
}
