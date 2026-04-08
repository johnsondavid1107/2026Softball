import { NextResponse } from "next/server";
import { buildCalendarFeed } from "@/lib/ics";

export const runtime = "nodejs";

// Revalidate every 5 minutes at the CDN level; clients are also told to
// refresh every 6 hours via the REFRESH-INTERVAL header inside the feed.
export const revalidate = 300;

export async function GET() {
  const feed = await buildCalendarFeed();

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="afc-softball-2026.ics"',
      // Cache for 5 min at the edge; stale-while-revalidate for another 55 min.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3300",
    },
  });
}
