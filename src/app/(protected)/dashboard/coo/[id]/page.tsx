import { prisma } from "@/lib/db";
import { PeriodStatus, Role } from "@prisma/client";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
import { KPICards } from "@/features/opportunities/components/kpi-cards";

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

      <KPICards opportunities={opportunities} target={target} />

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
                {opportunities.filter(o => o.product === "COOP_CARE").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No medical opportunities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  opportunities.filter(o => o.product === "COOP_CARE").map((opp) => (
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
                {opportunities.filter(o => o.product !== "COOP_CARE").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No non-medical opportunities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  opportunities.filter(o => o.product !== "COOP_CARE").map((opp) => (
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
