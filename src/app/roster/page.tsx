"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioProvider } from "@/components/AudioProvider";
import { PlayerCard } from "@/components/PlayerCard";
import { AddPlayerForm } from "@/components/AddPlayerForm";
import { ToastStack, type ToastData } from "@/components/Toast";
import type { Player } from "@/lib/players";

type FormState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; player: Player };

export default function RosterPage() {
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  function showToast(message: string, kind: ToastData["kind"] = "error") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch("/api/roster");
      if (res.ok) {
        const data = (await res.json()) as Player[];
        setRoster(Array.isArray(data) ? data : []);
      }
    } catch {
      // Keep whatever we have on network error.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  async function handleAdd(player: Player) {
    // Optimistic update.
    setRoster((prev) =>
      [...prev, player].sort((a, b) => a.jerseyNumber - b.jerseyNumber)
    );
    setForm({ mode: "closed" });

    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      });

      if (res.status === 409) {
        const json = (await res.json()) as { message?: string };
        // Roll back the optimistic add.
        setRoster((prev) => prev.filter((p) => p.id !== player.id));
        setForm({ mode: "add" });
        showToast(json.message ?? "That jersey number is already taken.");
        return;
      }

      if (!res.ok) {
        setRoster((prev) => prev.filter((p) => p.id !== player.id));
        showToast("Couldn't save — please try again.");
      }
    } catch {
      setRoster((prev) => prev.filter((p) => p.id !== player.id));
      showToast("Network error — please try again.");
    }
  }

  async function handleUpdate(updated: Player) {
    setRoster((prev) =>
      prev
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
    );
    setForm({ mode: "closed" });

    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.status === 409) {
        const json = (await res.json()) as { message?: string };
        // Roll back.
        fetchRoster();
        setForm({ mode: "edit", player: updated });
        showToast(json.message ?? "That jersey number is already taken.");
        return;
      }

      if (!res.ok) fetchRoster();
    } catch {
      fetchRoster();
    }
  }

  async function handleRemove(id: string) {
    setRoster((prev) => prev.filter((p) => p.id !== id));
    if (form.mode === "edit" && form.player.id === id) setForm({ mode: "closed" });
    try {
      await fetch("/api/roster", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      fetchRoster();
    }
  }

  const sorted = [...roster].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

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

      {form.mode === "add" && (
        <AddPlayerForm
          mode="add"
          onSubmit={handleAdd}
          onCancel={() => setForm({ mode: "closed" })}
        />
      )}

      {form.mode === "edit" && (
        <AddPlayerForm
          mode="edit"
          initial={form.player}
          onSubmit={handleUpdate}
          onCancel={() => setForm({ mode: "closed" })}
        />
      )}

      {loading ? (
        <div className="flex flex-col gap-2.5 px-4 pb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-team-green/10" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
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
          {sorted.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              editable
              onEdit={(player) => setForm({ mode: "edit", player })}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
