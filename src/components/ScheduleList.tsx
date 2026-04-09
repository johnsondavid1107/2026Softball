"use client";

import { useEffect, useState } from "react";
import { SCHEDULE, isoDate, type TeamEvent } from "@/lib/schedule";
import type { AddedGame } from "@/lib/kv";
import { GameRow } from "./GameRow";
import { WeatherProvider } from "./WeatherProvider";

/** Convert a coach-added game into the TeamEvent shape for rendering. */
function toTeamEvent(g: AddedGame): TeamEvent {
  return {
    id: g.id,
    kind: "game",
    date: g.date,
    startTime: g.startTime,
    endTime: g.endTime,
    title: g.opponentName,
    location: g.location,
    addedAt: g.addedAt,
  };
}

export function ScheduleList() {
  // Tick once per minute; enough to flip "today"/past styling without
  // re-rendering on every second (the nav handles the live clock).
  const [todayIso, setTodayIso] = useState(() => isoDate(new Date()));
  const [addedEvents, setAddedEvents] = useState<TeamEvent[]>([]);

  useEffect(() => {
    const tick = () => setTodayIso(isoDate(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/added-games")
      .then((r) => r.json())
      .then((games: AddedGame[]) => setAddedEvents(games.map(toTeamEvent)))
      .catch(() => {});
  }, []);

  // Merge static schedule with coach-added games, sorted by date then time.
  const allEvents = [...SCHEDULE, ...addedEvents].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });

  // First event that is today or in the future — scroll into view on mount.
  const nextIdx = allEvents.findIndex((e) => e.date >= todayIso);

  return (
    <WeatherProvider>
      {/* pb-72 reserves space so the last rows aren't hidden behind the sticky subscribe bar */}
      <ul className="flex flex-col gap-2.5 px-4 pb-72">
        {allEvents.map((event, i) => (
          <GameRow
            key={event.id}
            event={event}
            todayIso={todayIso}
            nowIso={todayIso}
            isNext={i === nextIdx}
          />
        ))}
      </ul>
    </WeatherProvider>
  );
}
