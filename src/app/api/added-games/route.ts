import { NextResponse } from "next/server";
import { getAddedGames } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET() {
  const games = await getAddedGames();
  return NextResponse.json(games);
}
