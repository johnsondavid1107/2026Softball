/**
 * Canonical Team 3 (AFC Urgent Care) schedule for the 2026 Hillsdale Softball 1/2 season.
 *
 * Single source of truth. Stable event IDs are used as the UID base for the
 * .ics invites so that edits/cancellations land on the correct calendar event.
 */

export type TeamNumber = 1 | 2 | 3 | 4 | 5;

export type Team = {
  number: TeamNumber;
  sponsor: string;
  coach: string;
};

export const TEAMS: Record<TeamNumber, Team> = {
  1: { number: 1, sponsor: "Park Ridge Orthodontics", coach: "Della Volpe" },
  2: { number: 2, sponsor: "Toms Titans", coach: "Grill" },
  3: { number: 3, sponsor: "AFC Urgent Care", coach: "Chicolo" },
  4: { number: 4, sponsor: "Domani", coach: "Kelly" },
  5: { number: 5, sponsor: "Chromalloy", coach: "Jacobson" },
};

export const OUR_TEAM_NUMBER: TeamNumber = 3;
export const OUR_TEAM = TEAMS[OUR_TEAM_NUMBER];

export const LOCATION = {
  name: "Smith School",
  address: "Hillsdale Avenue",
  // Smith School, Hillsdale NJ — used for weather lookups and map links.
  lat: 41.0039,
  lon: -74.0615,
};

export type EventKind = "game" | "practice" | "bye";

export type TeamEvent = {
  /** Stable ID — used as the .ics UID base. Never change this for a given event. */
  id: string;
  kind: EventKind;
  /** ISO date, YYYY-MM-DD in local time (America/New_York). */
  date: string;
  /** 24h HH:MM local. Omitted for bye. */
  startTime?: string;
  /** 24h HH:MM local. Omitted for bye. */
  endTime?: string;
  /** For games: opponent team number. */
  opponent?: TeamNumber;
  /** Free-form title override. */
  title?: string;
};

const GAME_DURATION_MIN = 90;

/** Compute end time from a start time + duration. */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function game(date: string, startTime: string, opponent: TeamNumber): TeamEvent {
  return {
    id: `game-${date}`,
    kind: "game",
    date,
    startTime,
    endTime: addMinutes(startTime, GAME_DURATION_MIN),
    opponent,
  };
}

function practice(date: string): TeamEvent {
  return {
    id: `practice-${date}`,
    kind: "practice",
    date,
    startTime: "18:00",
    endTime: "19:00",
  };
}

function bye(date: string): TeamEvent {
  return {
    id: `bye-${date}`,
    kind: "bye",
    date,
  };
}

/**
 * Season schedule for Team 3 only. Verified against
 * `2026_Hillsdale Softball 1_2 Schedule.md` on 2026-04-07.
 */
export const SCHEDULE: TeamEvent[] = [
  // Practices — Mondays 6:00–7:00 PM (Team 3 shares the Monday 6–7pm slot with Team 4)
  practice("2026-04-06"),
  practice("2026-04-13"),
  practice("2026-04-20"),
  practice("2026-04-27"),
  practice("2026-05-04"),
  practice("2026-05-11"),
  practice("2026-05-18"),
  practice("2026-05-25"),
  practice("2026-06-01"),
  practice("2026-06-08"),

  // Games — Saturdays
  game("2026-04-11", "11:00", 2), // 2 vs 3
  game("2026-04-18", "13:00", 5), // 5 vs 3
  game("2026-04-25", "13:00", 1), // 1 vs 3
  game("2026-05-02", "11:00", 4), // 3 vs 4
  bye("2026-05-09"), // BYE: TEAM 3
  game("2026-05-16", "11:00", 2), // 2 vs 3
  game("2026-05-23", "11:00", 5), // 5 vs 3
  game("2026-05-30", "11:00", 1), // 1 vs 3
  game("2026-06-06", "13:00", 4), // 3 vs 4
  bye("2026-06-13"), // BYE: TEAM 3
].sort((a, b) => {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
});

// -----------------------------------------------------------------------------
// View helpers
// -----------------------------------------------------------------------------

/** YYYY-MM-DD for a Date interpreted in local (America/New_York) time. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD + HH:MM pair into a local Date. */
export function toLocalDate(date: string, time?: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = (time ?? "00:00").split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** Formatted short date, e.g. "Sat, Apr 11". */
export function formatShortDate(date: string): string {
  const d = toLocalDate(date);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Formatted time, e.g. "11:00 AM". */
export function formatTime(hhmm?: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function opponentLabel(e: TeamEvent): string {
  if (e.kind !== "game" || !e.opponent) return "";
  const t = TEAMS[e.opponent];
  return `${t.sponsor}`;
}

export function opponentShort(e: TeamEvent): string {
  if (e.kind !== "game" || !e.opponent) return "";
  return `Team ${e.opponent}`;
}
