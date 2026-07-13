import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user (CMS login) ---
  // Default dev credentials: admin@stakeholders.local / admin1234
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@stakeholders.local" },
    update: { passwordHash },
    create: {
      email: "admin@stakeholders.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  // --- Default event (multi-event foundation, PLAN §16 Phase A; content &
  // branding, Phase B) ---
  const eventData = {
    name: "Stakeholders Summit 2026",
    tagline: "Where industry leaders and brands connect.",
    startDate: "2026-10-21",
    endDate: "2026-10-23",
    venue: "Megaron Athens International Conference Centre",
    senderEmail: "sponsorships@example.com",
    isDefault: true,
    isActive: true,
    mapUrl: "https://maps.google.com/?q=Megaron+Athens+International+Conference+Centre",
    currency: "EUR",
    language: "en",
    websiteUrl: "https://example.com",
    twitterUrl: "https://twitter.com/example",
    linkedinUrl: "https://linkedin.com/company/example",
    faq: JSON.stringify([
      {
        question: "Who should attend?",
        answer: "Founders, operators, investors and senior decision-makers across the industry.",
      },
      {
        question: "Is there a dress code?",
        answer: "Business casual for all three days.",
      },
      {
        question: "Can sponsors bring extra staff to the booth?",
        answer: "Yes — additional badges can be added to any package for a small fee.",
      },
    ]),
    deadlines: JSON.stringify([
      { label: "Early bird sponsorship deadline", date: "2026-08-15" },
      { label: "Logo & materials deadline", date: "2026-09-30" },
      { label: "Final confirmation deadline", date: "2026-10-10" },
    ]),
    termsText:
      "Sponsors commit to the package terms upon confirmation. Benefits are delivered as described on the packages page; substitutions are at the organizer's discretion.",
    privacyText:
      "We only use sponsor and attendee data to run this event and will never sell it to third parties. Contact the organizers to request data deletion.",
    cancellationText:
      "Cancellations more than 60 days before the event receive a full refund; within 60 days, sponsorships are non-refundable but transferable to a future edition.",
    themeMode: "AUTO",
  };
  const event = await prisma.event.upsert({
    where: { slug: "stakeholders-summit-2026" },
    update: eventData,
    create: { slug: "stakeholders-summit-2026", ...eventData },
  });
  const eventId = event.id;

  // --- Sponsorship packages / tiers ---
  // NOTE: SQLite has no array type, so `benefits` is stored as a JSON string.
  const tiers = [
    {
      name: "Founding Partner",
      tier: "PLATINUM",
      priceCents: 1_200_000, // EUR 12,000
      benefits: [
        "Exclusive category visibility across the summit",
        "Opening keynote introduction or fireside chat",
        "Premium lounge presence and lead capture",
        "12 delegate passes plus VIP dinner access",
      ],
      slotsTotal: 1,
      displayOrder: 1,
    },
    {
      name: "Strategic Partner",
      tier: "GOLD",
      priceCents: 700_000, // EUR 7,000
      benefits: [
        "Logo placement on website, stage loops and email campaigns",
        "Panel seat with senior industry speakers",
        "Dedicated meeting table in the partner area",
        "7 delegate passes",
      ],
      slotsTotal: 3,
      displayOrder: 2,
    },
    {
      name: "Community Partner",
      tier: "SILVER",
      priceCents: 350_000, // EUR 3,500
      benefits: [
        "Logo on website and selected onsite signage",
        "Shared demo point in the networking area",
        "Mention in partner announcement posts",
        "4 delegate passes",
      ],
      slotsTotal: 6,
      displayOrder: 3,
    },
    {
      name: "Supporting Partner",
      tier: "BRONZE",
      priceCents: 150_000, // EUR 1,500
      benefits: [
        "Logo on the sponsor showcase page",
        "Inclusion in the partner thank-you email",
        "2 delegate passes",
      ],
      slotsTotal: 10,
      displayOrder: 4,
    },
  ];

  const packages: Record<string, string> = {};
  for (const t of tiers) {
    const data = {
      eventId,
      name: t.name,
      tier: t.tier,
      priceCents: t.priceCents,
      currency: "EUR",
      benefits: JSON.stringify(t.benefits), // stored as JSON text (SQLite)
      slotsTotal: t.slotsTotal,
      displayOrder: t.displayOrder,
    };
    const pkg = await prisma.package.upsert({
      where: { id: t.tier }, // deterministic id so re-seeding is idempotent
      update: data,
      create: { id: t.tier, ...data },
    });
    packages[t.tier] = pkg.id;
  }

  // --- Sample sponsors (published showcase) ---
  const legacySponsorIds = [
    "Acme Energy",
    "Globex Power",
    "Initech Grid",
    "Hooli Networks",
    "Stark Industries",
    "Wayne Holdings",
  ];
  await prisma.sponsor.deleteMany({ where: { id: { in: legacySponsorIds } } });

  const sponsors = [
    {
      id: "sponsor-helios-energy",
      companyName: "Helios Energy Group",
      tier: "PLATINUM",
      websiteUrl: "https://example.com",
      description: "Renewable infrastructure partner supporting the summit's leadership track.",
      status: "CONFIRMED",
      isPublished: true,
      displayOrder: 1,
    },
    {
      id: "sponsor-aegean-ventures",
      companyName: "Aegean Ventures",
      tier: "GOLD",
      websiteUrl: "https://example.com",
      description: "Investment platform connecting growth companies with regional partners.",
      status: "CONFIRMED",
      isPublished: true,
      displayOrder: 2,
    },
    {
      id: "sponsor-attica-digital",
      companyName: "Attica Digital",
      tier: "SILVER",
      websiteUrl: "https://example.com",
      description: "Cloud and data partner for modern event and enterprise operations.",
      status: "ACCEPTED", // mid-pipeline example (no longer published)
      isPublished: false,
      displayOrder: 3,
    },
    {
      id: "sponsor-orion-mobility",
      companyName: "Orion Mobility",
      tier: "GOLD",
      contactEmail: "partners@orion.example",
      description: "Mobility sponsor invited to support the networking programme.",
      status: "INVITE_SENT",
      isPublished: false,
      displayOrder: 4,
    },
    {
      id: "sponsor-nova-finance",
      companyName: "Nova Finance",
      tier: "SILVER",
      contactEmail: "events@nova.example",
      description: "Submitted onboarding details and awaiting final organizer approval.",
      status: "DETAILS_SUBMITTED",
      isPublished: false,
      displayOrder: 5,
    },
    {
      id: "sponsor-wayline-labs",
      companyName: "Wayline Labs",
      tier: "BRONZE",
      contactEmail: "pr@wayline.example",
      description: "Early-stage ecosystem supporter ready for outreach.",
      status: "LEAD",
      isPublished: false,
      displayOrder: 6,
    },
  ];

  for (const s of sponsors) {
    const { id, tier, ...rest } = s;
    await prisma.sponsor.upsert({
      where: { id },
      update: { ...rest, packageId: packages[tier], eventId },
      create: { id, ...rest, packageId: packages[tier], eventId },
    });
  }

  // (Event identity — name, tagline, dates, venue — now lives on the Event above.)

  // --- Agenda / programme (days must fall inside the event dates above) ---
  const agenda = [
    // Day 1 — 2026-10-21
    {
      day: "2026-10-21",
      dayLabel: "Opening day",
      startTime: "09:00",
      endTime: "10:00",
      title: "Registration & welcome coffee",
      type: "REGISTRATION",
      location: "Main foyer",
    },
    {
      day: "2026-10-21",
      startTime: "10:00",
      endTime: "11:00",
      title: "Opening keynote: the decade of partnerships",
      type: "KEYNOTE",
      location: "Banqueting Hall",
      speaker: "Elena Marinos, Helios Energy Group",
      description: "How industry leaders are rebuilding growth around long-term partner ecosystems.",
    },
    {
      day: "2026-10-21",
      startTime: "11:30",
      endTime: "13:00",
      title: "Panel: what sponsors actually want",
      type: "SESSION",
      location: "Hall A",
      speaker: "Aegean Ventures, Attica Digital, Orion Mobility",
    },
    {
      day: "2026-10-21",
      startTime: "13:00",
      endTime: "14:00",
      title: "Networking lunch",
      type: "BREAK",
      location: "Partner area",
    },
    {
      day: "2026-10-21",
      startTime: "19:00",
      title: "Welcome reception",
      type: "SOCIAL",
      location: "Rooftop terrace",
    },
    // Day 2 — 2026-10-22
    {
      day: "2026-10-22",
      dayLabel: "Main conference",
      startTime: "09:30",
      endTime: "10:30",
      title: "Keynote: measuring sponsorship ROI",
      type: "KEYNOTE",
      location: "Banqueting Hall",
      speaker: "Nova Finance",
    },
    {
      day: "2026-10-22",
      startTime: "11:00",
      endTime: "12:30",
      title: "Workshop: building a sponsor pipeline",
      type: "SESSION",
      location: "Hall B",
    },
    {
      day: "2026-10-22",
      startTime: "12:30",
      endTime: "13:30",
      title: "Lunch break",
      type: "BREAK",
      location: "Partner area",
    },
    {
      day: "2026-10-22",
      startTime: "14:00",
      endTime: "16:00",
      title: "Partner demo showcase",
      type: "SESSION",
      location: "Exhibition floor",
    },
    // Day 3 — 2026-10-23
    {
      day: "2026-10-23",
      dayLabel: "Closing day",
      startTime: "10:00",
      endTime: "11:30",
      title: "Roundtable: sponsorship in 2027",
      type: "SESSION",
      location: "Hall A",
    },
    {
      day: "2026-10-23",
      startTime: "12:00",
      endTime: "13:00",
      title: "Closing keynote & awards",
      type: "KEYNOTE",
      location: "Banqueting Hall",
      speaker: "The organizers",
    },
    {
      day: "2026-10-23",
      startTime: "13:00",
      title: "Farewell drinks",
      type: "SOCIAL",
      location: "Rooftop terrace",
    },
  ];

  for (const [i, item] of agenda.entries()) {
    const id = `agenda-summit-${i + 1}`; // deterministic id so re-seeding is idempotent
    const data = { eventId, displayOrder: i + 1, ...item };
    await prisma.agendaItem.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  // --- Default email template (sponsor invite) ---
  // Merge fields: {{companyName}}, {{packageName}}, {{event}}, {{link}}
  await prisma.emailTemplate.upsert({
    where: { id: "default-invite" },
    update: {
      eventId,
      name: "Sponsorship invite (default)",
      subject: "Sponsorship invitation — {{event}}",
      body: `Hello {{contactName}},

{{event}} is approaching, and we'd love for {{companyName}} to join us as a {{packageName}} sponsor.

You can review the package details and accept or decline here:
{{link}}

This link is personal to you and expires in 7 days.

Kind regards,
The organizers of {{event}}`,
    },
    create: {
      id: "default-invite",
      eventId,
      name: "Sponsorship invite (default)",
      subject: "Sponsorship invitation — {{event}}",
      body: `Hello {{contactName}},

{{event}} is approaching, and we'd love for {{companyName}} to join us as a {{packageName}} sponsor.

You can review the package details and accept or decline here:
{{link}}

This link is personal to you and expires in 7 days.

Kind regards,
The organizers of {{event}}`,
    },
  });

  const [userCount, pkgCount, sponsorCount, agendaCount] = await Promise.all([
    prisma.user.count(),
    prisma.package.count(),
    prisma.sponsor.count(),
    prisma.agendaItem.count({ where: { eventId } }),
  ]);
  console.log(
    `Seed complete: 1 event, ${userCount} admin, ${pkgCount} packages, ${sponsorCount} sponsors, ${agendaCount} agenda items.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
