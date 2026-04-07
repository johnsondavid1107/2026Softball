"use client";

import { useEffect, useState } from "react";
import { AudioProvider } from "@/components/AudioProvider";
import { PlayerCard } from "@/components/PlayerCard";
import { AddPlayerForm } from "@/components/AddPlayerForm";
import { PLACEHOLDER_ROSTER, type Player } from "@/lib/players";
import {
  isLocalPlayer,
  readLocalRoster,
  writeLocalRoster,
} from "@/lib/localRoster";

export default function RosterPage() {
  const [local, setLocal] = useState<Player[]>([]);

  // Hydrate from localStorage on mount and subscribe to updates from
  // sibling components / other tabs.
  useEffect(() => {
    const refresh = () => setLocal(readLocalRoster());
    refresh();
    window.addEventListener("local-roster-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("local-roster-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleAdd(p: Player) {
    const next = [...local, p];
    writeLocalRoster(next);
    setLocal(next);
  }

  function handleRemove(id: string) {
    const next = local.filter((p) => p.id !== id);
    writeLocalRoster(next);
    setLocal(next);
  }

  // Merge dummy + locally-added entries, sort by jersey number.
  const merged = [...PLACEHOLDER_ROSTER, ...local].sort(
    (a, b) => a.jerseyNumber - b.jerseyNumber
  );

  return (
    <AudioProvider>
      <section className="px-5 pt-6 pb-3 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-team-green/60">
          The Team
        </div>
        <h1 className="mt-1 text-2xl font-bold text-team-green-dark">
          Roster & Walk-Outs
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-team-green/60">
          Tap a play button to hear each player&rsquo;s walk-out song.
        </p>
      </section>

      <AddPlayerForm onAdd={handleAdd} />

      {merged.length === 0 ? (
        <div className="mx-4 rounded-2xl border border-dashed border-team-green/30 bg-white/50 p-6 text-center text-sm text-team-green/60">
          Roster coming soon — add the first player above.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-8">
          {merged.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              removable={isLocalPlayer(p.id)}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
    </AudioProvider>
  );
}
