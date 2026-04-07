import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { password?: string };
  if (!verifyPassword(body.password ?? "")) {
    return NextResponse.json({ error: "incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res);
  return res;
}
