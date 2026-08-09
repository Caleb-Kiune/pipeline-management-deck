"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, Prisma, Stage } from "@prisma/client";
import { createOpportunitySchema, updateOpportunitySchema } from "../schemas/opportunity.schema";
import { z } from "zod";

const prisma = new PrismaClient();

// TEMP SANDBOX IDs
const TEMP_USER_ID = "1ce45016-5cbf-4768-b1f2-df7b1c068073"; // Jacob Mwangi
const TEMP_PERIOD_ID = "db61149d-c02f-4f12-aaee-42f293b21121"; // Active Reporting Period

export async function createOpportunity(
  data: z.infer<typeof createOpportunitySchema>
) {
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
      user_id: TEMP_USER_ID,
      period_id: TEMP_PERIOD_ID,
      closed_at: closedAt,
    },
  });

  revalidatePath("/test");
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