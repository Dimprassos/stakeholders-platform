import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSponsor } from "@/lib/sponsor-auth";
import { OnboardingForm } from "@/app/invite/[token]/onboarding-form";
import { PortalShell, type PortalEvent } from "@/app/invite/[token]/portal-shell";

export const dynamic = "force-dynamic";

// Cookie-authenticated onboarding form (QA P0-2). The sponsor reaches this from
// their tokenless /portal; no magic token appears in the URL. They may fill in —
// and later edit — details anywhere in the portal lifecycle, not only right
// after accepting.
const EDITABLE_STATUSES = ["ACCEPTED", "DETAILS_SUBMITTED", "CONFIRMED"];

const EVENT_BRAND_SELECT = {
  name: true,
  logoUrl: true,
  themeMode: true,
  brandColor: true,
  brandInkColor: true,
  brandAccentColor: true,
} as const;

export default async function PortalOnboardingFormPage() {
  const sponsor = await getCurrentSponsor();
  if (!sponsor) redirect("/sponsor/login");

  const event = await prisma.event.findUnique({
    where: { id: sponsor.eventId },
    select: EVENT_BRAND_SELECT,
  });
  const portalEvent: PortalEvent | null = event;
  const eventName = event?.name ?? "Your event";

  const shell = (children: React.ReactNode) => (
    <PortalShell
      event={portalEvent}
      companyName={sponsor.companyName}
      mode="session"
      homeHref="/portal"
    >
      {children}
    </PortalShell>
  );

  if (sponsor.status === "DECLINED") {
    return shell(
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Invitation declined</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          You previously declined this invitation. If you changed your mind, please
          contact the organizers.
        </p>
      </div>,
    );
  }

  if (!EDITABLE_STATUSES.includes(sponsor.status)) {
    return shell(
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Accept first</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Please accept the sponsorship package before filling in your details.
        </p>
        <Link
          href="/portal"
          className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Back to portal
        </Link>
      </div>,
    );
  }

  const hasDetails = Boolean(
    sponsor.legalName || sponsor.vatNumber || sponsor.billingAddress,
  );

  return shell(
    <div className="mx-auto max-w-2xl">
      <Link
        href="/portal"
        className="text-sm text-zinc-500 underline underline-offset-4 hover:text-foreground"
      >
        ← Back to portal
      </Link>
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-brand-accent">
        {hasDetails ? "Edit details" : "Onboarding"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Details for {sponsor.companyName}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        {sponsor.package?.name
          ? `Your ${sponsor.package.name} package for ${eventName}. `
          : ""}
        These details are used for your invoice and your public sponsor listing.
      </p>

      <div className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-bg)] p-6 backdrop-blur-sm">
        <OnboardingForm
          allowFileUpload={process.env.NODE_ENV !== "production"}
          initial={{
            legalName: sponsor.legalName ?? "",
            billingAddress: sponsor.billingAddress ?? "",
            vatNumber: sponsor.vatNumber ?? "",
            websiteUrl: sponsor.websiteUrl ?? "",
            logoUrl: sponsor.logoUrl ?? "",
            description: sponsor.description ?? "",
            isHiddenFromPublic: sponsor.isHiddenFromPublic,
          }}
        />
      </div>
    </div>,
  );
}
