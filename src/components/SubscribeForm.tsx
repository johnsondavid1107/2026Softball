"use client";

import { useState } from "react";
import clsx from "clsx";

type Status = "idle" | "submitting" | "success" | "already" | "error";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { ok?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "unknown");
      setStatus(json.alreadySubscribed ? "already" : "success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    /*
     * pt-5 creates space for the chevron pill to float above the card.
     * The pill is absolute-positioned at top-0 so it sits proud of the
     * card edge. When the card collapses, the card body rises up to meet
     * the pill — giving the "falls into the card" effect.
     */
    <div className="relative pt-5">
      {/* Chevron pill — floats above the card */}
      <div className="absolute top-0 inset-x-0 flex justify-center z-10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Minimize subscribe form" : "Expand subscribe form"}
          aria-expanded={open}
          className="flex items-center justify-center gap-1 rounded-full bg-team-green px-5 h-9 text-team-gold shadow-card-lg active:bg-team-green-dark transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {open ? "Close" : "Get invites"}
          </span>
          <span
            className={clsx(
              "transition-transform duration-300",
              open ? "rotate-0" : "rotate-180"
            )}
            aria-hidden
          >
            <ChevronDown />
          </span>
        </button>
      </div>

      {/* Card */}
      <section className="rounded-2xl bg-team-green text-team-cream shadow-card-lg overflow-hidden">
        {/* Always-visible header — tappable to also toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-5 pt-5 pb-3 text-left active:bg-team-green-dark transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-team-gold">
            Get game invites
          </div>
          <p className="mt-0.5 text-[13px] text-team-cream/80 leading-snug">
            {open
              ? "Every game on your calendar, automatically."
              : "Subscribe — all games & reminders in one tap."}
          </p>
        </button>

        {/* Collapsible body — animates with grid-rows */}
        <div
          className={clsx(
            "grid transition-[grid-template-rows] duration-300 ease-in-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5">
              <p className="text-[13px] text-team-cream/80">
                Enter your email and we&rsquo;ll send you a subscribe link. One tap adds
                all games with 1-hour reminders. Cancellations and reschedules sync on
                their own — no app, no sign-in.
              </p>

              {status === "success" && (
                <div role="status" className="mt-4 rounded-xl bg-team-gold px-4 py-3 text-center text-sm font-semibold text-team-green-dark">
                  ✓ Check your email for the calendar link.
                </div>
              )}

              {status === "already" && (
                <div role="status" className="mt-4 rounded-xl bg-team-gold/30 px-4 py-3 text-center text-sm text-team-cream">
                  You&rsquo;re already subscribed — check your inbox for the calendar link.
                </div>
              )}

              {(status === "idle" || status === "submitting" || status === "error") && (
                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
                  <label className="sr-only" htmlFor="subscribe-email">Email address</label>
                  <input
                    id="subscribe-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="tap rounded-xl border border-team-green-dark bg-team-cream px-4 text-team-green-dark placeholder:text-team-green/40 focus:outline-none focus:ring-2 focus:ring-team-gold"
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className={clsx(
                      "tap rounded-xl bg-team-gold px-4 text-base font-bold text-team-green-dark transition-opacity active:opacity-80",
                      status === "submitting" && "opacity-60"
                    )}
                  >
                    {status === "submitting" ? "Sending…" : "Send me invites"}
                  </button>
                  {error && <div role="alert" className="text-[12px] text-team-gold-light">{error}</div>}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
