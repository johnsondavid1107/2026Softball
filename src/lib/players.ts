/**
 * Roster data. The Player and WalkOutSong types are the source of truth.
 * PLACEHOLDER_ROSTER is intentionally empty — parents add their own children
 * via the "Add my child" form on the roster page (stored in localStorage
 * until the admin/KV backend is wired).
 */

export type WalkOutSong = {
  trackName: string;
  artistName: string;
  /**
   * Direct 30-second mp3/aac preview URL from iTunes Search API.
   * Optional — when a parent uses "Add anyway" the song is saved as
   * text only with no preview clip.
   */
  previewUrl?: string;
  /** 100px album art URL. Optional for the same reason as previewUrl. */
  artworkUrl?: string;
};

export type Player = {
  id: string;
  firstName: string;
  jerseyNumber: number;
  song?: WalkOutSong;
};

export const PLACEHOLDER_ROSTER: Player[] = [];
