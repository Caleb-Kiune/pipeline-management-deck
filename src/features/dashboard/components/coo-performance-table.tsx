import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { COODashboardStats } from "../actions/dashboard.queries";

interface COOPerformanceTableProps {
  performanceData: COODashboardStats[];
}

export function COOPerformanceTable({ performanceData }: COOPerformanceTableProps) {
  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  });

  return (
    <div className="w-full overflow-x-auto rounded-md border bg-card">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>COO Name</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead className="text-right">Reported Closed</TableHead>
            <TableHead className="text-right">Pipeline</TableHead>
            <TableHead className="text-right">Achievement %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performanceData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-48">
                <EmptyState 
                  title="No COO data found" 
                  description="There is no performance data to display for this period."
                />
              </TableCell>
            </TableRow>
          ) : (
            performanceData.map((coo) => (
              <TableRow key={coo.id}>
                <TableCell>{coo.branchName}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/coo/${coo.id}`} className="text-primary hover:underline">
                    {coo.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right">{formatter.format(coo.targetValue)}</TableCell>
                <TableCell className="text-right">{formatter.format(coo.reportedClosed)}</TableCell>
                <TableCell className="text-right">{formatter.format(coo.pipelineValue)}</TableCell>
                <TableCell className="text-right font-medium">
                  {coo.achievementPercentage.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
