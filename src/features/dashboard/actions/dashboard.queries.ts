"use server";

import { Role, Stage } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface COODashboardStats {
  id: string;
  name: string;
  branchName: string;
  targetValue: number;
  reportedClosed: number;
  pipelineValue: number;
  achievementPercentage: number;
}

export interface DashboardStatsResult {
  companyTotals: {
    totalTarget: number;
    totalClosed: number;
    totalPipeline: number;
    overallAchievement: number;
  };
  cooPerformance: COODashboardStats[];
}

export async function getDashboardStats(
  periodId: string,
  categoryFilter?: "MEDICAL" | "NON_MEDICAL"
): Promise<DashboardStatsResult> {
  // Fetch all COOs with their branch, targets for this period, and opportunities for this period
  const coos = await prisma.user.findMany({
    where: {
      role: Role.COO,
      isActive: true,
    },
    include: {
      branch: true,
      targets: {
        where: {
          period_id: periodId,
        },
      },
      opportunities: {
        where: {
          period_id: periodId,
          ...(categoryFilter === "MEDICAL" ? { product: "COOP_CARE" } : {}),
          ...(categoryFilter === "NON_MEDICAL" ? { product: { not: "COOP_CARE" } } : {}),
        },
      },
    },
  });

  let totalTarget = 0;
  let totalClosed = 0;
  let totalPipeline = 0;

  const cooPerformance: COODashboardStats[] = coos.map((coo) => {
    // Target is typically one per period per user
    const targetValue = coo.targets.reduce((sum: number, t: any) => {
      if (categoryFilter === "MEDICAL") return sum + t.medical_target;
      if (categoryFilter === "NON_MEDICAL") return sum + t.non_medical_target;
      return sum + t.medical_target + t.non_medical_target;
    }, 0);
    
    let reportedClosed = 0;
    let pipelineValue = 0;

    for (const opp of coo.opportunities) {
      if (opp.stage === Stage.CLOSED) {
        reportedClosed += opp.expected_premium;
      } else if (opp.stage === Stage.PROSPECT || opp.stage === Stage.QUOTED) {
        pipelineValue += opp.expected_premium;
      }
    }

    // Safely handle division by zero
    const achievementPercentage = targetValue > 0 ? (reportedClosed / targetValue) * 100 : 0;

    totalTarget += targetValue;
    totalClosed += reportedClosed;
    totalPipeline += pipelineValue;

    return {
      id: coo.id,
      name: coo.name,
      branchName: coo.branch?.name || "Unknown Branch",
      targetValue,
      reportedClosed,
      pipelineValue,
      achievementPercentage,
    };
  });

  // Safely handle division by zero for company totals
  const overallAchievement = totalTarget > 0 ? (totalClosed / totalTarget) * 100 : 0;

  return {
    companyTotals: {
      totalTarget,
      totalClosed,
      totalPipeline,
      overallAchievement,
    },
    cooPerformance,
  };
}
