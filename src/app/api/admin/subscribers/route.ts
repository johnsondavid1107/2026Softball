import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSubscribers, removeSubscriber } from "@/lib/kv";

export const runtime = "nodejs";

function guard(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  const subscribers = await getSubscribers();
  return NextResponse.json(subscribers);
}

export async function DELETE(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  await removeSubscriber(email);
  return NextResponse.json({ ok: true });
}
