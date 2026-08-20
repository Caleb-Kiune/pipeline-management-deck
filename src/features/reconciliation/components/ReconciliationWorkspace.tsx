"use client";

import { useState, useMemo } from "react";
import { ExcelUploader, type ExcelRowData } from "./ExcelUploader";
import { ReconciliationTable } from "./ReconciliationTable";
import Fuse from "fuse.js";

export interface EvaluatedOpportunity {
  opportunity: any;
  matchColor: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';
  topCandidates: ExcelRowData[];
  matchReasons: string[];
}

export function ReconciliationWorkspace({ initialOpportunities, verifiedInvoices }: { initialOpportunities: any[], verifiedInvoices: string[] }) {
  const [masterExcelData, setMasterExcelData] = useState<ExcelRowData[] | null>(null);
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
    setMasterExcelData(prev => {
      const existing = prev || [];
      // Deduplicate: avoid pushing rows with identical stringified content (e.g. from re-uploading same sheet)
      const existingSet = new Set(existing.map(e => JSON.stringify(e)));
      const newUnique = data.filter(d => !existingSet.has(JSON.stringify(d)));
      return [...existing, ...newUnique];
    });
    
    // Auto-select first COO if available
    if (coos.length > 0 && !selectedCooId) {
      setSelectedCooId(coos[0].id);
    }
  };

  const handleOpportunityMapped = (opportunityId: string) => {
    setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
  };

  const filteredOpportunities = useMemo(() => {
    if (!selectedCooId) return [];
    return opportunities.filter(opp => opp.user_id === selectedCooId);
  }, [opportunities, selectedCooId]);

  // The 6-Point Waterfall Matching Algorithm
  const evaluatedOpportunities = useMemo<EvaluatedOpportunity[]>(() => {
    if (!masterExcelData || masterExcelData.length === 0) return [];

    const nameFuse = new Fuse(masterExcelData, { keys: ["Insured", "Client Name", "Client"], threshold: 0.4, includeScore: true });
    const interFuse = new Fuse(masterExcelData, { keys: ["Intermediary_name", "Intermediary"], threshold: 0.4, includeScore: true });

    return filteredOpportunities.map(opp => {
      const nameRes = nameFuse.search(opp.client_name, { limit: 5 });
      const interRes = interFuse.search(opp.intermediary || "", { limit: 5 });

      // Combine unique candidates
      const candidateSet = new Set<ExcelRowData>();
      nameRes.forEach(r => candidateSet.add(r.item));
      interRes.forEach(r => candidateSet.add(r.item));
      const candidates = Array.from(candidateSet);

      const scoredCandidates = candidates.map(candidate => {
        let score = 0;
        let reasons: string[] = [];
        let isRed = false;

        // 1. Client Name (Fuzzy)
        const isNameMatch = nameRes.some(r => r.item === candidate);
        if (isNameMatch) {
          score += 2;
          reasons.push("Client Name matched.");
        }

        // 2. Intermediary (Fuzzy)
        const isInterMatch = interRes.some(r => r.item === candidate);
        if (isInterMatch) {
          score += 2;
          reasons.push("Intermediary matched.");
        }

        // 3. Premium (Proximity)
        const excelPremium = Number(candidate.Gross_premium_kshs || candidate["Gross Premium"] || candidate.Premium || candidate.Paid_amount_kshs || candidate.Basic_premium_kshs || 0);
        const oppPremium = opp.expected_premium;
        if (Math.abs(excelPremium - oppPremium) <= oppPremium * 0.05) {
          score += 2;
          reasons.push("Premium matches within 5%.");
        } else {
          reasons.push(`Premium mismatch (Expected: ${oppPremium}, Excel: ${excelPremium}).`);
        }

        // 4. Product / Category Alignment
        const prCategory = candidate._prCategory || "Unknown";
        // Simple heuristic: If product is MEDICAL, we expect Medical PR
        if ((opp.product.includes("MEDICAL") || opp.product === "COOP_CARE") && prCategory === "Medical") {
          score += 1;
        }

        // 5. Branch (Strict)
        const cooBranch = opp.user?.branch?.name?.toUpperCase() || "UNKNOWN";
        const excelBranch = String(candidate.Branch_name || candidate.Branch || "N/A").toUpperCase();
        if (excelBranch !== "N/A" && cooBranch !== "UNKNOWN") {
          if (!excelBranch.includes(cooBranch) && !cooBranch.includes(excelBranch)) {
            isRed = true;
            score -= 5;
            reasons.push(`CONFLICT: Cross-Branch Claim (PR: ${excelBranch}, COO: ${cooBranch})`);
          } else {
            score += 1;
          }
        }

        // 6. Cover Month / Period (Strict) - assuming Account_period format YYYY-MM or similar
        // For now, if Account_period exists and is old, flag it.
        const accountPeriod = String(candidate.Account_period || candidate.Cover_period || candidate.Period || "");
        if (accountPeriod && !accountPeriod.includes("2026")) { // simplistic check based on seed data
           isRed = true;
           score -= 5;
           reasons.push(`CONFLICT: Historical Claim (PR Period: ${accountPeriod})`);
        }

        // Conflict check on Invoice
        const invoiceNo = String(candidate.Invoice_number || candidate.Invoice || "");
        if (invoiceNo && verifiedInvoices.includes(invoiceNo)) {
          isRed = true;
          score -= 10;
          reasons.push(`CONFLICT: Excel Invoice ${invoiceNo} is already verified.`);
        }

        let color: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY' = 'GRAY';
        if (isRed) color = 'RED';
        else if (score >= 5) color = 'GREEN';
        else if (score > 0) color = 'YELLOW';

        return { candidate, score, reasons, color };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);

      const topCandidates = scoredCandidates.map(c => c.candidate);
      const best = scoredCandidates[0];
      const matchColor = best ? best.color : 'GRAY';
      const matchReasons = best ? best.reasons : ["No viable match found in Excel Data Lake."];

      return {
        opportunity: opp,
        matchColor,
        topCandidates,
        matchReasons
      };
    });
  }, [filteredOpportunities, masterExcelData, verifiedInvoices]);

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        Data Lake Status: {masterExcelData ? `${masterExcelData.length} total rows loaded` : 'Empty'}
      </div>
      
      <ExcelUploader onDataProcessed={handleDataProcessed} />
      
      {masterExcelData && (
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
              
              <button 
                onClick={() => setMasterExcelData(null)}
                className="w-full px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
              >
                Clear Data Lake
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
