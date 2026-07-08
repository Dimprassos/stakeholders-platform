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
      update: { ...rest, packageId: packages[tier] },
      create: { id, ...rest, packageId: packages[tier] },
    });
  }

  // --- Event settings ---
  const settings: Record<string, string> = {
    eventName: "Stakeholders Summit 2026",
    tagline: "Three days of deal-making, brand visibility and senior stakeholder access.",
    eventStartDate: "2026-10-21",
    eventEndDate: "2026-10-23",
    venue: "Megaron Athens International Conference Centre",
    senderEmail: "sponsorships@example.com",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // --- Default email template (sponsor invite) ---
  // Merge fields: {{companyName}}, {{packageName}}, {{event}}, {{link}}
  await prisma.emailTemplate.upsert({
    where: { id: "default-invite" },
    update: {
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

  const [userCount, pkgCount, sponsorCount, settingCount] = await Promise.all([
    prisma.user.count(),
    prisma.package.count(),
    prisma.sponsor.count(),
    prisma.setting.count(),
  ]);
  console.log(
    `Seed complete: ${userCount} admin, ${pkgCount} packages, ${sponsorCount} sponsors, ${settingCount} settings.`,
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
