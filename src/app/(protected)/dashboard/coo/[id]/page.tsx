import { prisma } from "@/lib/db";
import { PeriodStatus, Role } from "@prisma/client";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatMonthYear } from "@/lib/utils";

export default async function CooDashboardPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "MANAGEMENT" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const { id } = await props.params;

  // 1. Fetch Open Period
  const activePeriod = await prisma.reportingPeriod.findFirst({
    where: { status: PeriodStatus.OPEN }
  });
  if (!activePeriod) return <div className="p-6">No active reporting period.</div>;

  // 2. Fetch COO
  const coo = await prisma.user.findUnique({
    where: { id, role: "COO" },
    include: { branch: true }
  });
  if (!coo) return <div className="p-6">COO not found.</div>;

  // 3. Fetch Targets
  const target = await prisma.target.findUnique({
    where: { user_id_period_id: { user_id: id, period_id: activePeriod.id } }
  });

  // 4. Fetch Opportunities
  const opportunities = await prisma.opportunity.findMany({
    where: { user_id: id, period_id: activePeriod.id },
    orderBy: { created_at: 'desc' }
  });

  // Calculate Medical Metrics
  const medOpps = opportunities.filter(o => o.product === "COOP_CARE");
  const medClosed = medOpps.filter(o => o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const medTarget = target?.medical_target || 0;

  // Calculate Non-Medical Metrics
  const nonMedOpps = opportunities.filter(o => o.product !== "COOP_CARE");
  const nonMedClosed = nonMedOpps.filter(o => o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const nonMedTarget = target?.non_medical_target || 0;

  // Non-Medical Sub-breakdowns (Closed)
  const livestockClosed = nonMedOpps.filter(o => ["LIVESTOCK", "POULTRY", "PIGS"].includes(o.product) && o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const studentPaClosed = nonMedOpps.filter(o => o.product === "STUDENTS_PA" && o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const jikingeClosed = nonMedOpps.filter(o => o.product === "JIKINGE" && o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const biasharaSalamaClosed = nonMedOpps.filter(o => o.product === "BIASHARA_SALAMA" && o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const gfeClosed = nonMedOpps.filter(o => o.product === "GFE" && o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);

  // Total Metrics
  const totalTarget = medTarget + nonMedTarget;
  const totalClosed = medClosed + nonMedClosed;

  const calcPercentage = (closed: number, tgt: number) => {
    if (tgt === 0) return "0.0";
    return ((closed / tgt) * 100).toFixed(1);
  };

  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  });

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{coo.name} - Performance Dashboard</h1>
        <p className="text-muted-foreground">{coo.branch?.name || "Unknown Branch"} | Active Period: {activePeriod.month}/{activePeriod.year}</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Month to Date Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-2xl font-bold">{formatter.format(totalTarget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Closed</p>
              <p className="text-2xl font-bold text-green-600">{formatter.format(totalClosed)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">% Achieved</p>
              <p className="text-2xl font-bold text-primary">{calcPercentage(totalClosed, totalTarget)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Medical Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Medical</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{formatter.format(medTarget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Closed (COOP CARE):</span>
                <span className="font-medium text-green-600">{formatter.format(medClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">% Achieved:</span>
                <span className="font-bold">{calcPercentage(medClosed, medTarget)}%</span>
              </div>
            </div>

            {/* Non-Medical Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Non-Medical</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{formatter.format(nonMedTarget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Closed:</span>
                <span className="font-medium text-green-600">{formatter.format(nonMedClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">% Achieved:</span>
                <span className="font-bold">{calcPercentage(nonMedClosed, nonMedTarget)}%</span>
              </div>
              
              <div className="pt-2 border-t mt-2">
                <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase">Sub-Breakdown (Closed)</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Livestock + Poultry + Pigs:</span>
                    <span>{formatter.format(livestockClosed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student PA:</span>
                    <span>{formatter.format(studentPaClosed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jikinge:</span>
                    <span>{formatter.format(jikingeClosed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biashara Salama:</span>
                    <span>{formatter.format(biasharaSalamaClosed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GFE:</span>
                    <span>{formatter.format(gfeClosed)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <CollapsibleSection title="Medical Opportunities" defaultOpen={true}>
          <div className="w-full overflow-x-auto rounded-md border bg-card">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="min-w-[200px]">Prospect</TableHead>
                  <TableHead className="min-w-[150px]">Contact Person</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Expected Premium</TableHead>
                  <TableHead className="whitespace-nowrap">Expected Closure</TableHead>
                  <TableHead className="whitespace-nowrap">Current Status</TableHead>
                  <TableHead className="min-w-[200px]">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medOpps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No medical opportunities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  medOpps.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="whitespace-nowrap">{opp.product.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium">{opp.client_name}</TableCell>
                      <TableCell>{opp.contact_person || "-"}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatter.format(opp.expected_premium)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatMonthYear(opp.expected_closure_month)}</TableCell>
                      <TableCell className="whitespace-nowrap">{opp.stage}</TableCell>
                      <TableCell className="max-w-[250px] truncate" title={opp.latest_comment || ""}>
                        {opp.latest_comment || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Non-Medical Opportunities" defaultOpen={true}>
          <div className="w-full overflow-x-auto rounded-md border bg-card">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="min-w-[200px]">Prospect</TableHead>
                  <TableHead className="min-w-[150px]">Contact Person</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Expected Premium</TableHead>
                  <TableHead className="whitespace-nowrap">Expected Closure</TableHead>
                  <TableHead className="whitespace-nowrap">Current Status</TableHead>
                  <TableHead className="min-w-[200px]">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonMedOpps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No non-medical opportunities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  nonMedOpps.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="whitespace-nowrap">{opp.product.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium">{opp.client_name}</TableCell>
                      <TableCell>{opp.contact_person || "-"}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatter.format(opp.expected_premium)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatMonthYear(opp.expected_closure_month)}</TableCell>
                      <TableCell className="whitespace-nowrap">{opp.stage}</TableCell>
                      <TableCell className="max-w-[250px] truncate" title={opp.latest_comment || ""}>
                        {opp.latest_comment || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
