import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, BarChart3, Award } from "lucide-react";

interface CompanyKPIsProps {
  totalTarget: number;
  totalClosed: number;
  totalPipeline: number;
  overallAchievement: number;
}

export function CompanyKPIs({
  totalTarget,
  totalClosed,
  totalPipeline,
  overallAchievement,
}: CompanyKPIsProps) {
  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  });

  const kpis = [
    {
      label: "Total Target",
      value: formatter.format(totalTarget),
      icon: Target,
      accent: "border-l-gray-400",
    },
    {
      label: "Total Closed",
      value: formatter.format(totalClosed),
      icon: TrendingUp,
      accent: "border-l-emerald-500",
    },
    {
      label: "Total Pipeline",
      value: formatter.format(totalPipeline),
      icon: BarChart3,
      accent: "border-l-amber-500",
    },
    {
      label: "Overall Achievement",
      value: `${overallAchievement.toFixed(1)}%`,
      icon: Award,
      accent: "border-l-primary",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={`border-l-4 ${kpi.accent}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </span>
              <kpi.icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {kpi.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
