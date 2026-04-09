"use client";

import { useState, useEffect } from "react";

/**
 * Shows webcal + Google Calendar subscribe buttons.
 * Builds URLs from window.location so it always matches the deployed domain.
 */
export function CalendarLinks({ compact = false }: { compact?: boolean }) {
  const [origin, setOrigin] = useState("");

  // Must run client-side — window isn't available during SSR.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!origin) return null;

  const https = `${origin}/api/calendar`;
  const webcal = https.replace(/^https?/, "webcal");
  const google = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;

  return (
    <div className={compact ? "flex flex-col gap-2" : "mt-4 flex flex-col gap-2"}>
      <a
        href={webcal}
        className="flex items-center justify-center gap-2 rounded-xl bg-team-cream py-3 text-[13px] font-bold text-team-green-dark active:bg-team-cream/80"
      >
        📅 Add to Apple Calendar
      </a>
      <a
        href={google}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-team-gold py-3 text-[13px] font-bold text-team-green-dark active:opacity-80"
      >
        Add to Google Calendar
      </a>
      {!compact && (
        <p className="text-center text-[11px] text-team-cream/60 leading-snug">
          One tap adds all games with 1-hour reminders.{"\n"}Updates sync automatically.
        </p>
      )}
    </div>
  );
}

/** Copyable link card for the admin panel. */
export function CalendarLinkCard() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!origin) return null;

  const https = `${origin}/api/calendar`;
  const webcal = https.replace(/^https?/, "webcal");
  const google = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;

  function copyLink() {
    navigator.clipboard.writeText(webcal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-700">
        Share with existing subscribers
      </div>
      <p className="mb-3 text-[12px] text-blue-900/70 leading-snug">
        Text or email this link to parents who already signed up. One tap subscribes them to the full schedule.
      </p>
      <div className="flex gap-2 mb-3">
        <a
          href={google}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex-1 rounded-xl bg-white border border-blue-200 py-2.5 text-center text-[12px] font-bold text-blue-700 active:bg-blue-100"
        >
          Google Cal link ↗
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="tap flex-1 rounded-xl bg-blue-600 py-2.5 text-[12px] font-bold text-white active:bg-blue-700"
        >
          {copied ? "✓ Copied!" : "Copy Apple link"}
        </button>
      </div>
      <div className="rounded-lg bg-white border border-blue-100 px-3 py-2 text-[10px] text-blue-600 font-mono break-all">
        {webcal}
      </div>
    </div>
  );
}
