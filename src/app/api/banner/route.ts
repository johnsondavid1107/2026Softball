import { NextResponse } from "next/server";
import { getBanner } from "@/lib/kv";

export const runtime = "nodejs";
// Revalidate every 30 seconds so the banner feels live without hammering Redis.
export const revalidate = 30;

export async function GET() {
  const banner = await getBanner();
  return NextResponse.json(banner ?? null);
}
