import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveAddedGame, deleteAddedGame, type AddedGame } from "@/lib/kv";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    date?: string;
    startTime?: string;
    endTime?: string;
    opponentName?: string;
    location?: string;
  };

  if (!body.date || !body.startTime || !body.opponentName) {
    return NextResponse.json({ error: "date, startTime, and opponentName are required" }, { status: 400 });
  }

  const game: AddedGame = {
    id: `added-${Date.now()}`,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime ?? addMinutes(body.startTime, 90),
    opponentName: body.opponentName.trim(),
    location: body.location?.trim() || undefined,
    addedAt: new Date().toISOString(),
  };

  await saveAddedGame(game);
  return NextResponse.json({ ok: true, game });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await deleteAddedGame(id);
  return NextResponse.json({ ok: true });
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
