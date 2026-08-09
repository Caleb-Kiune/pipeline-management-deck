import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPICardsProps {
  pipelineValue: number;
  reportedClosed: number;
}

export function KPICards({ pipelineValue, reportedClosed }: KPICardsProps) {
  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(pipelineValue)}</div>
          <p className="text-xs text-muted-foreground">
            Prospects and Quoted opportunities
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reported Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(reportedClosed)}</div>
          <p className="text-xs text-muted-foreground">
            Successfully closed opportunities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
