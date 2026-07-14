import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Onboarding moved to the tokenless, cookie-authenticated /portal/form (QA P0-2).
// Any old token-based link lands here → exchange the token for a session cookie
// (via /portal/enter) and continue in the portal, where "Complete/Edit details"
// opens /portal/form.
export default async function LegacyOnboardingRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/portal/enter/${token}`);
}
