import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(totalTarget)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(totalClosed)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(totalPipeline)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallAchievement.toFixed(2)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
