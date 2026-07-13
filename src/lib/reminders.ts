import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { parseDeadlines } from "@/lib/event-content";

// In-app reminders (docs/PLAN.md §16 Phase D — notifications/reminders). Derived
// entirely from data we already have (tasks, event deadlines, sponsor statuses,
// invite expiry) — no external mail/notification infra. Cached per request so the
// topbar badge and the dashboard panel share one query.

export type ReminderTone = "red" | "amber" | "blue";

export type Reminder = {
  id: string;
  title: string;
  detail?: string;
  href: string;
  when?: string;
  tone: ReminderTone;
};

function isoDay(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

const TONE_RANK: Record<ReminderTone, number> = { red: 0, amber: 1, blue: 2 };

export const getReminders = cache(async (eventId: string): Promise<Reminder[]> => {
  const today = isoDay(0);
  const in7 = isoDay(7);
  const in14 = isoDay(14);
  const now = new Date();
  const in7date = new Date(Date.now() + 7 * 86_400_000);

  const [
    tasks,
    awaitingReview,
    invites,
    unreadReplies,
    pendingPayments,
    unsignedContracts,
    event,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { eventId, done: false, dueDate: { not: null } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        sponsorId: true,
        sponsor: { select: { companyName: true } },
      },
    }),
    prisma.sponsor.findMany({
      where: { eventId, status: "DETAILS_SUBMITTED" },
      select: { id: true, companyName: true },
    }),
    prisma.sponsor.findMany({
      where: { eventId, status: "INVITE_SENT", tokenExpiresAt: { not: null } },
      select: { id: true, companyName: true, tokenExpiresAt: true },
    }),
    // No `take` on these three: the count they produce is what the topbar badge
    // shows, so capping the query would under-report how much needs attention.
    prisma.outreach.findMany({
      where: { eventId, direction: "INBOUND", readAt: null },
      select: {
        id: true,
        subject: true,
        sponsorId: true,
        prospectEmail: true,
        sponsor: { select: { companyName: true } },
      },
      orderBy: { receivedAt: "desc" },
    }),
    // Declined sponsors are excluded here and below: declining voids their open
    // payment and pulls their contract back to draft (see @/lib/sponsor-decline),
    // so this is belt-and-braces against a record that predates that rule.
    prisma.payment.findMany({
      where: { eventId, status: "PENDING", sponsor: { status: { not: "DECLINED" } } },
      select: {
        id: true,
        sponsorId: true,
        amountCents: true,
        currency: true,
        sponsor: { select: { companyName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contract.findMany({
      where: { eventId, status: "SENT", sponsor: { status: { not: "DECLINED" } } },
      select: {
        id: true,
        sponsorId: true,
        title: true,
        sponsor: { select: { companyName: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.event.findUnique({ where: { id: eventId }, select: { deadlines: true } }),
  ]);

  const reminders: Reminder[] = [];

  for (const t of tasks) {
    if (!t.dueDate) continue;
    if (t.dueDate < today) {
      reminders.push({
        id: `task-${t.id}`,
        title: `Overdue task: ${t.title}`,
        detail: t.sponsor.companyName,
        href: `/admin/candidates/${t.sponsorId}`,
        when: fmtDay(t.dueDate),
        tone: "red",
      });
    } else if (t.dueDate <= in7) {
      reminders.push({
        id: `task-${t.id}`,
        title: `Task due soon: ${t.title}`,
        detail: t.sponsor.companyName,
        href: `/admin/candidates/${t.sponsorId}`,
        when: fmtDay(t.dueDate),
        tone: "amber",
      });
    }
  }

  const deadlines = event ? parseDeadlines(event.deadlines) : [];
  for (const d of deadlines) {
    // A deadline that has passed keeps nagging in red, exactly like an overdue
    // task — previously it just fell out of the window and vanished silently,
    // so a missed deadline produced no notification at all. It clears when the
    // organizer updates or removes the deadline on the event.
    if (d.date < today) {
      reminders.push({
        id: `deadline-${d.label}-${d.date}`,
        title: `Deadline passed: ${d.label}`,
        href: "/admin/events",
        when: fmtDay(d.date),
        tone: "red",
      });
    } else if (d.date <= in14) {
      reminders.push({
        id: `deadline-${d.label}-${d.date}`,
        title: `Deadline: ${d.label}`,
        href: "/admin/events",
        when: fmtDay(d.date),
        tone: "amber",
      });
    }
  }

  for (const s of awaitingReview) {
    reminders.push({
      id: `review-${s.id}`,
      title: `${s.companyName} submitted onboarding`,
      detail: "Awaiting your review",
      href: `/admin/onboarding?focus=${s.id}`,
      tone: "blue",
    });
  }

  for (const s of invites) {
    const exp = s.tokenExpiresAt;
    if (!exp) continue;
    const expIso = exp.toISOString().slice(0, 10);
    if (exp < now) {
      reminders.push({
        id: `invite-${s.id}`,
        title: `Invite expired: ${s.companyName}`,
        detail: "Re-send to continue",
        href: `/admin/candidates/${s.id}`,
        when: fmtDay(expIso),
        tone: "red",
      });
    } else if (exp < in7date) {
      reminders.push({
        id: `invite-${s.id}`,
        title: `Invite expiring: ${s.companyName}`,
        href: `/admin/candidates/${s.id}`,
        when: fmtDay(expIso),
        tone: "amber",
      });
    }
  }

  for (const msg of unreadReplies) {
    reminders.push({
      id: `reply-${msg.id}`,
      title: `Unread reply: ${msg.subject}`,
      detail: msg.sponsor?.companyName ?? msg.prospectEmail ?? "Unknown sender",
      href: msg.sponsorId
        ? `/admin/candidates/${msg.sponsorId}`
        : "/admin/email-center?status=UNREAD",
      tone: "blue",
    });
  }

  for (const p of pendingPayments) {
    reminders.push({
      id: `payment-${p.id}`,
      title: `Payment pending: ${p.sponsor.companyName}`,
      detail: new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: p.currency,
        maximumFractionDigits: 0,
      }).format(p.amountCents / 100),
      href: `/admin/candidates/${p.sponsorId}`,
      tone: "amber",
    });
  }

  for (const c of unsignedContracts) {
    reminders.push({
      id: `contract-${c.id}`,
      title: `Contract awaiting signature: ${c.sponsor.companyName}`,
      detail: c.title,
      href: `/admin/candidates/${c.sponsorId}`,
      tone: "amber",
    });
  }

  reminders.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
  return reminders;
});
