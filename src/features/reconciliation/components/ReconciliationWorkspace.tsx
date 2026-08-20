"use client";

import { useState, useMemo } from "react";
import { ExcelUploader, type ExcelRowData } from "./ExcelUploader";
import { ReconciliationTable } from "./ReconciliationTable";
import { VerifiedCart } from "./VerifiedCart";
import Fuse from "fuse.js";
import type {
  EvaluatedOpportunity,
  OpportunityWithUser,
  ScoredCandidate,
  Discrepancy,
  FieldMatchMap,
  FieldMatchStatus,
  MatchBucket,
} from "../types";
import {
  PRODUCT_TO_PR_CATEGORY,
  PREMIUM_TOLERANCE_PERCENT,
  NAME_MATCH_THRESHOLD,
  NAME_CANDIDATE_THRESHOLD,
  COVER_MONTH_TOLERANCE,
} from "../constants";

export interface ReconciliationWorkspaceProps {
  initialOpportunities: OpportunityWithUser[];
  verifiedInvoices: string[];
  activePeriodMonth: number;
  activePeriodYear: number;
}

function parsePeriodMatchesExact(
  periodStr: string,
  activeMonth: number,
  activeYear: number,
): boolean {
  const cleaned = periodStr.trim();
  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoMatch) {
    return parseInt(isoMatch[1]) === activeYear && parseInt(isoMatch[2]) === activeMonth;
  }
  const reversedMatch = cleaned.match(/^(\d{1,2})[-/](\d{4})$/);
  if (reversedMatch) {
    return parseInt(reversedMatch[2]) === activeYear && parseInt(reversedMatch[1]) === activeMonth;
  }
  const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const MONTH_ABBREVS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  const wordMatch = cleaned.match(/^([a-zA-Z]+)[-\s](\d{4})$/);
  if (wordMatch) {
    const monthWord = wordMatch[1].toLowerCase();
    const year = parseInt(wordMatch[2]);
    const monthIdx =
      MONTH_NAMES.indexOf(monthWord) !== -1
        ? MONTH_NAMES.indexOf(monthWord) + 1
        : MONTH_ABBREVS.indexOf(monthWord) !== -1
          ? MONTH_ABBREVS.indexOf(monthWord) + 1
          : -1;
    if (monthIdx > 0) {
      return year === activeYear && monthIdx === activeMonth;
    }
  }
  if (!cleaned.includes(String(activeYear))) {
    return false;
  }
  return true;
}

