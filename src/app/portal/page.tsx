import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSponsor } from "@/lib/sponsor-auth";
import { SponsorPortal } from "@/app/invite/[token]/sponsor-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sponsor portal" };

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sponsor = await getCurrentSponsor();
  if (!sponsor) redirect("/sponsor/login");

  const sp = await searchParams;

  return (
    <SponsorPortal
      sponsor={sponsor}
      flags={{
        paid: typeof sp.paid === "string",
        cancel: sp.paycancel === "1",
        error: typeof sp.payerror === "string" ? sp.payerror : null,
        pwError: typeof sp.pwerr === "string" ? sp.pwerr : null,
        signed: sp.signed === "1",
        signError: sp.signerr === "1",
        saved: sp.saved === "1",
      }}
    />
  );
}
