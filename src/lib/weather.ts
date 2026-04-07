/**
 * Open-Meteo client. Free, no API key. We pull *hourly* data so each event
 * row can show the forecast at the actual game/practice start time, not the
 * misleading daily high.
 *
 * Open-Meteo's free hourly forecast covers 16 days, which is enough to
 * surface "looks like rain Saturday" several days out for a 2-month season.
 */

import { LOCATION } from "./schedule";

export type HourlyWeather = {
  /** "YYYY-MM-DD" local date */
  date: string;
  /** 0–23 local hour */
  hour: number;
  weatherCode: number;
  tempF: number;
  precipProb: number; // 0..100
};

type OpenMeteoResponse = {
  hourly?: {
    time: string[]; // "2026-04-13T18:00"
    weather_code: number[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
};

/**
 * Fetch hourly forecast for a contiguous date range. Returns one entry per
 * hour. The caller filters down to the hours it cares about.
 */
export async function fetchHourlyForecast(
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<HourlyWeather[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LOCATION.lat));
  url.searchParams.set("longitude", String(LOCATION.lon));
  url.searchParams.set(
    "hourly",
    "weather_code,temperature_2m,precipitation_probability"
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "America/New_York");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;
  const h = json.hourly;
  if (!h) return [];

  return h.time.map((iso, i) => {
    // iso looks like "2026-04-13T18:00"
    const [date, time] = iso.split("T");
    const hour = parseInt(time.slice(0, 2), 10);
    return {
      date,
      hour,
      weatherCode: h.weather_code[i],
      tempF: Math.round(h.temperature_2m[i]),
      precipProb: h.precipitation_probability[i] ?? 0,
    };
  });
}

/**
 * Map WMO weather codes to a compact emoji + label.
 * Reference: https://open-meteo.com/en/docs
 */
export function weatherIcon(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear" };
  if (code <= 2) return { emoji: "🌤️", label: "Mostly sunny" };
  if (code === 3) return { emoji: "☁️", label: "Cloudy" };
  if (code >= 45 && code <= 48) return { emoji: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "Showers" };
  if (code >= 95) return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "🌡️", label: "—" };
}
