import { PrismaClient } from '@prisma/client'
import { auth } from '../src/features/auth/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create ReportingPeriod
  const period = await prisma.reportingPeriod.create({
    data: {
      month: 7,
      year: 2026,
      status: "OPEN",
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

  // 3. Create Users using Better Auth
  
  // Use a pseudo-request to satisfy Better Auth api Context 
  const mockHeaders = new Headers();

  const hildahRes = await auth.api.signUpEmail({
    body: {
      email: 'hildah.kanyi@example.com',
      name: 'Hildah Kanyi',
      password: 'password123',
      role: "COO",
      branch_id: westlands.id
    },
    asResponse: false
  });

  const jacobRes = await auth.api.signUpEmail({
    body: {
      email: 'jacob.mwangi@example.com',
      name: 'Jacob Mwangi',
      password: 'password123',
      role: "COO",
      branch_id: thika.id
    },
    asResponse: false
  });

  const managementRes = await auth.api.signUpEmail({
    body: {
      email: 'management@example.com',
      name: 'Management User',
      password: 'password123',
      role: "MANAGEMENT"
    },
    asResponse: false
  });

  console.log(`Created Users successfully with Better Auth`)
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
