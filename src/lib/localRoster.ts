/**
 * localStorage-backed roster store. This is a v1 stub: each parent's added
 * children live only on their own device. When Vercel KV is wired up, this
 * file will be replaced with a fetch-based store and the same shape — the
 * components do not need to change.
 */

import type { Player } from "./players";

const STORAGE_KEY = "team3-roster-local-v1";

/** Read the local roster. Safe to call on the server (returns []). */
export function readLocalRoster(): Player[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Player[];
  } catch {
    return [];
  }
}

/** Overwrite the local roster. */
export function writeLocalRoster(roster: Player[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    // Notify any other open tabs/components on this page.
    window.dispatchEvent(new Event("local-roster-updated"));
  } catch {
    // Quota exceeded or storage disabled — silently ignore for v1.
  }
}

/** A player ID is "local" iff it was created in this browser. */
export function isLocalPlayer(id: string): boolean {
  return id.startsWith("local-");
}

export function newLocalId(): string {
  return `local-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Trim, collapse whitespace, and keep only the first whitespace-delimited
 *  token so "  Sophie Jones " becomes "Sophie". Used to enforce first-name-only.
 */
export function normalizeFirstName(input: string): string {
  return input.trim().split(/\s+/)[0] ?? "";
}
