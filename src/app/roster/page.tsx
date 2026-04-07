"use client";

import { useEffect, useState } from "react";
import { AudioProvider } from "@/components/AudioProvider";
import { PlayerCard } from "@/components/PlayerCard";
import { AddPlayerForm } from "@/components/AddPlayerForm";
import { type Player } from "@/lib/players";
import {
  isLocalPlayer,
  readLocalRoster,
  writeLocalRoster,
} from "@/lib/localRoster";

type FormState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; player: Player };

export default function RosterPage() {
  const [local, setLocal] = useState<Player[]>([]);
  const [form, setForm] = useState<FormState>({ mode: "closed" });

  const [kvRoster, setKvRoster] = useState<Player[]>([]);

  useEffect(() => {
    // Fetch the coach-managed KV roster.
    fetch("/api/roster")
      .then((r) => r.json())
      .then((d: Player[]) => setKvRoster(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

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

  function handleAdd(player: Player) {
    const next = [...local, player];
    writeLocalRoster(next);
    setLocal(next);
    setForm({ mode: "closed" });
  }

  function handleUpdate(updated: Player) {
    const next = local.map((p) => (p.id === updated.id ? updated : p));
    writeLocalRoster(next);
    setLocal(next);
    setForm({ mode: "closed" });
  }

  function handleRemove(id: string) {
    const next = local.filter((p) => p.id !== id);
    writeLocalRoster(next);
    setLocal(next);
    if (form.mode === "edit" && form.player.id === id) {
      setForm({ mode: "closed" });
    }
  }

  // KV roster (coach-managed) + localStorage (parent self-added), deduped by id.
  const kvIds = new Set(kvRoster.map((p) => p.id));
  const merged = [...kvRoster, ...local.filter((p) => !kvIds.has(p.id))].sort(
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

      {/* Add button — only shown when no form is open */}
      {form.mode === "closed" && (
        <div className="px-4 pt-2 pb-4">
          <button
            type="button"
            onClick={() => setForm({ mode: "add" })}
            className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-team-green px-4 py-3 text-base font-bold text-team-gold shadow-card-lg active:bg-team-green-dark"
          >
            <PlusIcon />
            Add my child
          </button>
        </div>
      )}

      {/* Add form */}
      {form.mode === "add" && (
        <AddPlayerForm
          mode="add"
          onSubmit={handleAdd}
          onCancel={() => setForm({ mode: "closed" })}
        />
      )}

      {/* Edit form — rendered inline above the list */}
      {form.mode === "edit" && (
        <AddPlayerForm
          mode="edit"
          initial={form.player}
          onSubmit={handleUpdate}
          onCancel={() => setForm({ mode: "closed" })}
        />
      )}

      {merged.length === 0 ? (
        <div className="mx-4 rounded-2xl border border-dashed border-team-green/30 bg-white/50 p-8 text-center">
          <div className="text-2xl">⚾</div>
          <div className="mt-2 text-sm font-semibold text-team-green-dark">
            No players yet
          </div>
          <div className="mt-1 text-[13px] text-team-green/60">
            Tap &ldquo;Add my child&rdquo; above to get started.
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-8">
          {merged.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              editable={isLocalPlayer(p.id)}
              onEdit={(player) => setForm({ mode: "edit", player })}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
    </AudioProvider>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
    </svg>
  );
}
