/**
 * RFC 5545 iCalendar (.ics) generator for Team 3 game invites.
 *
 * Each game has a stable UID (derived from the event ID) so that sending an
 * updated .ics with the same UID + higher SEQUENCE overwrites the existing
 * calendar entry in Gmail/Apple Mail/Outlook without creating a duplicate.
 *
 * METHOD:REQUEST → create/update the event
 * METHOD:CANCEL  → remove the event from the calendar
 */

import { TEAMS, LOCATION, OUR_TEAM, type TeamEvent } from "./schedule";
import type { EventOverride } from "./kv";

const PRODID = "-//AFC Urgent Care Softball//HillsdaleSoftball//EN";
const TIMEZONE = "America/New_York";
// Parse bare address out of "AFC Urgent Care <email@domain.com>"
const _emailFrom = process.env.EMAIL_FROM ?? "";
const _match = _emailFrom.match(/<(.+?)>/);
const ORGANIZER_EMAIL = _match ? _match[1] : (_emailFrom || "noreply@resend.dev");
const ORGANIZER_NAME = OUR_TEAM.sponsor;

/** Format a local YYYY-MM-DD + HH:MM as an iCal TZID datetime string. */
function icalDate(date: string, time: string): string {
  // "2026-04-11" + "11:00" → "20260411T110000"
  return date.replace(/-/g, "") + "T" + time.replace(":", "") + "00";
}

/** Current UTC timestamp in iCal format for DTSTAMP. */
function dtstamp(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

/** Fold long lines per RFC 5545 (max 75 octets, continuation with CRLF + space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  let out = "";
  while (line.length > 75) {
    out += line.slice(0, 75) + "\r\n ";
    line = line.slice(75);
  }
  return out + line;
}

function lines(...parts: string[]): string {
  return parts.map(fold).join("\r\n") + "\r\n";
}

export type IcsMethod = "REQUEST" | "CANCEL";

type IcsOptions = {
  event: TeamEvent;
  attendeeEmail: string;
  method: IcsMethod;
  override?: EventOverride | null;
  sequence?: number;
};

/**
 * Build a single VCALENDAR .ics string for one game event.
 */
export function buildIcs({
  event,
  attendeeEmail,
  method,
  override,
  sequence = 0,
}: IcsOptions): string {
  const uid = `${event.id}@hillsdale-softball-team3`;

  // Effective date/time — use override values if present.
  const date = override?.newDate ?? event.date;
  const startTime = override?.newStartTime ?? event.startTime ?? "10:00";
  const endTime = override?.newEndTime ?? event.endTime ?? "11:30";

  const opponentTeam = event.opponent ? TEAMS[event.opponent] : null;
  const summary =
    method === "CANCEL"
      ? `CANCELLED: AFC Urgent Care vs. ${opponentTeam?.sponsor ?? "TBD"}`
      : `AFC Urgent Care vs. ${opponentTeam?.sponsor ?? "TBD"}`;

  const description =
    method === "CANCEL"
      ? `This game has been cancelled. Check the app for updates.`
      : `Hillsdale Softball — ${OUR_TEAM.sponsor} (Team ${OUR_TEAM.number}) vs. ${
          opponentTeam ? `${opponentTeam.sponsor} (Team ${opponentTeam.number})` : "TBD"
        }\\n\\nLocation: ${LOCATION.name}, ${LOCATION.address}`;

  const status = method === "CANCEL" ? "CANCELLED" : "CONFIRMED";

  return (
    lines(
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:${PRODID}`,
      "CALSCALE:GREGORIAN",
      `METHOD:${method}`,
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp()}`,
      `DTSTART;TZID=${TIMEZONE}:${icalDate(date, startTime)}`,
      `DTEND;TZID=${TIMEZONE}:${icalDate(date, endTime)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${LOCATION.name}, ${LOCATION.address}, Hillsdale, NJ`,
      `ORGANIZER;CN=${ORGANIZER_NAME}:mailto:${ORGANIZER_EMAIL}`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=Parent:mailto:${attendeeEmail}`,
      `SEQUENCE:${sequence}`,
      `STATUS:${status}`,
      // 1-hour reminder
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Game starts in 1 hour!",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    )
  );
}

/**
 * Build .ics content for all upcoming (non-bye) games, returned as an array
 * of { eventId, filename, content } so the caller can attach them to an email.
 */
export async function buildAllGameIcs(
  attendeeEmail: string
): Promise<{ eventId: string; filename: string; content: string }[]> {
  const { SCHEDULE } = await import("./schedule");
  const { getEventOverride, getEventSeq } = await import("./kv");

  const games = SCHEDULE.filter((e) => e.kind === "game");

  return Promise.all(
    games.map(async (event) => {
      const override = await getEventOverride(event.id);
      const sequence = await getEventSeq(event.id);
      // Skip cancelled events in the initial invite blast — parent doesn't
      // need a CANCEL attachment for something they've never received.
      const method: IcsMethod =
        override?.status === "cancelled" ? "CANCEL" : "REQUEST";
      const content = buildIcs({
        event,
        attendeeEmail,
        method,
        override,
        sequence,
      });
      return {
        eventId: event.id,
        filename: `${event.id}.ics`,
        content,
      };
    })
  );
}
