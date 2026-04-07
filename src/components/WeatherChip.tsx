"use client";

import { useWeatherFor } from "./WeatherProvider";
import { weatherIcon } from "@/lib/weather";

export function WeatherChip({ date }: { date: string }) {
  const w = useWeatherFor(date);
  if (!w) return null;
  const { emoji, label } = weatherIcon(w.weatherCode);
  const showRain = w.precipProbMax >= 30;
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-team-green/5 px-1.5 py-0.5 text-[10px] font-semibold text-team-green-dark"
      title={`${label} • High ${w.tempMaxF}° • ${w.precipProbMax}% precip`}
    >
      <span aria-hidden>{emoji}</span>
      <span className="tabular-nums">{w.tempMaxF}°</span>
      {showRain && (
        <span className="tabular-nums text-team-green/60">
          {w.precipProbMax}%
        </span>
      )}
    </div>
  );
}
