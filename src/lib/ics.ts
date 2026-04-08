/**
 * iCalendar (.ics) helpers for Team 3.
 *
 * buildCalendarFeed() — builds a VCALENDAR with all game events.
 * Served at /api/calendar as a webcal:// subscription URL.
 *
 * Parents subscribe once via the link emailed to them; their calendar app
 * polls /api/calendar and reflects cancellations/reschedules automatically.
 * No ORGANIZER / ATTENDEE / METHOD — no RSVP prompts, no Google errors.
 */

import { TEAMS, LOCATION, OUR_TEAM, SCHEDULE, type TeamEvent } from "./schedule";
import type { EventOverride } from "./kv";

const PRODID = "-//AFC Urgent Care Softball//HillsdaleSoftball//EN";

/** Format a local date+time as an iCal TZID datetime (no dashes/colons). */
function icalDate(date: string, time: string): string {
  return date.replace(/-/g, "") + "T" + time.replace(":", "") + "00";
}

/** Current timestamp in iCal UTC format for DTSTAMP / LAST-MODIFIED. */
function dtstamp(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

/** Fold long lines per RFC 5545 (max 75 octets). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = "";
  while (line.length > 75) {
    out += line.slice(0, 75) + "\r\n ";
    line = line.slice(75);
  }
  return out + line;
}

function icsLine(line: string): string {
  return fold(line) + "\r\n";
}

// ─── Calendar feed ────────────────────────────────────────────────────────────

/**
 * Build a full VCALENDAR feed incorporating any admin overrides from KV.
 * Returned as a string ready to serve with Content-Type: text/calendar.
 *
 * This is what the webcal:// subscription URL serves. Calendar apps (Google,
 * Apple, Outlook) poll this URL and reflect changes automatically.
 */
export async function buildCalendarFeed(): Promise<string> {
  const { getEventOverride, getEventSeq } = await import("./kv");

  const games = SCHEDULE.filter((e) => e.kind === "game");

  let out = "";

  // Calendar header
  out += icsLine("BEGIN:VCALENDAR");
  out += icsLine("VERSION:2.0");
  out += icsLine(`PRODID:${PRODID}`);
  out += icsLine("CALSCALE:GREGORIAN");
  out += icsLine("X-WR-CALNAME:AFC Urgent Care Softball");
  out += icsLine("X-WR-TIMEZONE:America/New_York");
  // Tell calendar apps to refresh every 6 hours.
  out += icsLine("REFRESH-INTERVAL;VALUE=DURATION:PT6H");
  out += icsLine("X-PUBLISHED-TTL:PT6H");

  const stamp = dtstamp();

  for (const event of games) {
    const override = await getEventOverride(event.id);
    const seq = await getEventSeq(event.id);

    const date = override?.newDate ?? event.date;
    const startTime = override?.newStartTime ?? event.startTime ?? "10:00";
    const endTime = override?.newEndTime ?? event.endTime ?? "11:30";
    const isCancelled = override?.status === "cancelled";

    const opponent = event.opponent ? TEAMS[event.opponent] : null;
    const summary = isCancelled
      ? `CANCELLED – ${OUR_TEAM.sponsor} vs. ${opponent?.sponsor ?? "TBD"}`
      : `${OUR_TEAM.sponsor} vs. ${opponent?.sponsor ?? "TBD"}`;

    const description = isCancelled
      ? "This game has been cancelled. Check the team app for updates."
      : `Hillsdale Softball • ${OUR_TEAM.sponsor} vs. ${opponent?.sponsor ?? "TBD"}\\nLocation: ${LOCATION.name}, ${LOCATION.address}`;

    out += icsLine("BEGIN:VEVENT");
    out += icsLine(`UID:${event.id}@hillsdale-softball-team3`);
    out += icsLine(`DTSTAMP:${stamp}`);
    out += icsLine(`LAST-MODIFIED:${stamp}`);
    out += icsLine(`DTSTART;TZID=America/New_York:${icalDate(date, startTime)}`);
    out += icsLine(`DTEND;TZID=America/New_York:${icalDate(date, endTime)}`);
    out += icsLine(`SUMMARY:${summary}`);
    out += icsLine(`DESCRIPTION:${description}`);
    out += icsLine(`LOCATION:${LOCATION.name}, ${LOCATION.address}, Hillsdale, NJ`);
    out += icsLine(`STATUS:${isCancelled ? "CANCELLED" : "CONFIRMED"}`);
    out += icsLine(`SEQUENCE:${seq}`);
    // 1-hour reminder
    out += icsLine("BEGIN:VALARM");
    out += icsLine("TRIGGER:-PT1H");
    out += icsLine("ACTION:DISPLAY");
    out += icsLine("DESCRIPTION:Game starts in 1 hour!");
    out += icsLine("END:VALARM");
    out += icsLine("END:VEVENT");
  }

  out += icsLine("END:VCALENDAR");
  return out;
}
