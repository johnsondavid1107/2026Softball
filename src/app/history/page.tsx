"use client";

import { useEffect, useState } from "react";

type LineupEntry = {
  batPosition: number;
  playerName: string;
  fieldPosition: string;
};

type LineupLog = {
  id: string;
  loggedAt: string;
  entries: LineupEntry[];
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<LineupLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lineup")
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-4 pt-6 pb-10">
      <div className="mb-5 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-team-green/60">
          AFC Urgent Care
        </div>
        <h1 className="mt-1 text-2xl font-bold text-team-green-dark">
          Batting History
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-team-green/60">
          Past lineups logged by the coach, newest first.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-team-green/10" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="mx-auto rounded-2xl border border-dashed border-team-green/30 bg-white/50 p-8 text-center">
          <div className="text-2xl">📋</div>
          <div className="mt-2 text-sm font-semibold text-team-green-dark">
            No lineups yet
          </div>
          <div className="mt-1 text-[13px] text-team-green/60">
            The coach hasn&rsquo;t logged a lineup yet.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="overflow-hidden rounded-2xl border border-team-green/15 bg-white shadow-card"
            >
              <div className="bg-team-green px-4 py-2.5">
                <div className="text-[12px] font-bold text-team-gold">
                  {new Date(log.loggedAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[11px] text-team-cream/70">
                  {new Date(log.loggedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-3 border-b border-team-green/10 bg-team-green/5 px-4 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-team-green/50">
                  Bat
                </span>
                <span className="text-center text-[10px] font-bold uppercase tracking-wider text-team-green/50">
                  Player
                </span>
                <span className="text-right text-[10px] font-bold uppercase tracking-wider text-team-green/50">
                  Field
                </span>
              </div>

              <div className="divide-y divide-team-green/10">
                {log.entries.map((entry) => (
                  <div
                    key={entry.batPosition}
                    className="grid grid-cols-3 items-center px-4 py-2.5"
                  >
                    <span className="text-[12px] font-semibold text-team-green/50">
                      {entry.batPosition}
                    </span>
                    <span className="text-center text-[14px] font-bold text-team-green-dark">
                      {entry.playerName}
                    </span>
                    <span className="text-right text-[12px] text-team-green/70">
                      {entry.fieldPosition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
