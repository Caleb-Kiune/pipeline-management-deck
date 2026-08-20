"use client";

import { useState } from "react";
import { Opportunity } from "@prisma/client";
import { PipelineView } from "./pipeline-view";
import { OpportunityForm } from "./opportunity-form";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

interface PipelineWorkspaceProps {
  opportunities: Opportunity[];
}

export function PipelineWorkspace({ opportunities }: PipelineWorkspaceProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  const handleEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingOpp(null);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingOpp(null);
  };

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Pipeline</h2>
          {!isFormOpen && (
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Opportunity
            </Button>
          )}
        </div>
        
        {isFormOpen && (
          <div className="mb-8 p-6 border rounded-xl shadow-sm bg-card relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingOpp ? "Edit Opportunity" : "Add New Opportunity"}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <OpportunityForm 
              initialData={editingOpp ? { 
                ...editingOpp, 
                contact_person: editingOpp.contact_person || undefined, 
                latest_comment: editingOpp.latest_comment || undefined 
              } as any : undefined} 
              onSuccess={handleClose} 
            />
          </div>
        )}

        <div className="space-y-8">
          <CollapsibleSection title="Medical Opportunities" defaultOpen={true}>
            <PipelineView opportunities={opportunities.filter((opp) => opp.product === "COOP_CARE")} onEdit={handleEdit} />
          </CollapsibleSection>
          <CollapsibleSection title="Non-Medical Opportunities" defaultOpen={true}>
            <PipelineView opportunities={opportunities.filter((opp) => opp.product !== "COOP_CARE")} onEdit={handleEdit} />
          </CollapsibleSection>
        </div>
      </section>
    </div>
  );
}
