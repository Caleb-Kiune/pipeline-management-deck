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

export function PipelineView({ opportunities }: PipelineViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-right">Premium</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No opportunities found.
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.client_name}</TableCell>
                <TableCell>{opp.category}</TableCell>
                <TableCell>{opp.product.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <Badge variant={getStageBadgeVariant(opp.stage)}>
                    {opp.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatter.format(opp.expected_premium)}
                </TableCell>
                <TableCell>
                  {new Date(opp.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {/* Conceptual placeholder: clicking this would open a dialog with OpportunityForm */}
                  <Button variant="ghost" size="sm">
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
