import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/magic-token";
import { OnboardingForm } from "../onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    include: { package: true },
  });

  if (!sponsor || isTokenExpired(sponsor.tokenExpiresAt)) {
    notFound();
  }

  if (sponsor.status === "DECLINED") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Invitation declined</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          You previously declined this invitation. If you changed your mind,
          please contact the organizers.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm underline underline-offset-4"
        >
          Back to site
        </Link>
      </main>
    );
  }

  if (sponsor.status !== "ACCEPTED") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Accept first</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Please accept the sponsorship package before filling in your details.
        </p>
        <Link
          href={`/invite/${token}`}
          className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Review the package
        </Link>
      </main>
    );
  }

  const settings = await prisma.setting.findMany();
  const event =
    settings.find((s) => s.key === "eventName")?.value ?? "the event";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Onboarding
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Details for {sponsor.companyName}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        You&apos;ve accepted the {sponsor.package?.name ?? ""} package for {event}.
        Please complete the details below so we can finalize your sponsorship.
      </p>

      <div className="mt-10">
        <OnboardingForm
          token={token}
          allowFileUpload={process.env.NODE_ENV !== "production"}
          initial={{
            legalName: sponsor.legalName ?? "",
            billingAddress: sponsor.billingAddress ?? "",
            vatNumber: sponsor.vatNumber ?? "",
            websiteUrl: sponsor.websiteUrl ?? "",
            logoUrl: sponsor.logoUrl ?? "",
            description: sponsor.description ?? "",
          }}
        />
      </div>
    </main>
  );
}
