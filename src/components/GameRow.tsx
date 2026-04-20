"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import {
  formatShortDate,
  formatTime,
  opponentMidLine,
  eventLocation,
  type TeamEvent,
} from "@/lib/schedule";
import { WeatherChip } from "./WeatherChip";

type Props = {
  event: TeamEvent;
  todayIso: string;
  nowIso: string; // used to detect "past"
  isNext?: boolean; // true for the first upcoming/today event — scroll target
};

export function GameRow({ event, todayIso, nowIso, isNext }: Props) {
  const liRef = useRef<HTMLLIElement>(null);
  const isToday = event.date === todayIso;
  const isPast = event.date < nowIso;

  // On mount, scroll the next upcoming game to just below the sticky nav.
  useEffect(() => {
    if (!isNext || !liRef.current) return;
    liRef.current.scrollIntoView({ block: "start", behavior: "instant" });
  }, [isNext]);

  const base =
    "relative flex items-stretch gap-3 rounded-2xl border px-4 py-3.5 transition-all tap";

  const kindStyles =
    event.cancelled
      ? "border-red-200 bg-red-50"
      : event.rescheduled
        ? "border-team-gold/40 bg-team-gold/10"
        : event.kind === "bye"
          ? "border-dashed border-team-green/20 bg-transparent text-team-green/60"
          : event.kind === "practice"
            ? "border-team-yellow/60 border-l-[6px] bg-team-yellow/10"
            : "border-team-green/15 bg-white shadow-card";

  const todayStyles = isToday
    ? "ring-2 ring-team-yellow ring-offset-2 ring-offset-team-cream animate-pulse-soft !border-team-green"
    : "";

  const pastStyles = isPast && !isToday ? "opacity-50" : "";

  return (
    <li
      ref={liRef}
      className={clsx(base, kindStyles, todayStyles, pastStyles, isNext && "scroll-mt-28")}
      aria-current={isToday ? "date" : undefined}
    >
      {/* Left: date block */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center border-r border-team-green/10 pr-3">
        <DateBlock iso={event.date} />
      </div>

      {/* Middle: consistent 3-line layout for game/practice; 2-line for bye */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {event.kind === "game" && (
          <>
            {/* Line 1: kind label + status badges */}
            <div className="flex items-center gap-1.5">
              <span className={clsx(
                "text-[10px] font-bold uppercase tracking-wider",
                event.cancelled ? "text-red-600" : "text-team-green-dark"
              )}>
                Game
              </span>
              {!event.cancelled && !event.rescheduled && event.isHome === false ? (
                <span className="rounded-full bg-team-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-team-green-dark">
                  Away
                </span>
              ) : !event.cancelled && !event.rescheduled && event.isHome !== undefined ? (
                <span className="rounded-full bg-team-green px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-team-yellow">
                  Home
                </span>
              ) : null}
              {event.rescheduled && (
                <span className="rounded-full bg-team-green px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-team-yellow">
                  Rescheduled
                </span>
              )}
              {event.cancelled && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Cancelled
                </span>
              )}
            </div>
            {/* Line 2: "vs. Team X · Sponsor" or "vs. [free text]" */}
            <div className={clsx(
              "mt-0.5 truncate text-[15px] font-bold leading-tight",
              event.cancelled ? "text-red-400 line-through" : "text-team-green-dark"
            )}>
              {opponentMidLine(event)}
            </div>
            {/* Line 3: location — always shown */}
            <div className="text-[12px] text-team-green/60">
              {eventLocation(event)}
            </div>
          </>
        )}

        {event.kind === "practice" && (
          <>
            {/* Line 1: kind label + status badges */}
            <div className="flex items-center gap-1.5">
              <span className={clsx(
                "text-[10px] font-bold uppercase tracking-wider",
                event.cancelled ? "text-red-600" : "text-team-yellow-dark"
              )}>
                Practice
              </span>
              {event.rescheduled && (
                <span className="rounded-full bg-team-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-team-green-dark">
                  Rescheduled
                </span>
              )}
              {event.cancelled && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Cancelled
                </span>
              )}
            </div>
            {/* Line 2: participants */}
            <div className={clsx(
              "mt-0.5 text-[15px] font-bold leading-tight",
              event.cancelled ? "text-red-400 line-through" : "text-team-green-dark"
            )}>
              Team 3 & Team 4
            </div>
            {/* Line 3: location — always shown */}
            <div className="text-[12px] text-team-green/60">
              {eventLocation(event)}
            </div>
          </>
        )}

        {event.kind === "bye" && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-team-green/50">
              Bye Week
            </div>
            <div className="mt-0.5 text-[15px] font-semibold leading-tight">
              Enjoy the day off 🌞
            </div>
          </>
        )}
      </div>

      {/* Right: time + weather */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-1">
        {event.startTime && (
          <div className="text-sm font-bold tabular-nums text-team-green-dark">
            {formatTime(event.startTime)}
          </div>
        )}
        {(event.kind === "game" || event.kind === "practice") && (
          <WeatherChip date={event.date} startTime={event.startTime} />
        )}
        {isToday && (
          <span className="rounded-full bg-team-yellow px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-team-green-dark">
            Today
          </span>
        )}
      </div>
    </li>
  );
}

function DateBlock({ iso }: { iso: string }) {
  // Parse as local date.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt
    .toLocaleDateString(undefined, { weekday: "short" })
    .toUpperCase();
  const day = dt.getDate();
  const mon = dt
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
  // iso unused beyond parsing, silence lint
  void formatShortDate;
  return (
    <>
      <div className="text-[10px] font-bold tracking-wider text-team-green/60">
        {dow}
      </div>
      <div className="text-2xl font-black leading-none text-team-green-dark tabular-nums">
        {day}
      </div>
      <div className="text-[10px] font-semibold tracking-wider text-team-green/60">
        {mon}
      </div>
    </>
  );
}
