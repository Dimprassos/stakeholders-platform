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
      name: "Platinum",
      tier: "PLATINUM",
      priceCents: 1_000_000, // €10,000
      benefits: [
        "Prime logo placement on all event materials",
        "Keynote speaking slot",
        "Premium booth space",
        "10 delegate passes",
      ],
      slotsTotal: 1,
      displayOrder: 1,
    },
    {
      name: "Gold",
      tier: "GOLD",
      priceCents: 500_000, // €5,000
      benefits: [
        "Logo on event website and stage banner",
        "Panel speaking slot",
        "Standard booth space",
        "5 delegate passes",
      ],
      slotsTotal: 3,
      displayOrder: 2,
    },
    {
      name: "Silver",
      tier: "SILVER",
      priceCents: 250_000, // €2,500
      benefits: ["Logo on event website", "Shared booth space", "3 delegate passes"],
      slotsTotal: 6,
      displayOrder: 3,
    },
    {
      name: "Bronze",
      tier: "BRONZE",
      priceCents: 100_000, // €1,000
      benefits: ["Logo on event website", "2 delegate passes"],
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
  const sponsors = [
    {
      companyName: "Acme Energy",
      tier: "PLATINUM",
      websiteUrl: "https://example.com",
      status: "CONFIRMED",
      isPublished: true,
      displayOrder: 1,
    },
    {
      companyName: "Globex Power",
      tier: "GOLD",
      websiteUrl: "https://example.com",
      status: "CONFIRMED",
      isPublished: true,
      displayOrder: 2,
    },
    {
      companyName: "Initech Grid",
      tier: "SILVER",
      websiteUrl: "https://example.com",
      status: "ACCEPTED", // mid-pipeline example (no longer published)
      isPublished: false,
      displayOrder: 3,
    },
    {
      companyName: "Hooli Networks",
      tier: "GOLD",
      contactEmail: "partners@hooli.example",
      status: "INVITE_SENT",
      isPublished: false,
      displayOrder: 4,
    },
    {
      companyName: "Stark Industries",
      tier: "PLATINUM",
      contactEmail: "events@stark.example",
      status: "DETAILS_SUBMITTED",
      isPublished: false,
      displayOrder: 5,
    },
    {
      companyName: "Wayne Holdings",
      tier: "BRONZE",
      contactEmail: "pr@wayne.example",
      status: "LEAD",
      isPublished: false,
      displayOrder: 6,
    },
  ];

  for (const s of sponsors) {
    const { tier, ...rest } = s;
    await prisma.sponsor.upsert({
      where: { id: s.companyName },
      update: { ...rest, packageId: packages[tier] },
      create: { id: s.companyName, ...rest, packageId: packages[tier] },
    });
  }

  // --- Event settings ---
  const settings: Record<string, string> = {
    eventName: "Stakeholders Event 2026",
    eventStartDate: "2026-10-21",
    eventEndDate: "2026-10-23",
    venue: "Athens, Greece",
    senderEmail: "sponsorships@example.com",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

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
