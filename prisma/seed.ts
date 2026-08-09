import { PrismaClient, Role, PeriodStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create ReportingPeriod
  const period = await prisma.reportingPeriod.create({
    data: {
      month: 7,
      year: 2026,
      status: PeriodStatus.OPEN,
    }
  })
  console.log(`Created ReportingPeriod: ${period.month}/${period.year}`)

  // 2. Create Branches
  const westlands = await prisma.branch.create({
    data: {
      name: 'Westlands'
    }
  })
  const thika = await prisma.branch.create({
    data: {
      name: 'Thika'
    }
  })
  console.log(`Created Branches: ${westlands.name}, ${thika.name}`)

  // 3. Create Users
  const hildah = await prisma.user.create({
    data: {
      email: 'hildah.kanyi@example.com',
      name: 'Hildah Kanyi',
      role: Role.COO,
      branch_id: westlands.id,
    }
  })

  const jacob = await prisma.user.create({
    data: {
      email: 'jacob.mwangi@example.com',
      name: 'Jacob Mwangi',
      role: Role.COO,
      branch_id: thika.id,
    }
  })

  const management = await prisma.user.create({
    data: {
      email: 'management@example.com',
      name: 'Management User',
      role: Role.MANAGEMENT,
    }
  })
  console.log(`Created Users: ${hildah.name}, ${jacob.name}, ${management.name}`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
