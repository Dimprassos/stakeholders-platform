// Contract helpers (docs/PLAN.md §16 Phase F — contracts & e-signature).

export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Awaiting signature",
  SIGNED: "Signed",
};

/** A sensible default agreement the admin can edit before sending. */
export function defaultContractBody(opts: {
  event: string;
  company: string;
  packageName?: string | null;
  price?: string | null;
}): string {
  const { event, company, packageName, price } = opts;
  const pkg = packageName ? `the ${packageName} sponsorship package` : "the selected sponsorship package";
  return `This Sponsorship Agreement is made between the organizers of ${event} ("Organizer") and ${company} ("Sponsor").

1. Package. The Sponsor agrees to ${pkg}${price ? ` at ${price}` : ""}, including the benefits listed on the sponsorship packages page.

2. Payment. The Sponsor agrees to pay the agreed amount via the payment link provided in the sponsor portal, by the deadline communicated by the Organizer.

3. Deliverables. The Sponsor will provide the required materials (logo, banner, and any other agreed assets) in good time for the event.

4. Cancellation. Cancellations are subject to the Organizer's cancellation policy.

By signing below, the Sponsor confirms they are authorized to enter into this Agreement on behalf of ${company} and agrees to its terms.`;
}