export function ReconciliationWorkspace({
  initialOpportunities,
  verifiedInvoices,
  activePeriodMonth,
  activePeriodYear,
}: ReconciliationWorkspaceProps) {
  const [masterExcelData, setMasterExcelData] = useState<ExcelRowData[] | null>(null);
  const [selectedCooId, setSelectedCooId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityWithUser[]>(initialOpportunities);
  
  const [verifiedItems, setVerifiedItems] = useState<EvaluatedOpportunity[]>([]);
  const [rejectedItems, setRejectedItems] = useState<EvaluatedOpportunity[]>([]);

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
      const existingSet = new Set(existing.map(e => JSON.stringify(e)));
      const newUnique = data.filter(d => !existingSet.has(JSON.stringify(d)));
      return [...existing, ...newUnique];
    });
    
    if (coos.length > 0 && !selectedCooId) {
      setSelectedCooId(coos[0].id);
    }
  };

  const handleOpportunityVerified = (item: EvaluatedOpportunity) => {
    setOpportunities(prev => prev.filter(o => o.id !== item.opportunity.id));
    setVerifiedItems(prev => [item, ...prev]);
  };

  const handleOpportunityRejected = (item: EvaluatedOpportunity) => {
    setOpportunities(prev => prev.filter(o => o.id !== item.opportunity.id));
    setRejectedItems(prev => [...prev, item]);
  };

  const handleUndoVerify = (opportunityId: string) => {
    const item = verifiedItems.find(v => v.opportunity.id === opportunityId);
    if (item) {
      setVerifiedItems(prev => prev.filter(v => v.opportunity.id !== opportunityId));
      setOpportunities(prev => [...prev, item.opportunity]);
    }
  };

  const filteredOpportunities = useMemo(() => {
    if (!selectedCooId) return [];
    return opportunities.filter(opp => opp.user_id === selectedCooId);
  }, [opportunities, selectedCooId]);

  const evaluatedOpportunities = useMemo<EvaluatedOpportunity[]>(() => {
    if (!masterExcelData || masterExcelData.length === 0) return [];

    const nameFuse = new Fuse(masterExcelData, {
      keys: ["Insured", "Client Name", "Client"],
      threshold: NAME_CANDIDATE_THRESHOLD,
      includeScore: true,
    });
    const interFuse = new Fuse(masterExcelData, {
      keys: ["Intermediary_name", "Intermediary"],
      threshold: 0.4,
      includeScore: true,
    });

    return filteredOpportunities.map((opp: OpportunityWithUser) => {
      // ── 1. CANDIDATE DISCOVERY ──
      const nameRes = nameFuse.search(opp.client_name, { limit: 10 });
      const interRes = interFuse.search(opp.intermediary || "", { limit: 10 });

      const candidateSet = new Set<ExcelRowData>();
      nameRes.forEach(r => candidateSet.add(r.item));
      interRes.forEach(r => candidateSet.add(r.item));
      const candidates = Array.from(candidateSet);

      // ── 2. CANDIDATE SCORING ──
      const scoredCandidates: ScoredCandidate[] = candidates.map(candidate => {
        let score = 0;
        let passesAllStrict = true;
        const discrepancies: Discrepancy[] = [];
        const fieldMatches: FieldMatchMap = {
          clientName: 'unavailable',
          intermediary: 'unavailable',
          branch: 'unavailable',
          premium: 'unavailable',
          product: 'unavailable',
          coverMonth: 'unavailable',
        };

        // BRANCH
        const cooBranch = opp.user?.branch?.name?.toUpperCase() || "";
        const excelBranch = String(candidate.Branch_name || candidate.Branch || "").toUpperCase();
        if (cooBranch && excelBranch) {
          if (excelBranch.includes(cooBranch) || cooBranch.includes(excelBranch)) {
            fieldMatches.branch = 'match';
            score += 1;
          } else {
            fieldMatches.branch = 'mismatch';
            passesAllStrict = false;
            discrepancies.push({
              type: 'CROSS_BRANCH',
              label: `Branch: ${excelBranch} ⚠`,
              cooValue: cooBranch,
              prValue: excelBranch,
              severity: 'red',
            });
          }
        }

        // COVER MONTH
        const accountPeriod = String(
          candidate.Account_period || candidate.Cover_period || candidate.Period || ""
        );
        if (accountPeriod) {
          const matchesActivePeriod = parsePeriodMatchesExact(
            accountPeriod, activePeriodMonth, activePeriodYear
          );
          if (matchesActivePeriod) {
            fieldMatches.coverMonth = 'match';
            score += 1;
          } else {
            fieldMatches.coverMonth = 'mismatch';
            passesAllStrict = false;
            discrepancies.push({
              type: 'HISTORICAL_MONTH',
              label: `Cover: ${accountPeriod} ⚠`,
              cooValue: `${activePeriodMonth}/${activePeriodYear}`,
              prValue: accountPeriod,
              severity: 'red',
            });
          }
        }

        // PRODUCT
        const expectedCategory = PRODUCT_TO_PR_CATEGORY[opp.product] || 'Unknown';
        const prCategory = candidate._prCategory || 'Unknown';
        if (expectedCategory !== 'Unknown' && prCategory !== 'Unknown') {
          if (expectedCategory === prCategory) {
            fieldMatches.product = 'match';
            score += 1;
          } else {
            fieldMatches.product = 'mismatch';
            passesAllStrict = false;
            discrepancies.push({
              type: 'PRODUCT_MISMATCH',
              label: `Product: ${prCategory} ≠`,
              cooValue: expectedCategory,
              prValue: prCategory,
              severity: 'orange',
            });
          }
        }

        // NAME
        const nameHit = nameRes.find(r => r.item === candidate);
        const nameScore = nameHit?.score ?? 1;
        if (nameHit && nameScore <= NAME_MATCH_THRESHOLD) {
          fieldMatches.clientName = 'match';
          score += 2;
        } else if (nameHit) {
          fieldMatches.clientName = 'mismatch';
          passesAllStrict = false;
          const prName = candidate.Insured || candidate["Client Name"] || candidate.Client || "Unknown";
          discrepancies.push({
            type: 'NAME_FUZZY',
            label: `Name: ~${prName}`,
            cooValue: opp.client_name,
            prValue: String(prName),
            severity: 'yellow',
          });
        }

        // PREMIUM
        const excelPremium = Number(
          candidate.Gross_premium_kshs || candidate["Gross Premium"] ||
          candidate.Premium || candidate.Paid_amount_kshs ||
          candidate.Basic_premium_kshs || 0
        );
        if (excelPremium > 0) {
          const delta = Math.abs(excelPremium - opp.expected_premium);
          if (delta <= opp.expected_premium * PREMIUM_TOLERANCE_PERCENT) {
            fieldMatches.premium = 'match';
            score += 2;
          } else {
            fieldMatches.premium = 'mismatch';
            discrepancies.push({
              type: 'PREMIUM_DRIFT',
              label: `Premium: ±${Math.round(delta).toLocaleString()}`,
              cooValue: String(opp.expected_premium),
              prValue: String(excelPremium),
              severity: 'yellow',
            });
          }
        }

        // INTERMEDIARY
        const interHit = interRes.find(r => r.item === candidate);
        if (interHit) {
          fieldMatches.intermediary = 'match';
          score += 1;
        } else {
          fieldMatches.intermediary = opp.intermediary ? 'mismatch' : 'unavailable';
        }

        // DISQUALIFIER: Invoice already verified
        const invoiceNo = String(candidate.Invoice_number || candidate.Invoice || "");
        if (invoiceNo && verifiedInvoices.includes(invoiceNo)) {
          score = -Infinity;
        }

        return { candidate, score, passesAllStrict, discrepancies, fieldMatches };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const viableCandidates = scoredCandidates.filter(c => c.score > -Infinity);

      if (viableCandidates.length > 1) {
        const topScore = viableCandidates[0].score;
        const closeCompetitors = viableCandidates.filter(
          c => c.score >= topScore * 0.8
        );
        if (closeCompetitors.length > 1) {
          viableCandidates[0].discrepancies.push({
            type: 'MULTIPLE_CANDIDATES',
            label: `${closeCompetitors.length} Candidates`,
            cooValue: '',
            prValue: '',
            severity: 'blue',
          });
        }
      }

      const best = viableCandidates[0] || null;
      let bucket: MatchBucket;

      if (!best || best.score <= 0) {
        bucket = 'C';
      } else if (best.passesAllStrict && best.discrepancies.length === 0) {
        bucket = 'A';
      } else {
        bucket = 'B';
      }

      return {
        opportunity: opp,
        bucket,
        bestCandidate: best,
        allCandidates: viableCandidates,
        discrepancies: best?.discrepancies || [],
      };
    });
  }, [filteredOpportunities, masterExcelData, verifiedInvoices, activePeriodMonth, activePeriodYear]);

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
            <VerifiedCart items={verifiedItems} onUndoVerify={handleUndoVerify} />

            {selectedCooId ? (
              <ReconciliationTable 
                evaluatedOpportunities={evaluatedOpportunities} 
                onOpportunityRejected={handleOpportunityRejected} 
                onOpportunityVerified={handleOpportunityVerified} 
                rejectedItems={rejectedItems} 
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
