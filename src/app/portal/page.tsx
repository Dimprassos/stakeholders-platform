import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSponsor, ensurePortalToken } from "@/lib/sponsor-auth";
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

  const token = await ensurePortalToken(sponsor);
  const sp = await searchParams;

  return (
    <SponsorPortal
      sponsor={sponsor}
      token={token}
      mode="session"
      flags={{
        paid: typeof sp.paid === "string",
        cancel: sp.paycancel === "1",
        error: typeof sp.payerror === "string" ? sp.payerror : null,
        pwError: false,
        signed: sp.signed === "1",
        signError: sp.signerr === "1",
      }}
    />
  );
}
