"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { PeriodStatus, Stage, ReconciliationStatus } from "@prisma/client";
import Fuse from "fuse.js";

const rowSchema = z.object({
  insured: z.string(),
  premium: z.number(),
  branch: z.string().optional(),
});

const payloadSchema = z.array(rowSchema);

export async function processReconciliation(payload: unknown) {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Invalid payload data from Excel");
  }
  const data = parsed.data;

  // Fetch active period
  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });
  
  if (!activePeriod) {
    throw new Error("No active reporting period found");
  }

  // Fetch CLOSED and UNRECONCILED opportunities for this period
  const opportunities = await prisma.opportunity.findMany({
    where: {
      period_id: activePeriod.id,
      stage: Stage.CLOSED,
      reconciliation_status: ReconciliationStatus.UNRECONCILED
    },
    include: { user: true }
  });

  const fuse = new Fuse(opportunities, {
    keys: ["client_name"],
    threshold: 0.4,
    includeScore: true,
  });

  const matches = data.map(row => {
    const searchResult = fuse.search(row.insured);
    const bestMatch = searchResult.length > 0 ? searchResult[0] : null;
    
    return {
      excelRow: row,
      match: bestMatch?.item ? {
        id: bestMatch.item.id,
        client_name: bestMatch.item.client_name,
        expected_premium: bestMatch.item.expected_premium,
        coo_name: bestMatch.item.user.name,
      } : null,
      confidence: bestMatch?.score !== undefined ? Math.round((1 - bestMatch.score) * 100) : 0
    };
  });

  return matches;
}
