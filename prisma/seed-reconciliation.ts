import { PrismaClient, PeriodStatus, Stage, ReconciliationStatus, Product, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting 50-record expanded reconciliation seed...');

  // 1. Force close all existing periods to avoid collisions
  await prisma.reportingPeriod.updateMany({
    where: { status: PeriodStatus.OPEN },
    data: { status: PeriodStatus.LOCKED }
  });

  // 0. Clear specific testing data to prevent constraint issues
  await prisma.opportunity.deleteMany();
  await prisma.target.deleteMany();
  
  const testEmails = [
    "coo1@example.com", "coo2@example.com", "coo3@example.com", "coo4@example.com", "coo5@example.com"
  ];
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  const testBranches = ["CIC HEAD OFFICE", "TOWN OFFICE", "KERICHO", "KIAMBU", "NYERI"];
  await prisma.branch.deleteMany({ where: { name: { in: testBranches } } });

  // 1b. Create the target Reporting Period
  const period = await prisma.reportingPeriod.upsert({
    where: { month_year: { month: 6, year: 2026 } },
    update: { status: PeriodStatus.OPEN },
    create: {
      month: 6,
      year: 2026,
      status: PeriodStatus.OPEN,
    },
  });
  console.log(`Created/Ensured period: June 2026`);

  // 2. Create Branches
  const branches = await Promise.all(
    testBranches.map(name => prisma.branch.create({ data: { name } }))
  );
  console.log(`Created 5 branches: ${testBranches.join(", ")}`);

  // 3. Create COOs assigned to branches
  const coos = await Promise.all(
    testEmails.map((email, index) => {
      const names = [
        "Victor Kinoti (CIC)", 
        "Lydia Wanjira (TOWN)", 
        "Daniel Kamau (KERICHO)", 
        "Jane Doe (KIAMBU)", 
        "John Smith (NYERI)"
      ];
      return prisma.user.create({
        data: {
          email,
          name: names[index],
          role: Role.COO,
          branch_id: branches[index].id,
          accounts: {
            create: {
              accountId: email,
              providerId: "credentials",
              password: "password123",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
      });
    })
  );
  console.log(`Created 5 COOs with assigned branches.`);

  // Targets
  for (const coo of coos) {
    await prisma.target.create({
      data: {
        user_id: coo.id,
        period_id: period.id,
        medical_target: 1000000,
        non_medical_target: 500000,
      }
    });
  }

  const opportunitiesToCreate = [];

  // Scenarios Base Data
  const baseData = [
    { client: "MARY NYABOKE MAUTI", premium: 350, inter: "DIRECT", branch: "CIC HEAD OFFICE" },
    { client: "OMBEWA JARED OCHIENG", premium: 350, inter: "DIRECT", branch: "CIC HEAD OFFICE" },
    { client: "BRIAN GACHERU MBOGO", premium: 500, inter: "MEPSURE INSURANCE AGENCY", branch: "TOWN OFFICE" },
    { client: "MARUSOI ABIGAEL CHEPKEMOI", premium: -500, inter: "DIRECT", branch: "KERICHO" },
    { client: "MPEKETONI VOCATIONAL TRAINING CENTER", premium: 750, inter: "CECILIA WANJIKU MWAISAKA", branch: "CIC HEAD OFFICE" },
    { client: "KCA UNIVERSITY JOSHUA NJOROGE", premium: 1500, inter: "TRUSTMARK INSURANCE BROKERS LTD", branch: "CIC HEAD OFFICE" },
    { client: "JULIUS KIMANI MAINA", premium: 500, inter: "DIRECT", branch: "CIC HEAD OFFICE" }
  ];

  // Distribute 10 opportunities per COO
  for (let i = 0; i < coos.length; i++) {
    const coo = coos[i];
    const cooBranchName = testBranches[i];
    
    // Each COO gets exactly 10 claims
    // We will mix and match the base data to create Perfect, Partial, Cross-Branch, Conflict, and Ghost
    
    // 1. Perfect Match (from their own branch if possible, else we adapt)
    // Find a record that matches their branch, or just use one and pretend it's theirs
    const perfectBase = baseData.find(b => b.branch === cooBranchName) || baseData[0];
    opportunitiesToCreate.push({
      client_name: perfectBase.client,
      intermediary: perfectBase.inter,
      expected_premium: perfectBase.premium,
      product: Product.OTHER,
      stage: Stage.CLOSED,
      expected_closure_month: "2026-06",
      user_id: coo.id,
      period_id: period.id,
    });

    // 2. Partial/Messy Match (Name typo, slightly off premium)
    const messyBase = baseData[(i + 1) % baseData.length];
    opportunitiesToCreate.push({
      client_name: messyBase.client.substring(0, messyBase.client.length - 2), // typo
      intermediary: messyBase.inter,
      expected_premium: messyBase.premium + 10, // slight difference
      product: Product.OTHER,
      stage: Stage.CLOSED,
      expected_closure_month: "2026-06",
      user_id: coo.id,
      period_id: period.id,
    });

    // 3. Cross-Branch Claim
    // Claim a record that explicitly belongs to another branch
    const otherBranchBase = baseData.find(b => b.branch !== cooBranchName) || baseData[1];
    opportunitiesToCreate.push({
      client_name: otherBranchBase.client,
      intermediary: otherBranchBase.inter,
      expected_premium: otherBranchBase.premium,
      product: Product.OTHER,
      stage: Stage.CLOSED,
      expected_closure_month: "2026-06",
      user_id: coo.id, // They claim it, but PR says it belongs to otherBranchBase.branch
      period_id: period.id,
    });

    // 4. Duplicate/Conflict Claim (Everyone claims Joshua Njoroge)
    opportunitiesToCreate.push({
      client_name: "KCA UNIVERSITY JOSHUA NJOROGE",
      intermediary: "TRUSTMARK INSURANCE BROKERS LTD",
      expected_premium: 1500,
      product: Product.OTHER,
      stage: Stage.CLOSED,
      expected_closure_month: "2026-06",
      user_id: coo.id,
      period_id: period.id,
    });

    // 5. Ghost Claim
    opportunitiesToCreate.push({
      client_name: `GHOST COMPANY ${i} LTD`,
      intermediary: "DIRECT",
      expected_premium: 500000 + i,
      product: Product.OTHER,
      stage: Stage.CLOSED,
      expected_closure_month: "2026-06",
      user_id: coo.id,
      period_id: period.id,
    });

    // Fill the remaining 5 to reach 10 per COO (Mix of perfect and partials using the base data)
    for (let j = 0; j < 5; j++) {
      const b = baseData[(i + j) % baseData.length];
      opportunitiesToCreate.push({
        client_name: b.client + ` (Dup ${j})`, // Ensure uniqueness for testing if needed
        intermediary: b.inter,
        expected_premium: b.premium,
        product: Product.OTHER,
        stage: Stage.CLOSED,
        expected_closure_month: "2026-06",
        user_id: coo.id,
        period_id: period.id,
      });
    }
  }

  console.log(`Seeding ${opportunitiesToCreate.length} test opportunities...`);
  
  await prisma.opportunity.createMany({
    data: opportunitiesToCreate,
  });

  console.log('✅ 50-record branch-aware seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
