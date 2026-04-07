import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getRoster, upsertPlayer, deletePlayer } from "@/lib/kv";
import type { Player } from "@/lib/players";

export const runtime = "nodejs";

function guard(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  return NextResponse.json(await getRoster());
}

export async function POST(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  const player = (await req.json()) as Player;
  if (!player.id || !player.firstName || !player.jerseyNumber) {
    return NextResponse.json({ error: "id, firstName and jerseyNumber required" }, { status: 400 });
  }
  await upsertPlayer(player);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const err = guard(req);
  if (err) return err;
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePlayer(id);
  return NextResponse.json({ ok: true });
}
