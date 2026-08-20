import { PrismaClient, Product, Stage, ReconciliationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_PR_RECORDS = [
  // COOP CARE (Medical)
  { Insured: "JAMES KAMAU NDUNGU", Premium: 45000, Intermediary: "AON KENYA", Branch: "NAKURU", Product: "COOP_CARE", Invoice: "INV-1001" },
  { Insured: "SAFARICOM SACCO", Premium: 125000, Intermediary: "DIRECT", Branch: "CIC HEAD OFFICE", Product: "COOP_CARE", Invoice: "INV-1002" },
  { Insured: "K-UNITY SACCO", Premium: 89000, Intermediary: "MAPA INSURANCE AGENCY", Branch: "KIAMBU", Product: "COOP_CARE", Invoice: "INV-1003" },
  { Insured: "LAKE VIEW HOSPITAL", Premium: 210000, Intermediary: "TRUSTMARK", Branch: "MOMBASA", Product: "COOP_CARE", Invoice: "INV-1004" },
  // LIVESTOCK
  { Insured: "OILEPO DAIRY FARM", Premium: 34000, Intermediary: "DIRECT", Branch: "KERICHO", Product: "LIVESTOCK", Invoice: "INV-2001" },
  { Insured: "KAMIRITHU FARMERS", Premium: 76000, Intermediary: "AGRI-SURE", Branch: "KIAMBU", Product: "LIVESTOCK", Invoice: "INV-2002" },
  { Insured: "MAASAI MARA RANCHERS", Premium: 112000, Intermediary: "DIRECT", Branch: "TOWN OFFICE", Product: "LIVESTOCK", Invoice: "INV-2003" },
  { Insured: "ELDORET POULTRY COOP", Premium: 54000, Intermediary: "FRANK MOGAKA", Branch: "ELDORET", Product: "LIVESTOCK", Invoice: "INV-2004" },
  // NON-MEDICAL (Various)
  { Insured: "KCA UNIVERSITY", Premium: 1500, Intermediary: "TRUSTMARK", Branch: "CIC HEAD OFFICE", Product: "STUDENTS_PA", Invoice: "INV-3001" },
  { Insured: "CARING HEARTS HIGH SCHOOL", Premium: 93542, Intermediary: "EQUITY BANCASSURANCE", Branch: "MACHAKOS", Product: "STUDENTS_PA", Invoice: "INV-3002" },
  { Insured: "LICHI SECURITIES", Premium: 61400, Intermediary: "FIRMLINK", Branch: "NYERI", Product: "GFE", Invoice: "INV-3003" },
  { Insured: "AMICA SACCO", Premium: 419800, Intermediary: "AMICA INSURANCE AGENCY", Branch: "NYERI", Product: "BIASHARA_SALAMA", Invoice: "INV-3004" },
  { Insured: "JIRANI SMART LTD", Premium: 4800, Intermediary: "CO-OP BANCASSURANCE", Branch: "MOMBASA", Product: "JILINDE", Invoice: "INV-3005" },
  { Insured: "FUTURE LINE TRANSPORT", Premium: 41400, Intermediary: "WALTER MABIRIA", Branch: "KITENGELA", Product: "JIKINGE", Invoice: "INV-3006" },
  { Insured: "MARY NYABOKE MAUTI", Premium: 350, Intermediary: "DIRECT", Branch: "CIC HEAD OFFICE", Product: "HOSPICASH", Invoice: "INV-3007" }
];

const BRANCH_NAMES = [
  "KIAMBU", "NYERI", "MOMBASA", "CIC HEAD OFFICE", "TOWN OFFICE",
  "KERICHO", "KITENGELA", "NAKURU", "ELDORET", "MACHAKOS"
];

async function main() {
  console.log('Clearing database...');
  await prisma.opportunity.deleteMany();
  await prisma.target.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.reportingPeriod.deleteMany();

  console.log('Setting up June 2026 reporting period...');
  const activePeriod = await prisma.reportingPeriod.create({
    data: {
      month: 6,
      year: 2026,
      status: 'OPEN'
    }
  });

  const branchRecords = [];
  const cooRecords = [];

  for (const name of BRANCH_NAMES) {
    const branch = await prisma.branch.create({
      data: { name }
    });
    branchRecords.push(branch);

    const email = `coo.${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const coo = await prisma.user.create({
      data: {
        email,
        name: `COO ${name}`,
        role: 'COO',
        branch_id: branch.id,
        emailVerified: true
      }
    });
    cooRecords.push(coo);

    await prisma.target.create({
      data: {
        user_id: coo.id,
        period_id: activePeriod.id,
        medical_target: 1000000,
        non_medical_target: 2000000
      }
    });
  }

  console.log('Seeding 100 PIPELINE opportunities...');
  const pipelineStages = [Stage.PROSPECT, Stage.QUOTED];
  
  for (const coo of cooRecords) {
    for (let i = 0; i < 10; i++) {
      const baseRec = BASE_PR_RECORDS[Math.floor(Math.random() * BASE_PR_RECORDS.length)];
      await prisma.opportunity.create({
        data: {
          client_name: `Prospect ${Math.floor(Math.random() * 1000)} - ${baseRec.Insured}`,
          intermediary: baseRec.Intermediary,
          product: baseRec.Product as Product,
          expected_premium: baseRec.Premium * (0.8 + Math.random() * 0.4),
          expected_closure_month: "June 2026",
          stage: pipelineStages[Math.floor(Math.random() * pipelineStages.length)],
          user_id: coo.id,
          period_id: activePeriod.id
        }
      });
    }
  }

  console.log('Seeding 100 CLOSED opportunities with discrepancies...');
  
  let recordCount = 0;
  for (const coo of cooRecords) {
    for (let i = 0; i < 10; i++) {
      const baseIdx = recordCount % BASE_PR_RECORDS.length;
      const baseRec = BASE_PR_RECORDS[baseIdx];
      
      let clientName = baseRec.Insured;
      let expectedPremium = baseRec.Premium;
      let userId = coo.id;
      
      // Inject Discrepancies
      if (recordCount < 10) {
        // Cross-Branch: Give to a different COO
        const otherCoo = cooRecords.find(c => c.id !== coo.id) || cooRecords[0];
        userId = otherCoo.id;
      } else if (recordCount >= 10 && recordCount < 20) {
        // Premium Drift: Add 15%
        expectedPremium = Math.round(expectedPremium * 1.15);
      } else if (recordCount >= 20 && recordCount < 30) {
        // Fuzzy Name: Add LTD
        clientName = `${clientName} LTD`;
      } else if (recordCount >= 30 && recordCount < 35) {
        // Ghost Claims
        clientName = `GHOST ENTERPRISES ${recordCount}`;
      }
      
      await prisma.opportunity.create({
        data: {
          client_name: clientName,
          intermediary: baseRec.Intermediary,
          product: baseRec.Product as Product,
          expected_premium: expectedPremium,
          expected_closure_month: "June 2026",
          stage: Stage.CLOSED,
          reconciliation_status: ReconciliationStatus.UNRECONCILED,
          user_id: userId,
          period_id: activePeriod.id
        }
      });
      
      recordCount++;
    }
  }

  console.log(`\nSeed Summary:`);
  console.log(`- 10 COOs mapped to 10 Branches created.`);
  console.log(`- 100 Pipeline opportunities generated.`);
  console.log(`- 100 Closed opportunities generated (with Bucket B discrepancy tests).`);
  console.log(`- 1 Active Period (June 2026) initialized.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
