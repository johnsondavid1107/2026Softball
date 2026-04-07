import { NextResponse } from "next/server";
import { getRoster } from "@/lib/kv";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const roster = await getRoster();
  return NextResponse.json(roster);
}
