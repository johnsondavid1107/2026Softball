"use client";

import { useState } from "react";
import clsx from "clsx";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Email opt-in card. Currently a UI stub — the POST endpoint will be wired
 * to /api/subscribe once Resend + KV are provisioned. The form validates
 * locally, shows a success state, and is keyboard / screen-reader friendly.
 */
export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    try {
      // TODO: POST /api/subscribe once the backend is wired.
      await new Promise((r) => setTimeout(r, 600));
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="mx-4 mb-8 mt-2 rounded-2xl bg-team-green p-5 text-team-cream shadow-card-lg">
      <div className="text-[10px] font-bold uppercase tracking-wider text-team-yellow">
        Get game invites
      </div>
      <h2 className="mt-1 text-lg font-bold leading-tight">
        Every game on your calendar, automatically.
      </h2>
      <p className="mt-1 text-[13px] text-team-cream/80">
        Add your email and we&rsquo;ll send you a calendar invite for every
        game with a 1-hour reminder. If anything changes, your calendar
        updates on its own — no app, no sign-in.
      </p>

      {status === "success" ? (
        <div
          role="status"
          className="mt-4 rounded-xl bg-team-yellow px-4 py-3 text-center text-sm font-semibold text-team-green-dark"
        >
          ✓ You&rsquo;re on the list. Check your email for invites.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <label className="sr-only" htmlFor="subscribe-email">
            Email address
          </label>
          <input
            id="subscribe-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="tap rounded-xl border border-team-green-dark bg-team-cream px-4 text-team-green-dark placeholder:text-team-green/40 focus:outline-none focus:ring-2 focus:ring-team-yellow"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className={clsx(
              "tap rounded-xl bg-team-yellow px-4 text-base font-bold text-team-green-dark transition-opacity active:opacity-80",
              status === "submitting" && "opacity-60"
            )}
          >
            {status === "submitting" ? "Adding…" : "Send me invites"}
          </button>
          {error && (
            <div role="alert" className="text-[12px] text-team-yellow-light">
              {error}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
