"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { PeriodStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createCooSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  branch_id: z.string().optional(),
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
