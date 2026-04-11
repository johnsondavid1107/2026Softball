"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

function formatClock(d: Date): { date: string; time: string } {
  return {
    date: d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function Nav() {
  const pathname = usePathname();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Tick every second. Cheap — only updates the two small strings in the nav.
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { date, time } = formatClock(now);
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <header className="safe-top sticky top-0 z-40 bg-team-green text-team-cream shadow-card">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-team-yellow">
            Team 3
          </span>
          <span className="truncate text-base font-bold leading-tight">
            AFC Urgent Care
          </span>
        </div>
        <div
          className="flex flex-col items-end text-right font-medium tabular-nums"
          aria-live="off"
        >
          <span className="text-[11px] uppercase tracking-wider text-team-yellow-light/90">
            {date}
          </span>
          <span className="text-base font-bold leading-tight">{time}</span>
        </div>
      </div>
      {!isAdmin && (
        <nav className="flex border-t border-team-green-dark/40">
          <NavTab href="/" label="Schedule" active={pathname === "/"} />
          <NavTab
            href="/history"
            label="History"
            active={pathname?.startsWith("/history") ?? false}
          />
          <NavTab
            href="/roster"
            label="Roster"
            active={pathname?.startsWith("/roster") ?? false}
          />
        </nav>
      )}
    </header>
  );
}

function NavTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "tap flex flex-1 items-center justify-center px-3 py-2.5 text-sm font-semibold transition-colors active:bg-team-green-dark",
        active
          ? "text-team-yellow border-b-2 border-team-yellow"
          : "text-team-cream/75 border-b-2 border-transparent"
      )}
    >
      {label}
    </Link>
  );
}
