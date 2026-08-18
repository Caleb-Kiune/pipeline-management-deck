"use server";

import { prisma } from "@/lib/db";
import { ReconciliationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateReconciliationStatus(
  opportunityId: string, 
  status: ReconciliationStatus, 
  actualPremium?: number, 
  notes?: string
) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      reconciliation_status: status,
      actual_premium_kshs: actualPremium,
      reconciliation_notes: notes,
    }
  });

  revalidatePath('/dashboard/reconciliation');
}
