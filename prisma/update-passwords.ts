import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting password update script...");

  // 1. Create Admin Account
  const adminEmail = "admin@example.com";
  const adminPassword = "admin12345";
  const hashedAdminPassword = await hashPassword(adminPassword);

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: Role.MANAGEMENT,
        emailVerified: true,
      }
    });
  }

  // Create or update admin account
  const adminAccount = await prisma.account.findFirst({ where: { userId: admin.id } });
  if (!adminAccount) {
    await prisma.account.create({
      data: {
        accountId: admin.id, 
        providerId: 'credential',
        userId: admin.id,
        password: hashedAdminPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.account.update({
      where: { id: adminAccount.id },
      data: { password: hashedAdminPassword }
    });
  }

  // 2. Update COO Passwords
  const coos = await prisma.user.findMany({
    where: { role: Role.COO }
  });

  const cooCredentials = [];

  for (const coo of coos) {
    const rawPassword = `${coo.name}12345`;
    const hashedPassword = await hashPassword(rawPassword);

    const account = await prisma.account.findFirst({
      where: { userId: coo.id }
    });

    if (!account) {
      await prisma.account.create({
        data: {
          accountId: coo.id,
          providerId: 'credential',
          userId: coo.id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword }
      });
    }

    cooCredentials.push({ email: coo.email, password: rawPassword });
  }

  // 3. Login Cheat Sheet
  console.log("\n======================================");
  console.log("LOGIN CHEAT SHEET");
  console.log("======================================");
  console.log("ADMIN ACCOUNT (MANAGEMENT)");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log("\nCOO ACCOUNTS (First 5)");
  cooCredentials.slice(0, 5).forEach(c => {
    console.log(`Email:    ${c.email}`);
    console.log(`Password: ${c.password}`);
    console.log("--------------------------------------");
  });
  console.log("======================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
