import { Card, CardContent } from "@/components/ui/card";
import { Opportunity, Target } from "@prisma/client";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

interface KPICardsProps {
  opportunities: Opportunity[];
  target: Target | null;
}

export function KPICards({ opportunities, target }: KPICardsProps) {
  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
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

  return (
    <CollapsibleSection title="KPI" defaultOpen={true}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col justify-center h-full space-y-2">
            <h3 className="font-semibold text-primary text-lg border-b border-primary/20 pb-1 mb-1">Total Performance</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium">{formatter.format(totalTarget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-medium text-green-600">{formatter.format(totalClosed)}</span>
            </div>
            <div className="flex flex-col items-center justify-center mt-3 p-3 bg-card rounded-md border shadow-sm">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Achieved</span>
              <span className="text-3xl font-bold text-primary">{calcPercentage(totalClosed, totalTarget)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Medical Card */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-lg border-b pb-1 mb-1">Medical</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium">{formatter.format(medTarget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-medium text-green-600">{formatter.format(medClosed)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-sm font-medium text-muted-foreground">Achieved:</span>
              <span className="font-bold text-lg">{calcPercentage(medClosed, medTarget)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Non-Medical Total Card */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-lg border-b pb-1 mb-1">Non-Medical</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium">{formatter.format(nonMedTarget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-medium text-green-600">{formatter.format(nonMedClosed)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-sm font-medium text-muted-foreground">Achieved:</span>
              <span className="font-bold text-lg">{calcPercentage(nonMedClosed, nonMedTarget)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Non-Medical Breakdown Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold border-b pb-1 mb-2 text-sm text-muted-foreground uppercase tracking-wide">
              Non-Medical (Closed)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Livestock / Poultry</span>
                <span className="font-medium shrink-0">{formatter.format(livestockClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Student PA</span>
                <span className="font-medium shrink-0">{formatter.format(studentPaClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Jikinge</span>
                <span className="font-medium shrink-0">{formatter.format(jikingeClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Biashara Salama</span>
                <span className="font-medium shrink-0">{formatter.format(biasharaSalamaClosed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">GFE</span>
                <span className="font-medium shrink-0">{formatter.format(gfeClosed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </CollapsibleSection>
  );
}
