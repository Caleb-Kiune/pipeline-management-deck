import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Opportunity, Target } from "@prisma/client";

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
  );
}
