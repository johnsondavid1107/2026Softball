"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchForecast, type DailyWeather } from "@/lib/weather";
import { SCHEDULE, isoDate } from "@/lib/schedule";

type WeatherMap = Record<string, DailyWeather | undefined>;

const WeatherContext = createContext<WeatherMap>({});

/** Forecast horizon in days — Open-Meteo free daily forecast reaches ~16d. */
const HORIZON_DAYS = 16;

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
    fetchForecast(range.start, range.end, ctrl.signal)
      .then((days) => {
        const next: WeatherMap = {};
        for (const d of days) next[d.date] = d;
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

export function useWeatherFor(date: string): DailyWeather | undefined {
  return useContext(WeatherContext)[date];
}
