"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Player, WalkOutSong } from "@/lib/players";
import { newLocalId, normalizeFirstName } from "@/lib/localRoster";
import { useAudioPlayer } from "./AudioProvider";

type Props = {
  onAdd: (player: Player) => void;
};

type SongHit = {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
};

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; hits: SongHit[] }
  | { kind: "empty" }
  | { kind: "error" };

export function AddPlayerForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [jersey, setJersey] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ kind: "idle" });
  const [chosen, setChosen] = useState<WalkOutSong | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { play, currentId, stop } = useAudioPlayer();

  // Debounced iTunes search whenever the user types in the song field.
  useEffect(() => {
    if (chosen) return; // user already picked one — don't keep searching
    const term = songQuery.trim();
    if (term.length < 2) {
      setSearch({ kind: "idle" });
      return;
    }
    setSearch({ kind: "loading" });
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/itunes-search?q=${encodeURIComponent(term)}&limit=5`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { results: SongHit[] };
        setSearch(
          json.results.length > 0
            ? { kind: "results", hits: json.results }
            : { kind: "empty" }
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSearch({ kind: "error" });
      }
    }, 350);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [songQuery, chosen]);

  // Stop any preview playback when the form closes.
  useEffect(() => {
    if (!open) stop();
  }, [open, stop]);

  function reset() {
    setFirstName("");
    setJersey("");
    setSongQuery("");
    setSearch({ kind: "idle" });
    setChosen(null);
    setFormError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function pick(hit: SongHit) {
    setChosen({
      trackName: hit.trackName,
      artistName: hit.artistName,
      previewUrl: hit.previewUrl,
      artworkUrl: hit.artworkUrl100,
    });
    setSongQuery(`${hit.trackName} — ${hit.artistName}`);
    setSearch({ kind: "idle" });
    stop();
  }

  function clearChosen() {
    setChosen(null);
    setSongQuery("");
    stop();
  }

  function addAnyway() {
    const term = songQuery.trim();
    if (!term) return;
    // Try to split "Title - Artist" if the user typed it that way.
    const m = term.match(/^(.*?)\s+[-–—]\s+(.*)$/);
    const trackName = m ? m[1].trim() : term;
    const artistName = m ? m[2].trim() : "Unknown artist";
    setChosen({ trackName, artistName });
    setSongQuery(`${trackName} — ${artistName}`);
    setSearch({ kind: "idle" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = normalizeFirstName(firstName);
    if (!name) {
      setFormError("Please enter a first name.");
      return;
    }
    const num = parseInt(jersey, 10);
    if (!Number.isFinite(num) || num <= 0 || num > 999) {
      setFormError("Please enter a jersey number.");
      return;
    }
    onAdd({
      id: newLocalId(),
      firstName: name,
      jerseyNumber: num,
      song: chosen ?? undefined,
    });
    close();
  }

  if (!open) {
    return (
      <div className="px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-team-green px-4 py-3 text-base font-bold text-team-gold shadow-card-lg active:bg-team-green-dark"
        >
          <PlusIcon />
          Add my child
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mx-4 mt-2 mb-4 rounded-2xl border border-team-green/15 bg-white p-4 shadow-card-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-team-green-dark">
          Add a player
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="tap -mr-2 flex h-9 w-9 items-center justify-center text-team-green/50 active:text-team-green-dark"
        >
          <CloseIcon />
        </button>
      </div>

      {/* First name */}
      <Field label="First name">
        <input
          type="text"
          autoComplete="given-name"
          autoFocus
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Sophie"
          className="tap w-full rounded-xl border border-team-green/20 bg-team-cream px-3 text-team-green-dark placeholder:text-team-green/30 focus:border-team-green focus:outline-none focus:ring-2 focus:ring-team-gold/40"
        />
        <p className="mt-1 text-[11px] text-team-green/50">
          First name only — anything after a space will be removed.
        </p>
      </Field>

      {/* Jersey number */}
      <Field label="Jersey number">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          value={jersey}
          onChange={(e) => setJersey(e.target.value)}
          placeholder="7"
          className="tap w-full rounded-xl border border-team-green/20 bg-team-cream px-3 text-team-green-dark placeholder:text-team-green/30 focus:border-team-green focus:outline-none focus:ring-2 focus:ring-team-gold/40"
        />
      </Field>

      {/* Song search */}
      <Field label="Walk-out song (optional)">
        <div className="relative">
          <input
            type="text"
            value={songQuery}
            onChange={(e) => {
              setSongQuery(e.target.value);
              if (chosen) setChosen(null);
            }}
            placeholder="Search a song or artist…"
            className="tap w-full rounded-xl border border-team-green/20 bg-team-cream px-3 pr-9 text-team-green-dark placeholder:text-team-green/30 focus:border-team-green focus:outline-none focus:ring-2 focus:ring-team-gold/40"
          />
          {songQuery && (
            <button
              type="button"
              onClick={clearChosen}
              aria-label="Clear song"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-team-green/40 active:text-team-green-dark"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Search feedback */}
        {!chosen && search.kind === "loading" && (
          <p className="mt-2 text-[12px] text-team-green/60">Searching…</p>
        )}

        {!chosen && search.kind === "error" && (
          <p className="mt-2 text-[12px] text-team-gold-dark">
            Couldn&rsquo;t reach the music search. Try again or add anyway.
          </p>
        )}

        {!chosen && search.kind === "results" && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {search.hits.map((hit) => (
              <SongHitRow
                key={hit.trackId}
                hit={hit}
                isPlaying={currentId === `hit-${hit.trackId}`}
                onPlay={() =>
                  play(`hit-${hit.trackId}`, hit.previewUrl)
                }
                onPick={() => pick(hit)}
              />
            ))}
            <p className="mt-1 px-1 text-[11px] text-team-green/50">
              Don&rsquo;t see it?{" "}
              <button
                type="button"
                onClick={addAnyway}
                className="font-semibold text-team-green-dark underline"
              >
                Add anyway
              </button>{" "}
              — we&rsquo;ll save the text without a clip.
            </p>
          </ul>
        )}

        {!chosen && search.kind === "empty" && (
          <div className="mt-2 rounded-xl border border-dashed border-team-green/25 bg-team-cream/60 p-3">
            <div className="text-[12px] text-team-green/70">
              No results for &ldquo;{songQuery}&rdquo;.
            </div>
            <button
              type="button"
              onClick={addAnyway}
              className="tap mt-2 w-full rounded-lg bg-team-gold px-3 py-2 text-[13px] font-bold text-team-green-dark active:opacity-80"
            >
              Add anyway (text only)
            </button>
          </div>
        )}

        {chosen && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-team-green/5 p-2">
            {chosen.artworkUrl ? (
              <img
                src={chosen.artworkUrl}
                alt=""
                className="h-9 w-9 rounded-md"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-team-green/10 text-team-green/60">
                <MusicIcon />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-team-green-dark">
                {chosen.trackName}
              </div>
              <div className="truncate text-[11px] text-team-green/60">
                {chosen.artistName}
                {!chosen.previewUrl && " • text only"}
              </div>
            </div>
            <span className="text-team-green-dark" aria-hidden>
              ✓
            </span>
          </div>
        )}
      </Field>

      {formError && (
        <div role="alert" className="mb-2 text-[12px] text-team-gold-dark">
          {formError}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={close}
          className="tap flex-1 rounded-xl border border-team-green/20 bg-white px-3 py-2.5 text-sm font-semibold text-team-green-dark active:bg-team-cream"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="tap flex-[2] rounded-xl bg-team-green px-3 py-2.5 text-sm font-bold text-team-gold active:bg-team-green-dark"
        >
          Add to roster
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-team-green/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function SongHitRow({
  hit,
  isPlaying,
  onPlay,
  onPick,
}: {
  hit: SongHit;
  isPlaying: boolean;
  onPlay: () => void;
  onPick: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-team-green/10 bg-team-cream/60 p-2">
      <img
        src={hit.artworkUrl100}
        alt=""
        className="h-10 w-10 shrink-0 rounded-md"
      />
      <button
        type="button"
        onClick={onPick}
        className="min-w-0 flex-1 text-left active:opacity-60"
      >
        <div className="truncate text-[13px] font-semibold leading-tight text-team-green-dark">
          {hit.trackName}
        </div>
        <div className="truncate text-[11px] text-team-green/60">
          {hit.artistName}
        </div>
      </button>
      <button
        type="button"
        onClick={onPlay}
        aria-label={isPlaying ? "Stop preview" : "Play preview"}
        className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-team-green/10 text-team-green-dark active:bg-team-green/20"
      >
        {isPlaying ? <PauseIconSm /> : <PlayIconSm />}
      </button>
    </li>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.3 5.71L12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7l-1.42-1.42L9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />
    </svg>
  );
}

function PlayIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
    </svg>
  );
}
