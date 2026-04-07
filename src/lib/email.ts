/**
 * Resend email wrapper for sending .ics calendar invites.
 *
 * Env vars:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — Full "Name <email>" string, e.g.
 *                      "AFC Urgent Care <onboarding@resend.dev>"
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Parse the bare address out of "Name <email@domain.com>". */
export function parseFromAddress(from: string): string {
  const m = from.match(/<(.+?)>/);
  return m ? m[1] : from;
}

type Attachment = {
  filename: string;
  content: string; // raw ics string — will be base64-encoded
  content_type: string;
};

type SendOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
};

export async function sendEmail(opts: SendOptions): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "AFC Urgent Care <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content).toString("base64"),
      content_type: a.content_type,
    })),
  });
}

/**
 * Send the full season invite to a newly-subscribed parent.
 * One email, all games as individual .ics attachments.
 */
export async function sendSeasonInvites(email: string): Promise<void> {
  const { buildAllGameIcs } = await import("./ics");
  const games = await buildAllGameIcs(email);

  const attachments: Attachment[] = games.map((g) => ({
    filename: g.filename,
    content: g.content,
    content_type: "text/calendar; method=REQUEST; charset=utf-8",
  }));

  await sendEmail({
    to: email,
    subject: "AFC Urgent Care — Your softball schedule is here 🥎",
    text: [
      "You're all set!",
      "",
      "We've attached calendar invites for every AFC Urgent Care game this season.",
      "Open this email on your phone and tap each attachment to add the games",
      "to your calendar with a 1-hour reminder.",
      "",
      "If a game is cancelled or rescheduled, we'll send you an updated invite",
      "automatically — your calendar entry will change on its own.",
      "",
      "Go team!",
      "— Coach Chicolo & AFC Urgent Care",
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <div style="background:#1d5a36;border-radius:16px;padding:24px;color:#fff;text-align:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#e8a922;margin-bottom:8px;">
            AFC Urgent Care
          </div>
          <div style="font-size:22px;font-weight:800;line-height:1.2;">
            Your 2026 Season Schedule
          </div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:8px;">
            Hillsdale Softball • Smith School
          </div>
        </div>
        <div style="padding:20px 0;color:#0f3a21;font-size:15px;line-height:1.6;">
          <p>You&rsquo;re all set! Tap each attachment below to add every game to your calendar with a 1-hour reminder.</p>
          <p>If a game is cancelled or rescheduled, we&rsquo;ll send you an updated invite automatically — your calendar will change on its own.</p>
          <p style="font-weight:600;">Go team! 🏆</p>
          <p style="color:#888;font-size:13px;">— Coach Chicolo &amp; AFC Urgent Care</p>
        </div>
      </div>
    `,
    attachments,
  });
}

/**
 * Send an update or cancellation notice for a single game to all subscribers.
 */
export async function sendGameUpdate(
  subscribers: string[],
  eventId: string,
  method: "REQUEST" | "CANCEL"
): Promise<void> {
  if (subscribers.length === 0) return;

  const { SCHEDULE } = await import("./schedule");
  const { getEventOverride, getEventSeq } = await import("./kv");
  const { buildIcs } = await import("./ics");

  const event = SCHEDULE.find((e) => e.id === eventId);
  if (!event) return;

  const override = await getEventOverride(eventId);
  const sequence = await getEventSeq(eventId);

  const opponentName =
    event.opponent
      ? (await import("./schedule")).TEAMS[event.opponent].sponsor
      : "TBD";

  const isCancel = method === "CANCEL";
  const subject = isCancel
    ? `⚠️ Game cancelled — AFC Urgent Care vs. ${opponentName}`
    : `📅 Game update — AFC Urgent Care vs. ${opponentName}`;

  // Send to each subscriber individually so each .ics is personalised with
  // their email as ATTENDEE (required for proper calendar client behaviour).
  await Promise.all(
    subscribers.map((email) => {
      const content = buildIcs({ event, attendeeEmail: email, method, override, sequence });
      return sendEmail({
        to: email,
        subject,
        text: isCancel
          ? `The AFC Urgent Care game vs. ${opponentName} has been cancelled. Your calendar invite will update automatically.`
          : `The AFC Urgent Care game vs. ${opponentName} has been updated. Your calendar invite will update automatically.`,
        html: `<p>${isCancel ? "This game has been <strong>cancelled</strong>." : "This game has been <strong>updated</strong>."} Your calendar will update automatically when you open this email.</p>`,
        attachments: [
          {
            filename: `${eventId}.ics`,
            content,
            content_type: `text/calendar; method=${method}; charset=utf-8`,
          },
        ],
      });
    })
  );
}
