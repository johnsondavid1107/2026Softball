import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/itunes";

/**
 * Thin server-side proxy to the iTunes Search API.
 *
 * Why proxy instead of calling iTunes directly from the browser?
 *  - Avoids any future CORS/referer surprises.
 *  - Lets us add simple caching / rate limiting later without touching the UI.
 *  - Keeps the client bundle free of URL-building logic.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const term = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "5");

  if (!term.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSongs(term, Math.min(limit, 10));
    return NextResponse.json(
      { results },
      {
        headers: {
          // Cache identical searches for 10 min at the edge.
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
