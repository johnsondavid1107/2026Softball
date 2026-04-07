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

  // Separate byes for heading clarity? Kept inline — it's clearer to see the
  // whole season flow as one list.
  return (
    <WeatherProvider>
      <ul className="flex flex-col gap-2.5 px-4 pb-6">
        {SCHEDULE.map((event) => (
          <GameRow
            key={event.id}
            event={event}
            todayIso={todayIso}
            nowIso={todayIso}
          />
        ))}
      </ul>
    </WeatherProvider>
  );
}
