"use client";

import { useEffect, useState } from "react";

type BannerData = {
  message: string;
  postedAt: string; // ISO
} | null;

/**
 * Top-of-page announcement banner for rain-outs, jersey color notes, etc.
 *
 * TODO: swap this local-stub data source for a GET /api/banner route backed by
 * Vercel KV once the admin panel + KV are wired up. The component shape will
 * not need to change.
 */
export function Banner() {
  const [banner, setBanner] = useState<BannerData>(null);

  useEffect(() => {
    // Placeholder — no fetch yet. Component is ready to flip to fetch().
    setBanner(null);
  }, []);

  if (!banner) return null;

  const ago = timeAgo(banner.postedAt);

  return (
    <div
      role="status"
      className="mx-4 mt-4 rounded-2xl border-l-[6px] border-team-yellow bg-team-yellow/15 px-4 py-3 shadow-card"
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-team-yellow-dark">
        Coach Update · {ago}
      </div>
      <div className="mt-1 text-[15px] font-semibold leading-snug text-team-green-dark">
        {banner.message}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
