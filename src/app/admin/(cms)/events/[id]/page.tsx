import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { faqToText, deadlinesToText, parseFaq, parseDeadlines } from "@/lib/event-content";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { name: true } });
  return { title: event ? `Edit · ${event.name}` : "Edit event" };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const initial = {
    name: event.name,
    tagline: event.tagline ?? "",
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    venue: event.venue ?? "",
    mapUrl: event.mapUrl ?? "",
    currency: event.currency,
    language: event.language,
    websiteUrl: event.websiteUrl ?? "",
    twitterUrl: event.twitterUrl ?? "",
    linkedinUrl: event.linkedinUrl ?? "",
    instagramUrl: event.instagramUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
    faqText: faqToText(parseFaq(event.faq)),
    deadlinesText: deadlinesToText(parseDeadlines(event.deadlines)),
    termsText: event.termsText ?? "",
    privacyText: event.privacyText ?? "",
    cancellationText: event.cancellationText ?? "",
    themeMode: event.themeMode,
    brandColor: event.brandColor ?? "",
    brandInkColor: event.brandInkColor ?? "",
    brandAccentColor: event.brandAccentColor ?? "",
    logoUrl: event.logoUrl ?? "",
    bannerUrl: event.bannerUrl ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit event</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Content and branding for {event.name}.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="text-sm text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
        >
          Back to events
        </Link>
      </div>
      <EventForm
        eventId={event.id}
        initial={initial}
        allowFileUpload={process.env.NODE_ENV !== "production"}
      />
    </div>
  );
}
