"use client";

import clsx from "clsx";
import type { Player } from "@/lib/players";
import { useAudioPlayer } from "./AudioProvider";

type Props = {
  player: Player;
  /** When true, show edit + remove buttons (used for parent-added entries). */
  editable?: boolean;
  onEdit?: (player: Player) => void;
  onRemove?: (id: string) => void;
};

export function PlayerCard({ player, editable, onEdit, onRemove }: Props) {
  const { currentId, play } = useAudioPlayer();
  const isPlaying = currentId === player.id;
  const song = player.song;
  const hasPreview = !!song?.previewUrl;

  const initial = player.firstName.charAt(0).toUpperCase();

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-team-green/15 bg-white px-4 py-3 shadow-card">
      {/* Jersey number badge — rectangular tag with # prefix so it's never
          confused with a list position or ranking. */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-team-green py-2 shadow-inner">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-team-gold/70">
          jersey
        </span>
        <span className="text-[11px] font-bold leading-none text-team-gold/80">
          #
        </span>
        <span className="text-2xl font-black tabular-nums leading-none text-team-gold">
          {player.jerseyNumber}
        </span>
      </div>

      {/* Initial + song */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-lg font-black tracking-tight text-team-green-dark">
          {initial}.
        </div>
        {song ? (
          <div className="mt-0.5 flex items-center gap-2">
            {song.artworkUrl ? (
              <img
                src={song.artworkUrl}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-md"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-team-green/10 text-team-green/60">
                <MusicIcon />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight text-team-green-dark">
                {song.trackName}
              </div>
              <div className="truncate text-[11px] text-team-green/60">
                {song.artistName}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-[12px] italic text-team-green/50">
            No walk-out song yet
          </div>
        )}
      </div>

      {/* Right side: play / edit / remove */}
      <div className="flex shrink-0 items-center gap-1.5">
        {hasPreview && (
          <button
            type="button"
            onClick={() => play(player.id, song!.previewUrl!)}
            aria-label={
              isPlaying ? `Stop ${song!.trackName}` : `Play ${song!.trackName}`
            }
            className={clsx(
              "tap flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95",
              isPlaying
                ? "bg-team-gold text-team-green-dark"
                : "bg-team-green text-team-gold"
            )}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
        {editable && (
          <button
            type="button"
            onClick={() => onEdit?.(player)}
            aria-label={`Edit ${player.firstName}`}
            className="tap flex h-11 w-9 items-center justify-center text-team-green/40 active:text-team-green-dark"
          >
            <PencilIcon />
          </button>
        )}
        {editable && (
          <button
            type="button"
            onClick={() => onRemove?.(player.id)}
            aria-label={`Remove ${player.firstName}`}
            className="tap flex h-11 w-9 items-center justify-center text-team-green/40 active:text-team-green-dark"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm2 5h2v10h-2V8zm-4 0h2v10H7V8zm8 0h2v10h-2V8z" />
    </svg>
  );
}
