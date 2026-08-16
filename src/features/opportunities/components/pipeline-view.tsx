import { Opportunity } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stage } from "@prisma/client";

interface PipelineViewProps {
  opportunities: Opportunity[];
  onEdit?: (opp: Opportunity) => void;
}

const formatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

function getStageBadgeVariant(stage: Stage) {
  switch (stage) {
    case Stage.CLOSED:
      return "default";
    case Stage.PROSPECT:
      return "secondary";
    case Stage.QUOTED:
      return "outline";
    case Stage.LOST:
      return "destructive";
    default:
      return "default";
  }
}

export function PipelineView({ opportunities, onEdit }: PipelineViewProps) {
  return (
    <div className="w-full overflow-x-auto rounded-md border bg-card">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Prospect</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead className="text-right">Expected Premium</TableHead>
            <TableHead>Expected Closure Month</TableHead>
            <TableHead>Current Status</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No opportunities found.
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell>{opp.product.replace(/_/g, " ")}</TableCell>
                <TableCell className="font-medium">{opp.client_name}</TableCell>
                <TableCell>{opp.contact_person || "-"}</TableCell>
                <TableCell className="text-right">
                  {formatter.format(opp.expected_premium)}
                </TableCell>
                <TableCell>{opp.expected_closure_month}</TableCell>
                <TableCell>
                  <Badge variant={getStageBadgeVariant(opp.stage)}>
                    {opp.stage}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={opp.latest_comment || ""}>
                  {opp.latest_comment || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(opp)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
