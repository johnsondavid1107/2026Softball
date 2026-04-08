import { NextRequest, NextResponse } from "next/server";
import { getRoster, upsertPlayer, deletePlayer } from "@/lib/kv";
import type { Player } from "@/lib/players";

export const runtime = "nodejs";

export async function GET() {
  const roster = await getRoster();
  return NextResponse.json(roster);
}

/**
 * Public POST — any parent can add or update their child.
 * No auth required; the admin panel can remove any entry if needed.
 */
export async function POST(req: NextRequest) {
  let player: Player;
  try {
    player = (await req.json()) as Player;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!player.id || !player.firstName || !player.jerseyNumber) {
    return NextResponse.json(
      { error: "id, firstName and jerseyNumber required" },
      { status: 400 }
    );
  }

  // Duplicate check — jersey numbers must be unique.
  // Allow the same id through (that's an edit/update of an existing entry).
  const current = await getRoster();
  const conflict = current.find(
    (p) => p.jerseyNumber === player.jerseyNumber && p.id !== player.id
  );
  if (conflict) {
    return NextResponse.json(
      {
        error: "duplicate",
        message: `Jersey #${player.jerseyNumber} is already taken by ${conflict.firstName}. Each player needs a unique number.`,
      },
      { status: 409 }
    );
  }

  await upsertPlayer(player);
  return NextResponse.json({ ok: true });
}

/**
 * Public DELETE — any parent can remove an entry by id.
 */
export async function DELETE(req: NextRequest) {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePlayer(id);
  return NextResponse.json({ ok: true });
}
