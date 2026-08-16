import { getDashboardStats } from "../actions/dashboard.queries";
import { CompanyKPIs } from "./company-kpis";
import { COOPerformanceTable } from "./coo-performance-table";
import { DashboardFilter } from "./dashboard-filter";

interface DashboardViewProps {
  periodId: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function DashboardView({ periodId, searchParams }: DashboardViewProps) {
  // Extract category from searchParams safely
  const categoryParam = typeof searchParams?.category === "string" ? searchParams.category : undefined;
  
  // Validate if it's a valid enum value
  let filter: "MEDICAL" | "NON_MEDICAL" | undefined = undefined;
  if (categoryParam === "MEDICAL" || categoryParam === "NON_MEDICAL") {
    filter = categoryParam;
  }

  // Await the server action directly in the Server Component
  const { companyTotals, cooPerformance } = await getDashboardStats(periodId, filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Management Dashboard</h2>
          <p className="text-muted-foreground">Company-wide COO performance and metrics.</p>
        </div>
        <DashboardFilter />
      </div>
      
      <CompanyKPIs 
        totalTarget={companyTotals.totalTarget}
        totalClosed={companyTotals.totalClosed}
        totalPipeline={companyTotals.totalPipeline}
        overallAchievement={companyTotals.overallAchievement}
      />
      
      <div>
        <h3 className="text-xl font-semibold mb-4">COO Performance Breakdown</h3>
        <COOPerformanceTable performanceData={cooPerformance} />
      </div>
    </div>
  );
}
