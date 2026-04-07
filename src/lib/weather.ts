/**
 * Open-Meteo client. Free, no API key. Returns a daily forecast for our
 * home field for a contiguous date range. The free daily forecast covers
 * ~16 days, which is enough for a ~2-month softball season one row at a time.
 */

import { LOCATION } from "./schedule";

export type DailyWeather = {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  tempMaxF: number;
  precipProbMax: number; // percent 0..100
};

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
  };
};

/**
 * Fetch a daily forecast for a range of dates. The caller should only include
 * dates that are within the forecast horizon (today .. today+16d).
 */
export async function fetchForecast(
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<DailyWeather[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LOCATION.lat));
  url.searchParams.set("longitude", String(LOCATION.lon));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,precipitation_probability_max"
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "America/New_York");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;
  const d = json.daily;
  if (!d) return [];

  return d.time.map((date, i) => ({
    date,
    weatherCode: d.weather_code[i],
    tempMaxF: Math.round(d.temperature_2m_max[i]),
    precipProbMax: d.precipitation_probability_max[i],
  }));
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
