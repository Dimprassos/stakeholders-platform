import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentEvent } from "@/lib/event";

const EMAIL_RE = /<?([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>?/;

export type InboundEmailInput = {
  from: string;
  to?: string | null;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  receivedAt?: string | null;
  eventSlug?: string | null;
  sponsorId?: string | null;
};

export function extractEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(EMAIL_RE);
  return match?.[1]?.toLowerCase() ?? null;
}

export function normalizeSubject(subject: string): string {
  return subject
    .trim()
    .replace(/^(\s*(re|fw|fwd)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function threadTitle(subject: string): string {
  return subject.trim().replace(/^(\s*(re|fw|fwd)\s*:\s*)+/i, "") || "No subject";
}

export function threadParam(subject: string): string {
  return encodeURIComponent(normalizeSubject(subject));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function textFromInbound(input: InboundEmailInput): string {
  const text = input.text?.trim();
  if (text) return text;
  const html = input.html?.trim();
  if (html) return stripHtml(html);
  return "";
}

export async function ingestInboundEmail(input: InboundEmailInput) {
  const fromEmail = extractEmail(input.from);
  const body = textFromInbound(input);
  if (!fromEmail) {
    return { ok: false as const, status: 400, error: "Missing valid from email." };
  }
  if (!body) {
    return { ok: false as const, status: 400, error: "Missing message body." };
  }

  const event = input.eventSlug
    ? await prisma.event.findUnique({ where: { slug: input.eventSlug } })
    : await getCurrentEvent();
  if (!event) {
    return { ok: false as const, status: 404, error: "Event not found." };
  }

  const sponsor = input.sponsorId
    ? await prisma.sponsor.findFirst({
        where: { id: input.sponsorId, eventId: event.id },
        select: { id: true, companyName: true, contactEmail: true },
      })
    : await prisma.sponsor.findFirst({
        where: { eventId: event.id, contactEmail: fromEmail },
        select: { id: true, companyName: true, contactEmail: true },
      });

  const subject = input.subject?.trim() || `Inbound email from ${fromEmail}`;
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();

  const message = await prisma.outreach.create({
    data: {
      eventId: event.id,
      sponsorId: sponsor?.id ?? null,
      prospectEmail: fromEmail,
      subject,
      body,
      direction: "INBOUND",
      status: "REPLIED",
      receivedAt: Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt,
    },
    select: { id: true, sponsorId: true },
  });

  return {
    ok: true as const,
    messageId: message.id,
    sponsorId: message.sponsorId,
    matchedSponsor: sponsor?.companyName ?? null,
  };
}

export type ThreadSource = {
  id: string;
  sponsorId: string | null;
  subject: string;
  direction: string;
  readAt: Date | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  sponsor?: { id: string; companyName: string; contactEmail: string | null } | null;
};

export type CommunicationThread = {
  key: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string | null;
  subject: string;
  latestAt: Date;
  total: number;
  unread: number;
};

export function groupThreads(rows: ThreadSource[]): CommunicationThread[] {
  const map = new Map<string, CommunicationThread>();
  for (const row of rows) {
    if (!row.sponsorId || !row.sponsor) continue;
    const subjectKey = normalizeSubject(row.subject);
    const key = `${row.sponsorId}:${subjectKey}`;
    const happenedAt = row.receivedAt ?? row.sentAt ?? row.createdAt;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key: subjectKey,
        sponsorId: row.sponsorId,
        sponsorName: row.sponsor.companyName,
        sponsorEmail: row.sponsor.contactEmail,
        subject: threadTitle(row.subject),
        latestAt: happenedAt,
        total: 1,
        unread: row.direction === "INBOUND" && !row.readAt ? 1 : 0,
      });
    } else {
      existing.total += 1;
      if (row.direction === "INBOUND" && !row.readAt) existing.unread += 1;
      if (happenedAt > existing.latestAt) existing.latestAt = happenedAt;
    }
  }
  return [...map.values()].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}
