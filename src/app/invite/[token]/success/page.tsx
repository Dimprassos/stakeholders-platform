import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Details submitted" };

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // The token is invalidated after submission, so we look up by company name?
  // No — look up by the token anyway; even if cleared, show a generic message.
  const { token } = await params;
  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    select: { companyName: true, status: true },
  });

  // Token may be cleared on submission; treat missing token as "already submitted".
  const companyName = sponsor?.companyName;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-green-600 dark:text-green-400"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Thank you{companyName ? `, ${companyName}` : ""}!
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Your onboarding details have been submitted. The organizers will
          review them and contact you shortly to confirm your sponsorship.
        </p>
        <p className="mt-6 text-xs text-zinc-500">
          <Link href="/" className="underline underline-offset-4">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}