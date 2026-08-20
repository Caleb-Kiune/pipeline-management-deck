"use server";

import { prisma } from "@/lib/db";
import { ReconciliationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface BulkUpdateItem {
  opportunityId: string;
  status: ReconciliationStatus;
  payload?: {
    pr_invoice_number?: string;
    pr_verified_data?: any;
    notes?: string;
  };
}

export async function bulkUpdateReconciliationStatus(items: BulkUpdateItem[]) {
  if (items.length === 0 || items.length > 100) {
    throw new Error(`Invalid batch size: ${items.length}. Must be 1-100.`);
  }

  await prisma.$transaction(
    items.map(item =>
      prisma.opportunity.update({
        where: { id: item.opportunityId },
        data: {
          reconciliation_status: item.status,
          pr_invoice_number: item.payload?.pr_invoice_number || null,
          pr_verified_data: item.payload?.pr_verified_data
            ? item.payload.pr_verified_data
            : null,
          reconciliation_notes: item.payload?.notes || null,
        },
      })
    )
  );

  revalidatePath('/dashboard/reconciliation');
}
