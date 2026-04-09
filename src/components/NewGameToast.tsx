"use client";

import { useEffect, useState } from "react";
import type { AddedGame } from "@/lib/kv";
import { formatShortDate, formatTime } from "@/lib/schedule";

const LS_KEY = "afc-seen-games";

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markAllSeen(ids: string[]) {
  try {
    const current = getSeenIds();
    const merged = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function NewGameToast() {
  const [unseen, setUnseen] = useState<AddedGame[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/added-games")
      .then((r) => r.json())
      .then((games: AddedGame[]) => {
        if (!games.length) return;
        const seenIds = getSeenIds();
        const newGames = games.filter((g) => !seenIds.includes(g.id));
        if (newGames.length) {
          setUnseen(newGames);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    markAllSeen(unseen.map((g) => g.id));
    setVisible(false);
  }

  if (!visible || !unseen.length) return null;

  const count = unseen.length;
  const first = unseen[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mb-3 flex items-start gap-3 rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-card-lg"
    >
      <span className="mt-0.5 text-lg leading-none">📅</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
          New on the schedule
        </div>
        {count === 1 ? (
          <p className="mt-0.5 text-[13px] font-semibold leading-snug">
            vs. {first.opponentName} — {formatShortDate(first.date)} at {formatTime(first.startTime)}
          </p>
        ) : (
          <p className="mt-0.5 text-[13px] font-semibold leading-snug">
            {count} new games added to the schedule
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-blue-200 hover:text-white active:text-white mt-0.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
