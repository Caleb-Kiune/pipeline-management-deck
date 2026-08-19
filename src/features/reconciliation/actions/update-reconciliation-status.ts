"use server";

import { prisma } from "@/lib/db";
import { ReconciliationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateReconciliationStatus(
  opportunityId: string, 
  status: ReconciliationStatus, 
  payload?: { pr_invoice_number?: string, pr_verified_data?: any, notes?: string }
) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      reconciliation_status: status,
      pr_invoice_number: payload?.pr_invoice_number || null,
      pr_verified_data: payload?.pr_verified_data ? payload.pr_verified_data : null,
      reconciliation_notes: payload?.notes || null,
    }
  });

  revalidatePath('/dashboard/reconciliation');
}
