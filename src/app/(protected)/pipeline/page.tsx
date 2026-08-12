import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient, PeriodStatus } from "@prisma/client";
import { getCOOPipeline, getCOOKPIs } from "@/features/opportunities/actions/opportunity.queries";
import { KPICards } from "@/features/opportunities/components/kpi-cards";
import { PipelineWorkspace } from "@/features/opportunities/components/pipeline-workspace";

const prisma = new PrismaClient();

export default async function PipelinePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const userId = session.user.id;

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN },
  });

  if (!activePeriod) {
    return <div className="container mx-auto py-10 px-4">No active reporting period found. Please contact an administrator.</div>;
  }

  const periodId = activePeriod.id;
  const kpis = await getCOOKPIs(userId, periodId);
  const pipeline = await getCOOPipeline(userId, periodId);

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">COO Workspace</h1>
        <p className="text-muted-foreground">Manage your pipeline and track your performance.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">My KPIs</h2>
        <KPICards pipelineValue={kpis.pipelineValue} reportedClosed={kpis.reportedClosed} />
      </section>

      <PipelineWorkspace opportunities={pipeline} />
    </div>
  );
}
