/**
 * iTunes Search API — free, no auth, returns a 30-second preview URL and
 * artwork for nearly any song. Used by the admin "Add walk-out song" flow.
 *
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

export type ITunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
};

type ITunesResponse = {
  resultCount: number;
  results: ITunesResult[];
};

export async function searchSongs(
  term: string,
  limit = 5,
  signal?: AbortSignal
): Promise<ITunesResult[]> {
  if (!term.trim()) return [];
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`iTunes search ${res.status}`);
  const json = (await res.json()) as ITunesResponse;
  // Filter out results missing a previewUrl — occasionally happens for
  // region-restricted tracks.
  return json.results.filter((r) => !!r.previewUrl);
}
