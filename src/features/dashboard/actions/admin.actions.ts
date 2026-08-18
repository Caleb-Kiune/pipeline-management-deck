"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { PeriodStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";

const createCooSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  branch: z.string().optional(),
  medicalTarget: z.number().min(0),
  nonMedicalTarget: z.number().min(0),
});

const editCooSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  branch: z.string().optional(),
  medicalTarget: z.number().min(0).optional(),
  nonMedicalTarget: z.number().min(0).optional(),
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
  try {
    await verifyManagementRole();

    const parsed = createCooSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid payload data for COO" };
    }

    let branch_id = null;
    if (parsed.data.branch && parsed.data.branch.trim() !== "") {
      let branch = await prisma.branch.findFirst({
        where: { name: { equals: parsed.data.branch.trim(), mode: 'insensitive' } }
      });
      if (!branch) {
        branch = await prisma.branch.create({ data: { name: parsed.data.branch.trim() } });
      }
      branch_id = branch.id;
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
        branch_id,
      },
      headers: new Headers(), 
    });

    if (!res?.user?.id) {
      return { success: false, error: "Failed to create COO" };
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

    return { success: true, message: "COO created successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function upsertTarget(data: { user_id: string, medical_target: number, non_medical_target: number }) {
  try {
    await verifyManagementRole();

    const activePeriod = await prisma.reportingPeriod.findFirst({
      where: { status: PeriodStatus.OPEN }
    });

    if (!activePeriod) {
      return { success: false, error: "No active reporting period found" };
    }

    await prisma.target.upsert({
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

    return { success: true, message: "Target updated successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function editCoo(id: string, data: any) {
  try {
    await verifyManagementRole();
    
    const parsed = editCooSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid payload data for edit COO" };
    }

    const validData = parsed.data;

    let branch_id = null;
    if (validData.branch && validData.branch.trim() !== "") {
      let branch = await prisma.branch.findFirst({
        where: { name: { equals: validData.branch.trim(), mode: 'insensitive' } }
      });
      if (!branch) {
        branch = await prisma.branch.create({ data: { name: validData.branch.trim() } });
      }
      branch_id = branch.id;
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: validData.name,
        email: validData.email,
        branch_id,
      }
    });

    if (validData.password && validData.password.trim().length > 0) {
      const hashedPassword = await hashPassword(validData.password);
      const account = await prisma.account.findFirst({
        where: { userId: id }
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { password: hashedPassword }
        });
      } else {
        return { success: false, error: "Account not found for this user" };
      }
    }

    const activePeriod = await prisma.reportingPeriod.findFirst({
      where: { status: PeriodStatus.OPEN }
    });

    if (activePeriod && validData.medicalTarget !== undefined && validData.nonMedicalTarget !== undefined) {
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

    revalidatePath("/dashboard/settings");
    return { success: true, message: "COO details updated successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function toggleCooStatus(id: string, isActive: boolean) {
  try {
    await verifyManagementRole();
    await prisma.user.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath("/dashboard/settings");
    return { success: true, message: `COO ${isActive ? "activated" : "deactivated"} successfully` };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function hardDeleteCoo(id: string) {
  try {
    await verifyManagementRole();
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath("/dashboard/settings");
    return { success: true, message: "COO permanently deleted" };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
