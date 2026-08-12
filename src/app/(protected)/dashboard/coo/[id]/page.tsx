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
  const medOpps = opportunities.filter(o => o.category === "MEDICAL");
  const medClosed = medOpps.filter(o => o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const medPipeline = medOpps.filter(o => o.stage === "PROSPECT" || o.stage === "QUOTED").reduce((s, o) => s + o.expected_premium, 0);
  const medTarget = target?.medical_target || 0;

  // Calculate Non-Medical Metrics
  const nonMedOpps = opportunities.filter(o => o.category === "NON_MEDICAL");
  const nonMedClosed = nonMedOpps.filter(o => o.stage === "CLOSED").reduce((s, o) => s + o.expected_premium, 0);
  const nonMedPipeline = nonMedOpps.filter(o => o.stage === "PROSPECT" || o.stage === "QUOTED").reduce((s, o) => s + o.expected_premium, 0);
  const nonMedTarget = target?.non_medical_target || 0;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Medical Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-semibold">{formatter.format(medTarget)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-semibold text-green-600">{formatter.format(medClosed)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Pipeline:</span>
              <span className="font-semibold">{formatter.format(medPipeline)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Achievement:</span>
              <span className="font-bold">
                {medTarget > 0 ? ((medClosed / medTarget) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Non-Medical Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Non-Medical Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-semibold">{formatter.format(nonMedTarget)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-semibold text-green-600">{formatter.format(nonMedClosed)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Pipeline:</span>
              <span className="font-semibold">{formatter.format(nonMedPipeline)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Achievement:</span>
              <span className="font-bold">
                {nonMedTarget > 0 ? ((nonMedClosed / nonMedTarget) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Opportunities</h2>
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Expected Premium</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No opportunities found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                opportunities.map((opp) => (
                  <TableRow key={opp.id}>
                    <TableCell className="font-medium">{opp.client_name}</TableCell>
                    <TableCell>{opp.contact_person || "-"}</TableCell>
                    <TableCell>{opp.category}</TableCell>
                    <TableCell>{opp.product.replace(/_/g, " ")}</TableCell>
                    <TableCell>{opp.stage}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatter.format(opp.expected_premium)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={opp.latest_comment || ""}>
                      {opp.latest_comment || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
