import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, getSubscribers } from "@/lib/kv";
import { sendSeasonInvites } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = (await req.json()) as { email?: unknown };
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    email = body.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Check for duplicates before sending.
  const existing = await getSubscribers();
  const isNew = !existing.includes(email);

  if (isNew) {
    await addSubscriber(email);
    // Fire-and-forget so the response isn't held up by Resend.
    sendSeasonInvites(email).catch((err) =>
      console.error("sendSeasonInvites failed:", err)
    );
  }

  return NextResponse.json({ ok: true, alreadySubscribed: !isNew });
}
