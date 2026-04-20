/**
 * Upstash Redis client + typed accessors for all persistent app data.
 *
 * Vercel injects these when the Upstash database is connected to the project.
 * Run `vercel env pull .env.local` to get them into your local environment.
 *
 * Supported naming conventions (Vercel has used both over time):
 *   UPSTASH_REDIS_REST_URL  + UPSTASH_REDIS_REST_TOKEN   (standard)
 *   KV_REST_API_URL         + KV_REST_API_TOKEN           (older Vercel naming)
 */

import { Redis } from "@upstash/redis";
import type { Player } from "./players";

const url =
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL;

const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error(
    "[kv] Missing Redis env vars. Expected UPSTASH_REDIS_REST_URL + " +
    "UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN). " +
    "Run `vercel env pull .env.local` to pull them from your Vercel project."
  );
}

export const redis = new Redis({ url: url ?? "", token: token ?? "" });

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  subscribers: "subscribers",
  banner: "banner",
  roster: "roster",
  addedGames: "added-games",
  lineupLogs: "lineup-logs",
  eventOverride: (id: string) => `event:${id}`,
  eventSeq: (id: string) => `event:${id}:seq`,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type BannerData = {
  message: string;
  postedAt: string; // ISO
};

export type EventOverride = {
  status: "cancelled" | "rescheduled";
  /** Overridden date (YYYY-MM-DD). Undefined if only time changed. */
  newDate?: string;
  /** Overridden 24h start time HH:MM. */
  newStartTime?: string;
  /** Overridden 24h end time HH:MM. */
  newEndTime?: string;
  sequence: number;
};

// ─── Subscribers ─────────────────────────────────────────────────────────────

export async function getSubscribers(): Promise<string[]> {
  const raw = await redis.get<string[]>(KEYS.subscribers);
  return raw ?? [];
}

export async function addSubscriber(email: string): Promise<void> {
  const current = await getSubscribers();
  const normalised = email.toLowerCase().trim();
  if (current.includes(normalised)) return;
  await redis.set(KEYS.subscribers, [...current, normalised]);
}

export async function removeSubscriber(email: string): Promise<void> {
  const current = await getSubscribers();
  await redis.set(
    KEYS.subscribers,
    current.filter((e) => e !== email.toLowerCase().trim())
  );
}

// ─── Banner ──────────────────────────────────────────────────────────────────

export async function getBanner(): Promise<BannerData | null> {
  return redis.get<BannerData>(KEYS.banner);
}

export async function setBanner(message: string): Promise<void> {
  await redis.set(KEYS.banner, {
    message: message.trim(),
    postedAt: new Date().toISOString(),
  });
}

export async function clearBanner(): Promise<void> {
  await redis.del(KEYS.banner);
}

// ─── Event overrides ─────────────────────────────────────────────────────────

export async function getEventOverride(
  eventId: string
): Promise<EventOverride | null> {
  return redis.get<EventOverride>(KEYS.eventOverride(eventId));
}

export async function setEventOverride(
  eventId: string,
  override: Omit<EventOverride, "sequence">
): Promise<number> {
  const seq = await bumpEventSeq(eventId);
  await redis.set(KEYS.eventOverride(eventId), { ...override, sequence: seq });
  return seq;
}

export async function clearEventOverride(eventId: string): Promise<void> {
  await redis.del(KEYS.eventOverride(eventId));
}

export async function getAllEventOverrides(): Promise<
  Record<string, EventOverride>
> {
  const { SCHEDULE } = await import("./schedule");
  const entries = await Promise.all(
    SCHEDULE.filter((e) => e.kind === "game" || e.kind === "practice").map(async (e) => {
      const ov = await getEventOverride(e.id);
      return ov ? ([e.id, ov] as [string, EventOverride]) : null;
    })
  );
  return Object.fromEntries(entries.filter(Boolean) as [string, EventOverride][]);
}

async function bumpEventSeq(eventId: string): Promise<number> {
  const key = KEYS.eventSeq(eventId);
  const next = await redis.incr(key);
  return next;
}

export async function getEventSeq(eventId: string): Promise<number> {
  const val = await redis.get<number>(KEYS.eventSeq(eventId));
  return val ?? 0;
}

// ─── Added games (coach-added makeup / extra games) ──────────────────────────

export type AddedGame = {
  /** Stable ID: "added-{timestamp}" */
  id: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM 24h
  endTime: string;     // HH:MM 24h
  opponentName: string;
  location?: string;   // Defaults to "Smith School" if omitted
  /** ISO timestamp of when the coach added it — used by the new-game toast. */
  addedAt: string;
  /** True = Home game, false = Away game. Defaults to true if omitted. */
  isHome?: boolean;
};

export async function getAddedGames(): Promise<AddedGame[]> {
  const raw = await redis.get<AddedGame[]>(KEYS.addedGames);
  return raw ?? [];
}

export async function saveAddedGame(game: AddedGame): Promise<void> {
  const current = await getAddedGames();
  await redis.set(KEYS.addedGames, [...current, game]);
}

export async function deleteAddedGame(id: string): Promise<void> {
  const current = await getAddedGames();
  await redis.set(KEYS.addedGames, current.filter((g) => g.id !== id));
}

// ─── Roster (coach-managed, shared) ──────────────────────────────────────────

export async function getRoster(): Promise<Player[]> {
  const raw = await redis.get<Player[]>(KEYS.roster);
  return raw ?? [];
}

export async function setRoster(players: Player[]): Promise<void> {
  await redis.set(KEYS.roster, players);
}

export async function upsertPlayer(player: Player): Promise<void> {
  const roster = await getRoster();
  const idx = roster.findIndex((p) => p.id === player.id);
  if (idx >= 0) {
    roster[idx] = player;
  } else {
    roster.push(player);
  }
  await setRoster(roster);
}

export async function deletePlayer(id: string): Promise<void> {
  const roster = await getRoster();
  await setRoster(roster.filter((p) => p.id !== id));
}

// ─── Lineup logs ──────────────────────────────────────────────────────────────

export type LineupEntry = {
  batPosition: number;
  playerId: string;
  playerName: string;
  fieldPosition: string;
};

export type LineupLog = {
  id: string;
  loggedAt: string; // ISO
  entries: LineupEntry[];
};

export async function getLineupLogs(): Promise<LineupLog[]> {
  const raw = await redis.get<LineupLog[]>(KEYS.lineupLogs);
  return raw ?? [];
}

export async function saveLineupLog(log: LineupLog): Promise<void> {
  const current = await getLineupLogs();
  // Newest first; cap at 50 to keep storage lean
  await redis.set(KEYS.lineupLogs, [log, ...current].slice(0, 50));
}

export async function clearLineupLogs(): Promise<void> {
  await redis.del(KEYS.lineupLogs);
}
