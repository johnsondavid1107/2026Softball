"use client";

import { useEffect, useState } from "react";
import { SCHEDULE, isoDate } from "@/lib/schedule";
import { GameRow } from "./GameRow";
import { WeatherProvider } from "./WeatherProvider";

export function ScheduleList() {
  // Tick once per minute; enough to flip "today"/past styling without
  // re-rendering on every second (the nav handles the live clock).
  const [todayIso, setTodayIso] = useState(() => isoDate(new Date()));

  useEffect(() => {
    const tick = () => setTodayIso(isoDate(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // First event that is today or in the future — scroll into view on mount.
  const nextIdx = SCHEDULE.findIndex((e) => e.date >= todayIso);

  return (
    <WeatherProvider>
      {/* pb-72 reserves space so the last rows aren't hidden behind the sticky subscribe bar */}
      <ul className="flex flex-col gap-2.5 px-4 pb-72">
        {SCHEDULE.map((event, i) => (
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
