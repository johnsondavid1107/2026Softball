"use client";

import { useWeatherForEvent } from "./WeatherProvider";
import { weatherIcon } from "@/lib/weather";

type Props = {
  date: string;
  startTime?: string;
};

export function WeatherChip({ date, startTime }: Props) {
  const w = useWeatherForEvent(date, startTime);
  if (!w) return null;
  const { emoji, label } = weatherIcon(w.weatherCode);
  const showRain = w.precipProb >= 30;
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-team-green/5 px-1.5 py-0.5 text-[10px] font-semibold text-team-green-dark"
      title={`${label} • ${w.tempF}° at game time • ${w.precipProb}% precip`}
    >
      <span aria-hidden>{emoji}</span>
      <span className="tabular-nums">{w.tempF}°</span>
      {showRain && (
        <span className="tabular-nums text-team-green/60">
          {w.precipProb}%
        </span>
      )}
    </div>
  );
}
