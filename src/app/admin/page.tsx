"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { SCHEDULE, TEAMS } from "@/lib/schedule";
import { CalendarLinkCard } from "@/components/CalendarLinks";
import { AddPlayerForm } from "@/components/AddPlayerForm";
import { AudioProvider } from "@/components/AudioProvider";
import type { Player } from "@/lib/players";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "banner" | "schedule" | "subscribers" | "lineup" | "roster" | "history";

// ─── Local types ──────────────────────────────────────────────────────────────

type LineupEntry = {
  batPosition: number;
  playerId: string;
  playerName: string;
  fieldPosition: string;
};

type LineupLog = {
  id: string;
  loggedAt: string;
  entries: LineupEntry[];
};

type EventOverride = {
  status: "cancelled" | "rescheduled";
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <LoadingScreen />;
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-team-green/40 text-sm">
      Loading…
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError("Wrong password.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs">
        <div className="mb-6 text-center">
          <div className="text-[11px] font-bold uppercase tracking-widest text-team-green/50">
            Admin
          </div>
          <h1 className="mt-1 text-2xl font-black text-team-green-dark">
            Coach Panel
          </h1>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-team-green/60">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="tap w-full rounded-xl border border-team-green/20 bg-white px-4 text-team-green-dark focus:border-team-green focus:outline-none focus:ring-2 focus:ring-team-gold/40"
          />
        </label>
        {error && (
          <p className="mt-2 text-[12px] text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="tap mt-4 w-full rounded-xl bg-team-green py-3 text-base font-bold text-team-gold disabled:opacity-60 active:bg-team-green-dark"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("banner");

  // Lineup state lives here so it survives tab switches
  const [lineupPlayers, setLineupPlayers] = useState<Player[]>([]);
  const [lineupAbsentIds, setLineupAbsentIds] = useState<Set<string>>(new Set());
  const [lineupLoaded, setLineupLoaded] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  return (
    <div>
      {/* Tab bar — scrollable so all 6 tabs fit on narrow screens */}
      <div className="flex overflow-x-auto border-b border-team-green/10 bg-white scrollbar-none">
        {(["banner", "schedule", "subscribers", "lineup", "roster", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              "tap shrink-0 px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors",
              tab === t
                ? "border-b-2 border-team-green text-team-green-dark"
                : "text-team-green/50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-5">
        {tab === "banner" && <BannerTab />}
        {tab === "schedule" && <GamesTab />}
        {tab === "subscribers" && <SubscribersTab />}
        {tab === "roster" && <RosterTab />}
        {tab === "lineup" && (
          <LineupTab
            players={lineupPlayers}
            setPlayers={setLineupPlayers}
            absentIds={lineupAbsentIds}
            setAbsentIds={setLineupAbsentIds}
            loaded={lineupLoaded}
            setLoaded={setLineupLoaded}
          />
        )}
        {tab === "history" && <HistoryTab />}
      </div>

      <div className="px-4 pb-10 text-center">
        <button
          type="button"
          onClick={logout}
          className="text-[12px] text-team-green/40 underline active:text-team-green-dark"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Banner tab ───────────────────────────────────────────────────────────────

function BannerTab() {
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState<{ message: string; postedAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/banner")
      .then((r) => r.json())
      .then((d) => {
        if (d?.message) {
          setCurrent(d);
          setMessage(d.message);
        }
      })
      .catch(() => { });
  }, []);

  async function publish() {
    if (!message.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setCurrent({ message, postedAt: new Date().toISOString() });
      setStatus("Published.");
    } catch {
      setStatus("Error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setStatus(null);
    try {
      await fetch("/api/admin/banner", { method: "DELETE" });
      setCurrent(null);
      setMessage("");
      setStatus("Banner cleared.");
    } catch {
      setStatus("Error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading>Announcement Banner</SectionHeading>
      <p className="mb-3 text-[13px] text-team-green/60">
        Appears at the top of the schedule page for all parents. Use for rain
        cancellations, jersey notes, snack reminders, etc.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="e.g. Today's game is cancelled due to rain. Stay dry! ☔"
        className="w-full rounded-xl border border-team-green/20 bg-white p-3 text-[14px] text-team-green-dark placeholder:text-team-green/30 focus:border-team-green focus:outline-none focus:ring-2 focus:ring-team-gold/40"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={publish}
          disabled={busy || !message.trim()}
          className="tap flex-1 rounded-xl bg-team-green py-2.5 text-sm font-bold text-team-gold disabled:opacity-50 active:bg-team-green-dark"
        >
          Publish
        </button>
        {current && (
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            className="tap rounded-xl border border-team-green/20 px-4 py-2.5 text-sm font-semibold text-team-green-dark disabled:opacity-50 active:bg-team-cream"
          >
            Clear
          </button>
        )}
      </div>
      {status && (
        <p className="mt-2 text-[12px] text-team-green/60">{status}</p>
      )}
      {current && (
        <div className="mt-3 rounded-xl border-l-4 border-team-gold bg-team-gold/10 p-3 text-[13px] text-team-green-dark">
          <span className="font-bold">Live now:</span> {current.message}
        </div>
      )}
    </section>
  );
}

// ─── Games tab ────────────────────────────────────────────────────────────────

type AddedGameEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  opponentName: string;
  addedAt: string;
};

function GamesTab() {
  const events = SCHEDULE.filter((e) => e.kind === "game" || e.kind === "practice");
  const [overrides, setOverrides] = useState<Record<string, EventOverride>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState({ date: "", startTime: "", endTime: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [sendEmails, setSendEmails] = useState(true);

  // Added games state
  const [addedGames, setAddedGames] = useState<AddedGameEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ date: "", startTime: "11:00", opponentName: "", location: "Smith School" });
  const [addBusy, setAddBusy] = useState(false);

  useEffect(() => {
    fetch("/api/overrides")
      .then((r) => r.json())
      .then(setOverrides)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/added-games")
      .then((r) => r.json())
      .then(setAddedGames)
      .catch(() => { });
  }, []);

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.date || !addForm.startTime || !addForm.opponentName.trim()) return;
    setAddBusy(true);
    try {
      const res = await fetch("/api/admin/add-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json() as { ok?: boolean; game?: AddedGameEntry };
      if (json.ok && json.game) {
        setAddedGames((prev) => [...prev, json.game!]);
        setAddForm({ date: "", startTime: "11:00", opponentName: "", location: "Smith School" });
        setShowAddForm(false);
      }
    } finally {
      setAddBusy(false);
    }
  }

  async function handleRemoveAdded(id: string) {
    await fetch("/api/admin/add-game", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAddedGames((prev) => prev.filter((g) => g.id !== id));
  }

  async function doAction(
    eventId: string,
    action: "cancel" | "reschedule" | "restore",
    extra?: { newDate?: string; newStartTime?: string; newEndTime?: string }
  ) {
    setBusy(eventId);
    try {
      await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action, sendEmails, ...extra }),
      });
      if (action === "restore") {
        setOverrides((prev) => {
          const n = { ...prev };
          delete n[eventId];
          return n;
        });
      } else {
        setOverrides((prev) => ({
          ...prev,
          [eventId]: {
            status: action === "cancel" ? "cancelled" : "rescheduled",
            ...extra,
          },
        }));
      }
      setEditing(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <SectionHeading>Schedule</SectionHeading>

      {/* ── Add game ── */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="tap mb-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm font-bold text-blue-700 active:bg-blue-100"
        >
          + Add game to schedule
        </button>
      ) : (
        <form onSubmit={handleAddGame} className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wider text-blue-700">
            New game
          </div>
          <div className="flex flex-col gap-2">
            <label className="block">
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/60">Opponent name</span>
              <input
                type="text"
                placeholder="e.g. Park Ridge All-Stars"
                value={addForm.opponentName}
                onChange={(e) => setAddForm((f) => ({ ...f, opponentName: e.target.value }))}
                className="tap w-full rounded-lg border border-blue-200 bg-white px-3 text-[14px] text-team-green-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/60">Date</span>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                  className="tap w-full rounded-lg border border-blue-200 bg-white px-2 text-[13px] text-team-green-dark focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/60">Start time</span>
                <input
                  type="time"
                  value={addForm.startTime}
                  onChange={(e) => setAddForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="tap w-full rounded-lg border border-blue-200 bg-white px-2 text-[13px] text-team-green-dark focus:outline-none"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/60">Location</span>
              <input
                type="text"
                placeholder="Smith School"
                value={addForm.location}
                onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                className="tap w-full rounded-lg border border-blue-200 bg-white px-3 text-[14px] text-team-green-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="tap flex-1 rounded-xl border border-team-green/20 py-2.5 text-[12px] font-semibold text-team-green-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addBusy || !addForm.date || !addForm.opponentName.trim()}
              className="tap flex-[2] rounded-xl bg-blue-600 py-2.5 text-[12px] font-bold text-white disabled:opacity-50 active:bg-blue-700"
            >
              {addBusy ? "Adding…" : "Add to schedule"}
            </button>
          </div>
        </form>
      )}

      {/* Added games list */}
      {addedGames.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Coach-added games
          </div>
          <ul className="flex flex-col gap-2">
            {addedGames.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                    {g.date} · {g.startTime}
                  </div>
                  <div className="font-bold text-team-green-dark">vs. {g.opponentName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAdded(g.id)}
                  className="tap text-[11px] font-semibold text-red-500 active:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="mb-3 flex items-center gap-2 text-[13px] text-team-green-dark">
        <input
          type="checkbox"
          checked={sendEmails}
          onChange={(e) => setSendEmails(e.target.checked)}
          className="h-4 w-4 accent-team-green"
        />
        Notify subscribers by email when I make changes
      </label>

      <ul className="flex flex-col gap-2">
        {events.map((event) => {
          const ov = overrides[event.id];
          const isBusy = busy === event.id;
          const isEditing = editing === event.id;
          const opponent = event.opponent ? TEAMS[event.opponent] : null;
          const isPractice = event.kind === "practice";

          return (
            <li
              key={event.id}
              className={clsx(
                "rounded-2xl border p-3",
                ov?.status === "cancelled"
                  ? "border-red-200 bg-red-50"
                  : ov?.status === "rescheduled"
                    ? "border-team-gold/40 bg-team-gold/10"
                    : isPractice
                      ? "border-team-yellow/50 bg-team-yellow/5"
                      : "border-team-green/15 bg-white"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-team-green/50">
                    {isPractice ? "Practice · " : "Game · "}{ov?.newDate ?? event.date} · {ov?.newStartTime ?? event.startTime}
                  </div>
                  <div className="font-bold text-team-green-dark">
                    {isPractice ? "Team 3 & Team 4" : `vs. ${opponent?.sponsor ?? "TBD"}`}
                  </div>
                  {ov && (
                    <div className={clsx(
                      "mt-0.5 text-[11px] font-semibold",
                      ov.status === "cancelled" ? "text-red-600" : "text-team-gold-dark"
                    )}>
                      {ov.status === "cancelled" ? "CANCELLED" : `RESCHEDULED${ov.newDate ? ` → ${ov.newDate}` : ""}${ov.newStartTime ? ` ${ov.newStartTime}` : ""}`}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {ov ? (
                    <button
                      type="button"
                      onClick={() => doAction(event.id, "restore")}
                      disabled={isBusy}
                      className="tap rounded-lg bg-team-green/10 px-3 py-1.5 text-[11px] font-bold text-team-green-dark active:bg-team-green/20 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(event.id);
                          setEditData({ date: event.date, startTime: event.startTime ?? "", endTime: event.endTime ?? "" });
                        }}
                        className="tap rounded-lg bg-team-gold/20 px-3 py-1.5 text-[11px] font-bold text-team-green-dark active:bg-team-gold/40"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => doAction(event.id, "cancel")}
                        disabled={isBusy}
                        className="tap rounded-lg bg-red-100 px-3 py-1.5 text-[11px] font-bold text-red-700 active:bg-red-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 border-t border-team-green/10 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/50">New date</span>
                      <input type="date" value={editData.date} onChange={(e) => setEditData((d) => ({ ...d, date: e.target.value }))}
                        className="tap w-full rounded-lg border border-team-green/20 bg-team-cream px-2 text-[13px] text-team-green-dark focus:outline-none" />
                    </label>
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/50">Start</span>
                      <input type="time" value={editData.startTime} onChange={(e) => setEditData((d) => ({ ...d, startTime: e.target.value }))}
                        className="tap w-full rounded-lg border border-team-green/20 bg-team-cream px-2 text-[13px] text-team-green-dark focus:outline-none" />
                    </label>
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-team-green/50">End</span>
                      <input type="time" value={editData.endTime} onChange={(e) => setEditData((d) => ({ ...d, endTime: e.target.value }))}
                        className="tap w-full rounded-lg border border-team-green/20 bg-team-cream px-2 text-[13px] text-team-green-dark focus:outline-none" />
                    </label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setEditing(null)}
                      className="tap flex-1 rounded-lg border border-team-green/20 py-2 text-[12px] font-semibold text-team-green-dark">
                      Cancel
                    </button>
                    <button type="button" disabled={isBusy}
                      onClick={() => doAction(event.id, "reschedule", { newDate: editData.date, newStartTime: editData.startTime, newEndTime: editData.endTime })}
                      className="tap flex-[2] rounded-lg bg-team-green py-2 text-[12px] font-bold text-team-gold disabled:opacity-50">
                      Save & notify
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Subscribers tab ──────────────────────────────────────────────────────────

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then(setSubscribers)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  async function remove(email: string) {
    await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubscribers((prev) => prev.filter((e) => e !== email));
  }

  return (
    <section>
      <SectionHeading>
        Calendar Subscribers{" "}
        <span className="text-sm font-normal text-team-green/50">
          ({subscribers.length})
        </span>
      </SectionHeading>
      <CalendarLinkCard />
      {loading ? (
        <p className="text-[13px] text-team-green/50">Loading…</p>
      ) : subscribers.length === 0 ? (
        <p className="text-[13px] text-team-green/50">No subscribers yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {subscribers.map((email) => (
            <li key={email} className="flex items-center justify-between rounded-xl border border-team-green/10 bg-white px-3 py-2.5">
              <span className="truncate text-[13px] text-team-green-dark">{email}</span>
              <button
                type="button"
                onClick={() => remove(email)}
                className="tap ml-2 shrink-0 text-[11px] font-semibold text-red-500 active:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Roster tab ───────────────────────────────────────────────────────────────

function RosterTab() {
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"closed" | "add" | { mode: "edit"; player: Player }>("closed");

  async function refresh() {
    const r = await fetch("/api/admin/roster");
    if (r.ok) setRoster(await r.json());
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleSubmit(player: Player) {
    await fetch("/api/admin/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });
    await refresh();
    setFormMode("closed");
  }

  async function handleRemove(id: string) {
    await fetch("/api/admin/roster", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRoster((prev) => prev.filter((p) => p.id !== id));
  }

  const sorted = [...roster].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

  return (
    <AudioProvider>
      <section>
        <SectionHeading>Team Roster</SectionHeading>

        {formMode === "closed" && (
          <button
            type="button"
            onClick={() => setFormMode("add")}
            className="tap mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-team-green py-3 text-sm font-bold text-team-gold active:bg-team-green-dark"
          >
            + Add player
          </button>
        )}

        {formMode === "add" && (
          <div className="mb-4">
            <AddPlayerForm
              mode="add"
              onSubmit={handleSubmit}
              onCancel={() => setFormMode("closed")}
            />
          </div>
        )}

        {typeof formMode === "object" && formMode.mode === "edit" && (
          <div className="mb-4">
            <AddPlayerForm
              mode="edit"
              initial={formMode.player}
              onSubmit={handleSubmit}
              onCancel={() => setFormMode("closed")}
            />
          </div>
        )}

        {loading ? (
          <p className="text-[13px] text-team-green/50">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-[13px] text-team-green/50">No players yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border border-team-green/15 bg-white px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-team-green text-sm font-black text-team-gold">
                    #{p.jerseyNumber}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-team-green-dark">{p.firstName}</div>
                    {p.song && (
                      <div className="truncate text-[11px] text-team-green/60">
                        {p.song.trackName} — {p.song.artistName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMode({ mode: "edit", player: p })}
                    className="tap text-[11px] font-semibold text-team-green-dark underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    className="tap text-[11px] font-semibold text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AudioProvider>
  );
}

// ─── Lineup tab ───────────────────────────────────────────────────────────────

const FIELD_POSITIONS = [
  "1st Base",
  "2nd Base",
  "3rd Base",
  "Pitcher 1",
  "Pitcher 2",
  "Shortstop",
  "Outfield 1st",
  "Outfield 2nd",
  "Outfield 3rd",
];

type LineupTabProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  absentIds: Set<string>;
  setAbsentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  loaded: boolean;
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
};

const LINEUP_LS_KEY = "afc-lineup-order";

/** Read saved player-ID order from localStorage. Returns null if nothing saved. */
function loadStoredOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(LINEUP_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

/** Persist current player-ID order to localStorage. */
function saveOrderToStorage(players: Player[]) {
  try {
    localStorage.setItem(LINEUP_LS_KEY, JSON.stringify(players.map((p) => p.id)));
  } catch {}
}

/**
 * Apply a saved ID order to a freshly fetched player list.
 * - Players in the saved order appear first (in that order).
 * - Any new players not in the saved order are appended sorted by jersey number.
 */
function applyStoredOrder(fetched: Player[], savedIds: string[]): Player[] {
  const byId = Object.fromEntries(fetched.map((p) => [p.id, p]));
  const ordered = savedIds.filter((id) => byId[id]).map((id) => byId[id]);
  const savedSet = new Set(savedIds);
  const newPlayers = fetched
    .filter((p) => !savedSet.has(p.id))
    .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  return [...ordered, ...newPlayers];
}

function LineupTab({ players, setPlayers, absentIds, setAbsentIds, loaded, setLoaded }: LineupTabProps) {
  const [fetching, setFetching] = useState(false);
  const [absentOpen, setAbsentOpen] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  /** Initial load — honours localStorage order; new players appended in jersey order. */
  async function fetchRoster() {
    setFetching(true);
    try {
      const r = await fetch("/api/roster");
      if (r.ok) {
        const data = (await r.json()) as Player[];
        const savedIds = loadStoredOrder();
        const ordered = savedIds ? applyStoredOrder(data, savedIds) : [...data].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
        setPlayers(ordered);
        setLoaded(true);
      }
    } finally {
      setFetching(false);
    }
  }

  /** Refresh — resets to jersey-number order and clears any saved order. */
  async function refreshRoster() {
    setFetching(true);
    try {
      const r = await fetch("/api/roster");
      if (r.ok) {
        const data = (await r.json()) as Player[];
        const ordered = [...data].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
        setPlayers(ordered);
        saveOrderToStorage(ordered);
        setLoaded(true);
      }
    } finally {
      setFetching(false);
    }
  }

  // Only fetch on first visit — Refresh button calls refreshRoster() explicitly
  useEffect(() => {
    if (!loaded) fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate last player to first — saves new order to localStorage immediately
  function shift() {
    setPlayers((prev) => {
      if (prev.length < 2) return prev;
      const next = [prev[prev.length - 1], ...prev.slice(0, -1)];
      saveOrderToStorage(next);
      return next;
    });
    setLogStatus(null);
  }

  function toggleAbsent(id: string) {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Active batting order = full rotation with absent players filtered out
  const activePlayers = players.filter((p) => !absentIds.has(p.id));

  async function logLineup() {
    if (activePlayers.length === 0) return;
    setLogBusy(true);
    setLogStatus(null);
    const entries: LineupEntry[] = activePlayers.map((p, i) => ({
      batPosition: i + 1,
      playerId: p.id,
      playerName: p.firstName,
      fieldPosition: FIELD_POSITIONS[i] ?? "—",
    }));
    const log: LineupLog = {
      id: `lineup-${Date.now()}`,
      loggedAt: new Date().toISOString(),
      entries,
    };
    try {
      await fetch("/api/admin/lineup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      setLogStatus("Lineup saved to history.");
    } catch {
      setLogStatus("Error — try again.");
    } finally {
      setLogBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading>Game Lineup</SectionHeading>

      {/* Controls */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={shift}
          disabled={activePlayers.length < 2}
          className="tap flex-1 rounded-xl bg-team-green py-2.5 text-sm font-bold text-team-gold disabled:opacity-40 active:bg-team-green-dark"
        >
          Shift ↓
        </button>
        <button
          type="button"
          onClick={refreshRoster}
          className="tap rounded-xl border border-team-green/20 px-4 py-2.5 text-sm font-semibold text-team-green-dark active:bg-team-cream"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={logLineup}
          disabled={logBusy || activePlayers.length === 0}
          className="tap rounded-xl bg-team-gold px-4 py-2.5 text-sm font-bold text-team-green-dark disabled:opacity-40 active:opacity-80"
        >
          {logBusy ? "Saving…" : "Log"}
        </button>
      </div>
      {logStatus && (
        <p className="mb-3 text-[12px] text-team-green/60">{logStatus}</p>
      )}

      {!loaded || fetching ? (
        <div className="h-48 animate-pulse rounded-2xl bg-team-green/10" />
      ) : players.length === 0 ? (
        <p className="text-[13px] text-team-green/50">
          No players on roster yet. Add players on the Roster tab first.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-team-green/15 bg-white">
          {/* Header row */}
          <div className="grid grid-cols-3 bg-team-green px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-team-gold">
              Bat Order
            </span>
            <span className="text-center text-[11px] font-bold uppercase tracking-wider text-team-gold">
              Player
            </span>
            <span className="text-right text-[11px] font-bold uppercase tracking-wider text-team-gold">
              Field
            </span>
          </div>
          {Array.from({ length: 9 }, (_, i) => {
            const player = activePlayers[i];
            return (
              <div
                key={i}
                className={clsx(
                  "grid grid-cols-3 items-center px-3 py-2.5",
                  i < 8 && "border-b border-team-green/10",
                  !player && "opacity-35"
                )}
              >
                <span className="text-[12px] font-semibold text-team-green/60">
                  Bat {i + 1}
                </span>
                <span className="text-center text-[14px] font-bold text-team-green-dark">
                  {player?.firstName ?? "—"}
                </span>
                <span className="text-right text-[12px] text-team-green/70">
                  {FIELD_POSITIONS[i]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Absent collapsible */}
      {players.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setAbsentOpen((v) => !v)}
            className="tap flex w-full items-center justify-between rounded-xl border border-team-green/15 bg-white px-4 py-3"
          >
            <span className="text-[13px] font-semibold text-team-green-dark">
              Mark Absent
              {absentIds.size > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                  {absentIds.size} out
                </span>
              )}
            </span>
            <span
              className={clsx(
                "transition-transform duration-200",
                absentOpen ? "rotate-180" : ""
              )}
            >
              <ChevronDownSmall />
            </span>
          </button>

          {absentOpen && (
            <div className="mt-1 rounded-xl border border-team-green/15 bg-white p-3">
              <p className="mb-2.5 text-[11px] text-team-green/50">
                Tap to mark absent (dimmed). Tap again to return to batting order.
              </p>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const absent = absentIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAbsent(p.id)}
                      className={clsx(
                        "tap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all",
                        absent
                          ? "bg-team-green/10 text-team-green/35 line-through"
                          : "bg-team-green text-team-gold shadow-sm"
                      )}
                    >
                      {p.firstName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [logs, setLogs] = useState<LineupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/lineup")
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  async function clearHistory() {
    setClearing(true);
    try {
      await fetch("/api/admin/lineup", { method: "DELETE" });
      setLogs([]);
      setConfirming(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-team-green-dark">Lineup History</h2>
        {logs.length > 0 && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="tap text-[12px] font-semibold text-red-500 active:text-red-700"
          >
            Clear all
          </button>
        )}
        {confirming && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="tap text-[12px] font-semibold text-team-green/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearHistory}
              disabled={clearing}
              className="tap rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50 active:bg-red-600"
            >
              {clearing ? "Clearing…" : "Yes, clear"}
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <p className="text-[13px] text-team-green/50">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-[13px] text-team-green/50">
          No lineups logged yet. Use the Log button in the Lineup tab to save an order.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="overflow-hidden rounded-2xl border border-team-green/15 bg-white"
            >
              <div className="bg-team-green px-3 py-2">
                <div className="text-[12px] font-bold text-team-gold">
                  {new Date(log.loggedAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {new Date(log.loggedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="divide-y divide-team-green/10">
                {log.entries.map((entry) => (
                  <div
                    key={entry.batPosition}
                    className="grid grid-cols-3 items-center px-3 py-2"
                  >
                    <span className="text-[11px] text-team-green/50">
                      Bat {entry.batPosition}
                    </span>
                    <span className="text-center text-[13px] font-bold text-team-green-dark">
                      {entry.playerName}
                    </span>
                    <span className="text-right text-[11px] text-team-green/60">
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

function ChevronDownSmall() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-base font-bold text-team-green-dark">{children}</h2>
  );
}
