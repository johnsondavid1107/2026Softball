/**
 * Resend email wrapper.
 *
 * subscribe flow  → sendSeasonInvites()  sends one email with the webcal://
 *                   subscription link so parents add all games in one tap.
 *
 * admin update    → sendGameUpdate()     sends a plain-text notification that
 *                   tells parents their calendar will update automatically.
 *
 * Env vars:
 *   RESEND_API_KEY        — Resend API key
 *   EMAIL_FROM            — "Name <email>" string
 *   NEXT_PUBLIC_APP_URL   — canonical origin, e.g. https://hillsdale-softball.vercel.app
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail(opts: SendOptions): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "AFC Urgent Care <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

/** Build the calendar feed URL for use in emails. */
function calendarUrl(): { webcal: string; google: string; https: string } {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://hillsdale-softball.vercel.app";

  const https = `${base}/api/calendar`;
  const webcal = https.replace(/^https?:\/\//, "webcal://");
  const google = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;

  return { webcal, google, https };
}

/**
 * Send a subscription confirmation email to a newly-subscribed parent.
 * Includes the webcal:// link (one tap to subscribe on iPhone) and
 * a Google Calendar link for Android/desktop users.
 */
export async function sendSeasonInvites(email: string): Promise<void> {
  const { webcal, google, https } = calendarUrl();

  const text = [
    "You're subscribed to the AFC Urgent Care 2026 softball schedule!",
    "",
    "Add all games to your calendar with one tap:",
    "",
    "• iPhone / Apple Calendar:",
    `  ${webcal}`,
    "",
    "• Google Calendar:",
    `  ${google}`,
    "",
    "• Other calendar apps (add by URL):",
    `  ${https}`,
    "",
    "Once you subscribe, your calendar will stay in sync automatically.",
    "Cancellations and reschedules will update on their own — no action needed.",
    "",
    "Go team! 🥎",
    "— Coach Chicolo & AFC Urgent Care",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#1d5a36;border-radius:16px;padding:24px;color:#fff;text-align:center;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#e8a922;margin-bottom:8px;">
          AFC Urgent Care
        </div>
        <div style="font-size:22px;font-weight:800;line-height:1.2;">
          You&rsquo;re on the schedule! 🥎
        </div>
        <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:8px;">
          Hillsdale Softball &bull; Smith School
        </div>
      </div>

      <div style="padding:20px 0;color:#0f3a21;font-size:15px;line-height:1.6;">
        <p>Subscribe to the calendar and all 2026 AFC Urgent Care games will appear automatically — with a 1-hour reminder before each one.</p>
        <p>Cancellations and reschedules update your calendar on their own. No need to do anything.</p>
      </div>

      <div style="text-align:center;margin-bottom:16px;">
        <a href="${webcal}"
           style="display:inline-block;background:#1d5a36;color:#e8a922;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">
          📅 Add to Apple Calendar
        </a>
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${google}"
           style="display:inline-block;background:#e8a922;color:#0f3a21;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">
          Add to Google Calendar
        </a>
      </div>

      <p style="font-size:12px;color:#888;text-align:center;">
        Or subscribe by URL in any calendar app:<br>
        <a href="${https}" style="color:#1d5a36;">${https}</a>
      </p>

      <p style="font-size:13px;color:#888;text-align:center;margin-top:24px;">
        &mdash; Coach Chicolo &amp; AFC Urgent Care
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "AFC Urgent Care — subscribe to your 2026 softball schedule 🥎",
    text,
    html,
  });
}

/**
 * Notify all opted-in parents that a game was updated or cancelled.
 * Their calendar apps will pick up the change automatically on the next
 * poll (every 6 hours), so this email is informational only.
 */
export async function sendGameUpdate(
  subscribers: string[],
  eventId: string,
  method: "REQUEST" | "CANCEL"
): Promise<void> {
  if (subscribers.length === 0) return;

  const { SCHEDULE, TEAMS } = await import("./schedule");
  const { getEventOverride } = await import("./kv");

  const event = SCHEDULE.find((e) => e.id === eventId);
  if (!event) return;

  const override = await getEventOverride(eventId);
  const opponentName = event.opponent ? TEAMS[event.opponent].sponsor : "TBD";

  const isCancel = method === "CANCEL";
  const date = override?.newDate ?? event.date;
  const startTime = override?.newStartTime ?? event.startTime ?? "10:00";

  const subject = isCancel
    ? `⚠️ Game cancelled — AFC Urgent Care vs. ${opponentName}`
    : `📅 Schedule update — AFC Urgent Care vs. ${opponentName}`;

  const bodyText = isCancel
    ? `The AFC Urgent Care game vs. ${opponentName} on ${date} has been cancelled. Your calendar will update automatically within a few hours.`
    : `The AFC Urgent Care game vs. ${opponentName} has been updated to ${date} at ${startTime}. Your calendar will update automatically within a few hours.`;

  const bodyHtml = isCancel
    ? `<p>The AFC Urgent Care game vs. <strong>${opponentName}</strong> on <strong>${date}</strong> has been <strong>cancelled</strong>.</p><p>Your calendar will update automatically within a few hours. No action needed.</p>`
    : `<p>The AFC Urgent Care game vs. <strong>${opponentName}</strong> has been updated to <strong>${date}</strong> at <strong>${startTime}</strong>.</p><p>Your calendar will update automatically within a few hours. No action needed.</p>`;

  const emailHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#1d5a36;border-radius:16px;padding:24px;color:#fff;text-align:center;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#e8a922;margin-bottom:8px;">
          AFC Urgent Care
        </div>
        <div style="font-size:20px;font-weight:800;line-height:1.2;">
          ${isCancel ? "⚠️ Game Cancelled" : "📅 Schedule Update"}
        </div>
      </div>
      <div style="padding:20px 0;color:#0f3a21;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <p style="font-size:13px;color:#888;text-align:center;">
        &mdash; Coach Chicolo &amp; AFC Urgent Care
      </p>
    </div>
  `;

  // Send to all subscribers in parallel.
  await Promise.all(
    subscribers.map((email) =>
      sendEmail({ to: email, subject, text: bodyText, html: emailHtml })
    )
  );
}
