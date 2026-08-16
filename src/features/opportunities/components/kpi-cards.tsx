import { Card, CardContent } from "@/components/ui/card";
import { Opportunity, Target } from "@prisma/client";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

interface KPICardsProps {
  opportunities: Opportunity[];
  target: Target | null;
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`h-1.5 w-full rounded-full bg-border ${className || ""}`}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
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
    if (tgt === 0) return 0;
    return (closed / tgt) * 100;
  };

  const totalPct = calcPercentage(totalClosed, totalTarget);
  const medPct = calcPercentage(medClosed, medTarget);
  const nonMedPct = calcPercentage(nonMedClosed, nonMedTarget);

  return (
    <CollapsibleSection title="KPI" defaultOpen={true}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Card — Brand accent */}
        <Card className="border-l-4 border-l-primary bg-primary/[0.03]">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Performance
              </span>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium tabular-nums">{formatter.format(totalTarget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-medium tabular-nums text-emerald-600">{formatter.format(totalClosed)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Achieved</span>
                <span className="text-3xl font-bold tabular-nums text-primary">{totalPct.toFixed(1)}%</span>
              </div>
              <ProgressBar value={totalPct} />
            </div>
          </CardContent>
        </Card>

        {/* Medical Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Medical
              </span>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium tabular-nums">{formatter.format(medTarget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-medium tabular-nums text-emerald-600">{formatter.format(medClosed)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Achieved</span>
                <span className="text-xl font-bold tabular-nums">{medPct.toFixed(1)}%</span>
              </div>
              <ProgressBar value={medPct} />
            </div>
          </CardContent>
        </Card>

        {/* Non-Medical Total Card */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Non-Medical
              </span>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium tabular-nums">{formatter.format(nonMedTarget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-medium tabular-nums text-emerald-600">{formatter.format(nonMedClosed)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Achieved</span>
                <span className="text-xl font-bold tabular-nums">{nonMedPct.toFixed(1)}%</span>
              </div>
              <ProgressBar value={nonMedPct} />
            </div>
          </CardContent>
        </Card>

        {/* Non-Medical Breakdown Card */}
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Non-Medical Breakdown
            </span>
            <div className="mt-3 space-y-2.5 text-sm">
              {[
                { label: "Livestock / Poultry", value: livestockClosed },
                { label: "Student PA", value: studentPaClosed },
                { label: "Jikinge", value: jikingeClosed },
                { label: "Biashara Salama", value: biasharaSalamaClosed },
                { label: "GFE", value: gfeClosed },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate pr-2">{item.label}</span>
                  <span className="font-medium tabular-nums shrink-0">{formatter.format(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </CollapsibleSection>
  );
}
