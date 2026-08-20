import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReconciliationProvider } from "@/features/reconciliation/reconciliation-context";
import { WorkspaceShell } from "@/features/reconciliation/components/WorkspaceShell";
import { prisma } from "@/lib/db";
import { PeriodStatus, Stage, ReconciliationStatus } from "@prisma/client";

export default async function ReconciliationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const role = session.user.role as string;
  if (role !== "MANAGEMENT" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ]
  });

  if (!activePeriod) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pipeline Reconciliation</h1>
          <p className="text-muted-foreground mt-2">No active reporting period found.</p>
        </div>
      </div>
    );
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      period_id: activePeriod.id,
      stage: Stage.CLOSED,
      reconciliation_status: {
        in: [ReconciliationStatus.UNRECONCILED, ReconciliationStatus.FLAGGED]
      }
    },
    include: { user: { include: { branch: true } } },
    orderBy: { created_at: 'desc' }
  });

  const verifiedRecords = await prisma.opportunity.findMany({
    where: {
      period_id: activePeriod.id,
      reconciliation_status: ReconciliationStatus.VERIFIED,
      pr_invoice_number: { not: null }
    },
    select: { pr_invoice_number: true }
  });

  const verifiedInvoices = verifiedRecords
    .map(v => v.pr_invoice_number)
    .filter((v): v is string => v !== null)
    .flatMap(v => v.split(','));

  return (
    <ReconciliationProvider 
      initialOpportunities={opportunities} 
      verifiedInvoices={verifiedInvoices}
      activePeriodMonth={activePeriod.month}
      activePeriodYear={activePeriod.year}
    >
      <WorkspaceShell />
    </ReconciliationProvider>
  );
}
