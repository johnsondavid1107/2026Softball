/**
 * Placeholder admin page. This will be password-gated and wired up to:
 *  - Toggle/clear the announcement banner (KV)
 *  - Edit/cancel individual events (push .ics updates via Resend)
 *  - Manage subscriber list
 *  - CRUD roster players + walk-out songs (iTunes search)
 *
 * Not functional yet — we're waiting on Resend + Vercel KV provisioning.
 */
export default function AdminPage() {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-team-green/60">
        Admin
      </div>
      <h1 className="mt-1 text-2xl font-bold text-team-green-dark">
        Coach Panel
      </h1>
      <p className="mx-auto mt-3 max-w-xs text-sm text-team-green/70">
        This page will let you post announcements, edit or cancel games, and
        manage the roster. Coming online once email + storage are wired.
      </p>
    </div>
  );
}
