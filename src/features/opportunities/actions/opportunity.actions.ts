"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, Prisma, Stage, PeriodStatus } from "@prisma/client";
import { createOpportunitySchema, updateOpportunitySchema } from "../schemas/opportunity.schema";
import { z } from "zod";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function createOpportunity(
  data: z.infer<typeof createOpportunitySchema>
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });

  if (!activePeriod) {
    throw new Error("No active reporting period found");
  }

  const parsed = createOpportunitySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid opportunity data");
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
  return opportunity;
}

export async function updateOpportunity(
  id: string,
  data: z.infer<typeof updateOpportunitySchema>
) {
  const parsed = updateOpportunitySchema.safeParse({ ...data, id });
  if (!parsed.success) {
    throw new Error("Invalid update data");
  }

  const existingOpportunity = await prisma.opportunity.findUnique({
    where: { id },
    select: { stage: true },
  });

  if (!existingOpportunity) {
    throw new Error("Opportunity not found");
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

  revalidatePath("/test");
  return opportunity;
}