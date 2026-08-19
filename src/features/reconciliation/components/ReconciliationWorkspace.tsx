"use client";

import { useState, useMemo } from "react";
import { ExcelUploader, type ExcelRowData } from "./ExcelUploader";
import { ReconciliationTable } from "./ReconciliationTable";
import Fuse from "fuse.js";

export interface EvaluatedOpportunity {
  opportunity: any;
  matchColor: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';
  bestMatch: ExcelRowData | null;
  matchReasons: string[];
}

export function ReconciliationWorkspace({ initialOpportunities, verifiedInvoices }: { initialOpportunities: any[], verifiedInvoices: string[] }) {
  const [excelData, setExcelData] = useState<ExcelRowData[] | null>(null);
  const [selectedCooId, setSelectedCooId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState(initialOpportunities);

  // Group COOs from opportunities
  const coos = useMemo(() => {
    const map = new Map<string, { id: string, name: string, count: number }>();
    opportunities.forEach(opp => {
      if (opp.user) {
        const existing = map.get(opp.user.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(opp.user.id, { id: opp.user.id, name: opp.user.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [opportunities]);

  const handleDataProcessed = (data: ExcelRowData[]) => {
    setExcelData(data);
    // Auto-select first COO if available
    if (coos.length > 0 && !selectedCooId) {
      setSelectedCooId(coos[0].id);
    }
  };

  const handleOpportunityMapped = (opportunityId: string) => {
    // Optimistic UI update: remove the mapped opportunity from local state
    setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
  };

  const filteredOpportunities = useMemo(() => {
    if (!selectedCooId) return [];
    return opportunities.filter(opp => opp.user_id === selectedCooId);
  }, [opportunities, selectedCooId]);

  // The Composite Matching Algorithm
  const evaluatedOpportunities = useMemo<EvaluatedOpportunity[]>(() => {
    if (!excelData || excelData.length === 0) return [];

    const nameFuse = new Fuse(excelData, { keys: ["Insured", "Client Name", "Client"], threshold: 0.4, includeScore: true });
    const interFuse = new Fuse(excelData, { keys: ["Intermediary_name", "Intermediary"], threshold: 0.4, includeScore: true });

    return filteredOpportunities.map(opp => {
      const nameRes = nameFuse.search(opp.client_name);
      const interRes = interFuse.search(opp.intermediary || "");

      // Get top matches
      const topNameMatch = nameRes[0];
      const topInterMatch = interRes[0];

      let bestMatch: ExcelRowData | null = null;
      let reasons: string[] = [];
      let color: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY' = 'GRAY';

      if (topNameMatch) {
        bestMatch = topNameMatch.item;
        reasons.push("Client Name matched.");
      } else if (topInterMatch) {
        bestMatch = topInterMatch.item;
        reasons.push("Client Name didn't match, but Intermediary did.");
      }

      if (bestMatch) {
        // Evaluate Premium
        const excelPremium = Number(bestMatch.Gross_premium_kshs || bestMatch["Gross Premium"] || bestMatch.Premium || bestMatch.Paid_amount_kshs || bestMatch.Basic_premium_kshs || 0);
        const oppPremium = opp.expected_premium;
        
        const diff = Math.abs(excelPremium - oppPremium);
        const margin = oppPremium * 0.05; // 5% margin
        
        const isPremiumMatch = diff <= margin;
        if (isPremiumMatch) {
          reasons.push("Premium matches within 5% margin.");
        } else {
          reasons.push(`Premium mismatch (Expected: ${oppPremium}, Excel: ${excelPremium}).`);
        }

        const isInterMatch = topInterMatch && topInterMatch.item === bestMatch;
        if (isInterMatch && !reasons.includes("Client Name didn't match, but Intermediary did.")) {
          reasons.push("Intermediary matched.");
        } else if (!isInterMatch) {
          reasons.push("Intermediary mismatch.");
        }

        // Branch check
        const cooBranch = opp.user?.branch?.name?.toUpperCase() || "UNKNOWN";
        const excelBranch = String(bestMatch.Branch_name || bestMatch.Branch || "N/A").toUpperCase();
        
        let isBranchMismatch = false;
        if (excelBranch !== "N/A" && cooBranch !== "UNKNOWN") {
          if (!excelBranch.includes(cooBranch) && !cooBranch.includes(excelBranch)) {
            isBranchMismatch = true;
            reasons.push(`CONFLICT: Cross-Branch Claim (PR Branch: ${excelBranch}, COO Branch: ${cooBranch})`);
          } else {
            reasons.push("Branch matched.");
          }
        }

        // Conflict check
        const invoiceNo = String(bestMatch.Invoice_number || bestMatch.Invoice || "");
        let isInvoiceConflict = false;
        if (invoiceNo && verifiedInvoices.includes(invoiceNo)) {
          isInvoiceConflict = true;
          reasons.push(`CONFLICT: Excel Invoice ${invoiceNo} is already verified by another COO.`);
        }

        if (isInvoiceConflict || isBranchMismatch) {
          color = 'RED';
        } else if (topNameMatch && isPremiumMatch && isInterMatch) {
          color = 'GREEN';
        } else {
          color = 'YELLOW';
        }
      } else {
        reasons.push("No viable match found in Excel.");
      }

      return {
        opportunity: opp,
        matchColor: color,
        bestMatch,
        matchReasons: reasons
      };
    });
  }, [filteredOpportunities, excelData, verifiedInvoices]);

  return (
    <div>
      {!excelData ? (
        <ExcelUploader onDataProcessed={handleDataProcessed} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar COO Selector */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-card border rounded-xl p-5 shadow-sm sticky top-24">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Select COO</h3>
              <div className="space-y-1">
                {coos.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">No COOs have pending reconciliations.</p>
                ) : (
                  coos.map(coo => (
                    <button
                      key={coo.id}
                      onClick={() => setSelectedCooId(coo.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex justify-between items-center ${selectedCooId === coo.id ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'hover:bg-muted text-foreground'}`}
                    >
                      <span className="truncate pr-2">{coo.name}</span>
                      <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full ${selectedCooId === coo.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                        {coo.count}
                      </span>
                    </button>
                  ))
                )}
              </div>
              
              <hr className="my-6 border-border" />
              
              <div className="text-xs text-muted-foreground mb-3 text-center">Loaded Sheet Data</div>
              <button 
                onClick={() => setExcelData(null)}
                className="w-full px-4 py-2 text-sm font-medium text-foreground border rounded-lg hover:bg-muted transition-colors shadow-sm"
              >
                Change Excel Sheet
              </button>
            </div>
          </div>

          {/* Main Table View */}
          <div className="flex-1">
            {selectedCooId ? (
              <ReconciliationTable 
                evaluatedOpportunities={evaluatedOpportunities} 
                onOpportunityMapped={handleOpportunityMapped}
              />
            ) : (
              <div className="border rounded-xl bg-card p-12 text-center text-muted-foreground shadow-sm">
                <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium text-foreground">Select a COO</p>
                <p className="mt-1 text-sm">Choose a COO from the sidebar to view their pending opportunities.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
