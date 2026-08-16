"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { PeriodStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createCooSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  branch_id: z.string().optional(),
  medicalTarget: z.number().min(0),
  nonMedicalTarget: z.number().min(0),
});

const editCooSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  branch_id: z.string().optional(),
  medicalTarget: z.number().min(0),
  nonMedicalTarget: z.number().min(0),
  password: z.string().min(8).optional().or(z.literal("")),
});

// Ensure only MANAGEMENT can perform these actions
async function verifyManagementRole() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.role !== "MANAGEMENT") {
    throw new Error("Unauthorized");
  }
}

export async function createCoo(data: any) {
  await verifyManagementRole();

  const parsed = createCooSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid payload data for COO");
  }

  // CRITICAL: By passing a blank `Headers` object instead of the Next.js `headers()`,
  // Better Auth will process the signup server-side without injecting the new session 
  // cookies into the current admin's browser response.
  const res = await auth.api.signUpEmail({
    body: {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: "COO",
      branch_id: parsed.data.branch_id,
    },
    headers: new Headers(), 
  });

  if (!res?.user?.id) {
    throw new Error("Failed to create COO");
  }

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });

  if (activePeriod) {
    await prisma.target.create({
      data: {
        user_id: res.user.id,
        period_id: activePeriod.id,
        medical_target: parsed.data.medicalTarget,
        non_medical_target: parsed.data.nonMedicalTarget,
      }
    });
  } else {
    console.warn("No active reporting period found. COO created without a default target.");
  }

  return { success: true, user: res };
}

export async function upsertTarget(data: { user_id: string, medical_target: number, non_medical_target: number }) {
  await verifyManagementRole();

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });

  if (!activePeriod) {
    throw new Error("No active reporting period found");
  }

  const target = await prisma.target.upsert({
    where: {
      user_id_period_id: {
        user_id: data.user_id,
        period_id: activePeriod.id
      }
    },
    update: {
      medical_target: data.medical_target,
      non_medical_target: data.non_medical_target
    },
    create: {
      user_id: data.user_id,
      period_id: activePeriod.id,
      medical_target: data.medical_target,
      non_medical_target: data.non_medical_target
    }
  });

  return target;
}

export async function editCoo(id: string, data: any) {
  await verifyManagementRole();
  
  const parsed = editCooSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid payload data for edit COO");
  }

  const validData = parsed.data;

  await prisma.user.update({
    where: { id },
    data: {
      name: validData.name,
      email: validData.email,
      branch_id: validData.branch_id || null,
    }
  });

  if (validData.password && validData.password.trim().length > 0) {
    const hashedPassword = await bcrypt.hash(validData.password, 10);
    const account = await prisma.account.findFirst({
      where: { userId: id }
    });
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword }
      });
    } else {
      throw new Error("Account not found for this user");
    }
  }

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });

  if (activePeriod) {
    await prisma.target.upsert({
      where: {
        user_id_period_id: {
          user_id: id,
          period_id: activePeriod.id
        }
      },
      update: {
        medical_target: validData.medicalTarget,
        non_medical_target: validData.nonMedicalTarget
      },
      create: {
        user_id: id,
        period_id: activePeriod.id,
        medical_target: validData.medicalTarget,
        non_medical_target: validData.nonMedicalTarget
      }
    });
  }
}

export async function deleteCoo(id: string) {
  await verifyManagementRole();
  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });
}
