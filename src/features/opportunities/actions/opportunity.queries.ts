"use server";

import { PrismaClient, Stage, Opportunity } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCOOPipeline(userId: string, periodId: string): Promise<Opportunity[]> {
  const opportunities = await prisma.opportunity.findMany({
    where: {
      user_id: userId,
      period_id: periodId,
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return opportunities;
}

export async function getCOOKPIs(userId: string, periodId: string) {
  const baseWhere = {
    user_id: userId,
    period_id: periodId,
  };

  const [pipelineAgg, closedAgg] = await Promise.all([
    prisma.opportunity.aggregate({
      where: {
        ...baseWhere,
        stage: {
          in: [Stage.PROSPECT, Stage.QUOTED],
        },
      },
      _sum: {
        expected_premium: true,
      },
    }),
    prisma.opportunity.aggregate({
      where: {
        ...baseWhere,
        stage: Stage.CLOSED,
      },
      _sum: {
        expected_premium: true,
      },
    }),
  ]);

  return {
    pipelineValue: pipelineAgg._sum.expected_premium || 0,
    reportedClosed: closedAgg._sum.expected_premium || 0,
  };
}
