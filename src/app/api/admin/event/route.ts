import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  setEventOverride,
  clearEventOverride,
  getSubscribers,
} from "@/lib/kv";
import { sendGameUpdate } from "@/lib/email";

export const runtime = "nodejs";

function guard(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

type EventBody = {
  eventId: string;
  action: "cancel" | "reschedule" | "restore";
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  sendEmails?: boolean;
};

export async function POST(req: NextRequest) {
  const authErr = guard(req);
  if (authErr) return authErr;

  const body = (await req.json()) as EventBody;
  const { eventId, action, newDate, newStartTime, newEndTime, sendEmails } = body;

  if (!eventId || !action) {
    return NextResponse.json({ error: "eventId and action required" }, { status: 400 });
  }

  if (action === "restore") {
    await clearEventOverride(eventId);
    return NextResponse.json({ ok: true });
  }

  const method = action === "cancel" ? "CANCEL" : "REQUEST";
  await setEventOverride(eventId, {
    status: action === "cancel" ? "cancelled" : "rescheduled",
    newDate,
    newStartTime,
    newEndTime,
  });

  if (sendEmails) {
    const subscribers = await getSubscribers();
    sendGameUpdate(subscribers, eventId, method).catch((err) =>
      console.error("sendGameUpdate failed:", err)
    );
  }

  return NextResponse.json({ ok: true });
}
