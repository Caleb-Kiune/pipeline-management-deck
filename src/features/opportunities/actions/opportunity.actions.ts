"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Stage, PeriodStatus } from "@prisma/client";
import { createOpportunitySchema, updateOpportunitySchema } from "../schemas/opportunity.schema";
import { z } from "zod";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function createOpportunity(
  data: z.infer<typeof createOpportunitySchema>
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const activePeriod = await prisma.reportingPeriod.findFirst({
      where: { status: PeriodStatus.OPEN }
    });

    if (!activePeriod) {
      return { success: false, error: "No active reporting period found" };
    }

    const parsed = createOpportunitySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid opportunity data" };
    }

    const { stage } = parsed.data;
    let closedAt: Date | null = null;
    if (stage === Stage.CLOSED) {
      closedAt = new Date();
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        ...parsed.data,
        user_id: session.user.id,
        period_id: activePeriod.id,
        closed_at: closedAt,
      },
    });

    revalidatePath("/pipeline");
    return { success: true, message: "Opportunity created successfully", opportunity };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateOpportunity(
  id: string,
  data: z.infer<typeof updateOpportunitySchema>
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateOpportunitySchema.safeParse({ ...data, id });
    if (!parsed.success) {
      return { success: false, error: "Invalid update data" };
    }

    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: { stage: true, user_id: true },
    });

    if (!existingOpportunity) {
      return { success: false, error: "Opportunity not found" };
    }

    if (existingOpportunity.user_id !== session.user.id) {
      return { success: false, error: "Forbidden: You do not own this opportunity" };
    }

    const updateData: Record<string, any> = { ...parsed.data };
    
    // State Machine Logic for closed_at
    if (updateData.stage) {
      if (updateData.stage === Stage.CLOSED && existingOpportunity.stage !== Stage.CLOSED) {
        updateData.closed_at = new Date();
      } else if (
        (updateData.stage === Stage.PROSPECT || updateData.stage === Stage.QUOTED) &&
        existingOpportunity.stage === Stage.CLOSED
      ) {
        updateData.closed_at = null;
      }
      // If LOST, closed_at is unaffected
    }

    // Remove id from updateData to prevent updating the identifier
    delete (updateData as any).id;
    // Also remove period_id and user_id if they accidentally got passed in the update payload
    delete (updateData as any).period_id;
    delete (updateData as any).user_id;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/pipeline");
    return { success: true, message: "Opportunity updated successfully", opportunity };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}