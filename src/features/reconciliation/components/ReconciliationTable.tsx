"use client";

import { useState } from "react";
import { MappingModal } from "./MappingModal";
import type { ExcelRowData } from "./ExcelUploader";

export interface ReconciliationTableProps {
  opportunities: any[];
  excelData: ExcelRowData[];
  onOpportunityMapped: (opportunityId: string) => void;
}

export function ReconciliationTable({ opportunities, excelData, onOpportunityMapped }: ReconciliationTableProps) {
  const [activeOpportunity, setActiveOpportunity] = useState<any | null>(null);

  if (opportunities.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-12 text-center text-muted-foreground shadow-sm">
        <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium text-foreground">All caught up!</p>
        <p className="mt-1 text-sm">No pending reconciliations for this COO.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted uppercase tracking-wider">
            <tr className="border-b border-border">
              <th className="px-6 py-4 font-medium">Client Name</th>
              <th className="px-6 py-4 font-medium">Expected Premium</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium w-[120px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr key={opp.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{opp.client_name}</td>
                <td className="px-6 py-4 text-muted-foreground">Ksh {opp.expected_premium.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${opp.reconciliation_status === 'FLAGGED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-secondary text-secondary-foreground'}`}>
                    {opp.reconciliation_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setActiveOpportunity(opp)}
                    className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md shadow-sm hover:bg-primary/90 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Map
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeOpportunity && (
        <MappingModal 
          opportunity={activeOpportunity} 
          excelData={excelData} 
          onClose={() => setActiveOpportunity(null)}
          onActionComplete={() => {
            onOpportunityMapped(activeOpportunity.id);
            setActiveOpportunity(null);
          }}
        />
      )}
    </div>
  );
}
