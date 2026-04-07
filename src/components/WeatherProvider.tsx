"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchHourlyForecast, type HourlyWeather } from "@/lib/weather";
import { SCHEDULE, isoDate } from "@/lib/schedule";

type WeatherMap = Record<string, HourlyWeather | undefined>;

const WeatherContext = createContext<WeatherMap>({});

/** Forecast horizon in days — Open-Meteo free hourly forecast reaches ~16d. */
const HORIZON_DAYS = 16;

/** Build the lookup key for a given date + hour. */
function key(date: string, hour: number): string {
  return `${date}@${hour}`;
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<WeatherMap>({});

  // Compute the range once: from today to the last in-horizon scheduled date.
  const range = useMemo(() => {
    const today = new Date();
    const todayIso = isoDate(today);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + HORIZON_DAYS);
    const horizonIso = isoDate(horizon);

    const inRange = SCHEDULE.map((e) => e.date).filter(
      (d) => d >= todayIso && d <= horizonIso
    );
    if (inRange.length === 0) return null;
    return { start: inRange[0], end: inRange[inRange.length - 1] };
  }, []);

  useEffect(() => {
    if (!range) return;
    const ctrl = new AbortController();
    fetchHourlyForecast(range.start, range.end, ctrl.signal)
      .then((hours) => {
        const next: WeatherMap = {};
        for (const h of hours) next[key(h.date, h.hour)] = h;
        setMap(next);
      })
      .catch(() => {
        // Silent failure — weather is a nice-to-have, not essential.
      });
    return () => ctrl.abort();
  }, [range]);

  return (
    <WeatherContext.Provider value={map}>{children}</WeatherContext.Provider>
  );
}

/**
 * Look up the forecast for a specific date + start time (HH:MM, 24h).
 * Returns undefined if the event is outside the forecast horizon or the
 * fetch hasn't landed yet.
 */
export function useWeatherForEvent(
  date: string,
  startTime?: string
): HourlyWeather | undefined {
  const map = useContext(WeatherContext);
  if (!startTime) return undefined;
  const hour = parseInt(startTime.slice(0, 2), 10);
  return map[key(date, hour)];
}
