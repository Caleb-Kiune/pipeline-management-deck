"use client";

import React, { useState, useTransition } from "react";
import { updateReconciliationStatus } from "../actions/update-reconciliation-status";
import { bulkUpdateReconciliationStatus } from "../actions/bulk-update-reconciliation-status";
import { ReconciliationStatus } from "@prisma/client";
import type { EvaluatedOpportunity, MatchBucket, ScoredCandidate } from "../types";
import { ExcelRowData } from "./ExcelUploader";
import { DiscrepancyBadges } from "./DiscrepancyBadges";
import { DiffView } from "./DiffView";

export interface ReconciliationTableProps {
  evaluatedOpportunities: EvaluatedOpportunity[];
  onOpportunityVerified: (item: EvaluatedOpportunity) => void;
  onOpportunityRejected: (item: EvaluatedOpportunity) => void;
  rejectedItems: EvaluatedOpportunity[];
}

export function ReconciliationTable({
  evaluatedOpportunities,
  onOpportunityVerified,
  onOpportunityRejected,
  rejectedItems,
}: ReconciliationTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Map<string, Set<number>>>(new Map());
  const [isPending, startTransition] = useTransition();
  const [flagNotes, setFlagNotes] = useState("");

  const getBucketBorderClass = (bucket: MatchBucket): string => {
    switch (bucket) {
      case 'A': return 'border-l-4 border-l-emerald-500';
      case 'B': return 'border-l-4 border-l-amber-400';
      case 'C': return 'border-l-4 border-l-gray-300 border-dashed';
    }
  };

  const bucketAItems = evaluatedOpportunities.filter(e => e.bucket === 'A');

  const handleBulkVerifyA = () => {
    startTransition(async () => {
      try {
        const bulkItems = bucketAItems.map(item => {
          const best = item.bestCandidate;
          const invoiceNo = best
            ? String(best.candidate.Invoice_number || best.candidate.Invoice || "")
            : "";
          return {
            opportunityId: item.opportunity.id,
            status: ReconciliationStatus.VERIFIED,
            payload: {
              pr_invoice_number: invoiceNo || undefined,
              pr_verified_data: best ? [best.candidate] : undefined,
            },
          };
        });
        await bulkUpdateReconciliationStatus(bulkItems);
        bucketAItems.forEach(item => onOpportunityVerified(item));
        setExpandedRow(null);
      } catch (err) {
        console.error(err);
        alert("Bulk verify failed");
      }
    });
  };

  const toggleCandidate = (oppId: string, idx: number) => {
    setSelectedCandidates(prev => {
      const nextMap = new Map(prev);
      const currentSet = nextMap.get(oppId) ? new Set(nextMap.get(oppId)) : new Set<number>();
      if (currentSet.has(idx)) {
        currentSet.delete(idx);
      } else {
        currentSet.add(idx);
      }
      nextMap.set(oppId, currentSet);
      return nextMap;
    });
  };

  const getSelectedTotal = (oppId: string, allCandidates: ScoredCandidate[]) => {
    const set = selectedCandidates.get(oppId);
    if (!set || set.size === 0) return 0;
    let total = 0;
    set.forEach(idx => {
      const candidate = allCandidates[idx]?.candidate;
      if (candidate) {
        total += Number(candidate.Gross_premium_kshs || candidate["Gross Premium"] || candidate.Premium || candidate.Paid_amount_kshs || candidate.Basic_premium_kshs || 0);
      }
    });
    return total;
  };

  const handleAction = (opportunityId: string, status: ReconciliationStatus) => {
    const item = evaluatedOpportunities.find(e => e.opportunity.id === opportunityId);
    if (!item) return;

    let combinedInvoices: string | undefined = undefined;
    let sanitizedData: any | undefined = undefined;

    if (status === ReconciliationStatus.VERIFIED) {
      const set = selectedCandidates.get(opportunityId);
      if (!set || set.size === 0) return;
      
      const selectedRows = Array.from(set).map(idx => item.allCandidates[idx]?.candidate).filter(Boolean);
      const invoices = selectedRows.map(r => String(r.Invoice_number || r.Invoice || "")).filter(Boolean);
      
      combinedInvoices = invoices.join(',');
      sanitizedData = selectedRows.length > 0 ? JSON.parse(JSON.stringify(selectedRows)) : undefined;
    }

    startTransition(async () => {
      try {
        await updateReconciliationStatus(opportunityId, status, {
          pr_invoice_number: combinedInvoices || undefined,
          pr_verified_data: sanitizedData || undefined,
          notes: flagNotes || undefined,
        });

        if (status === ReconciliationStatus.VERIFIED) {
          onOpportunityVerified(item);
        } else if (status === ReconciliationStatus.REJECTED || status === ReconciliationStatus.FLAGGED) {
          // If flagged it shouldn't go to rejectedItems technically, but in this implementation they are grouped or we only remove from UI.
          // Based on blueprint: Reject button calls onOpportunityRejected
          onOpportunityRejected(item);
        }

        setExpandedRow(null);
        setFlagNotes("");
        
        setSelectedCandidates(prev => {
          const next = new Map(prev);
          next.delete(opportunityId);
          return next;
        });
      } catch (err) {
        console.error(err);
        alert("Failed to update status");
      }
    });
  };

  if (evaluatedOpportunities.length === 0 && rejectedItems.length === 0) {
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
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {bucketAItems.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
              {bucketAItems.length}
            </span>
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              High-confidence matches ready for verification
            </span>
          </div>
          <button
            onClick={handleBulkVerifyA}
            disabled={isPending}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Verifying..." : "Verify All ✓"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="text-xs text-muted-foreground bg-muted uppercase tracking-wider">
            <tr className="border-b border-border">
              <th className="px-6 py-4 font-medium">Client Name</th>
              <th className="px-6 py-4 font-medium">Exceptions</th>
              <th className="px-6 py-4 font-medium">Intermediary</th>
              <th className="px-6 py-4 font-medium">Expected Premium</th>
              <th className="px-6 py-4 font-medium w-[120px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {evaluatedOpportunities.map(({ opportunity, bucket, bestCandidate, allCandidates, discrepancies }) => {
              const selectedTotal = getSelectedTotal(opportunity.id, allCandidates);
              const hasSelection = (selectedCandidates.get(opportunity.id)?.size || 0) > 0;

              return (
                <React.Fragment key={opportunity.id}>
                  {/* ─── Collapsed Row ─── */}
                  <tr className={`border-b border-border transition-colors hover:bg-muted/5 ${getBucketBorderClass(bucket)}`}>
                    <td className="px-6 py-4 font-medium text-foreground">{opportunity.client_name}</td>
                    <td className="px-6 py-4">
                      {bucket === 'A' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </span>
                      )}
                      {bucket === 'B' && (
                        <DiscrepancyBadges candidateCount={allCandidates.length > 1 ? allCandidates.length : undefined} discrepancies={discrepancies} />
                      )}
                      {bucket === 'C' && (
                        <span className="text-xs text-gray-400 italic">No match</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{opportunity.intermediary || "Direct"}</td>
                    <td className="px-6 py-4 text-muted-foreground">Ksh {opportunity.expected_premium.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setExpandedRow(expandedRow === opportunity.id ? null : opportunity.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md shadow-sm hover:bg-secondary/80 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        {expandedRow === opportunity.id ? "Close" : "Review"}
                      </button>
                    </td>
                  </tr>

                  {/* ─── Expanded Row ─── */}
                  {expandedRow === opportunity.id && (
                    <tr className="border-b border-border bg-muted/5">
                      <td colSpan={5} className="p-0">
                        <div className="p-6">
                          {bestCandidate && (
                            <div className="mb-6">
                              <DiffView bestCandidate={bestCandidate} opportunity={opportunity} />
                            </div>
                          )}

                          <div className="mb-6">
                            <h4 className="font-semibold text-xs mb-3 uppercase text-muted-foreground tracking-wider">
                              Top Candidates ({allCandidates.length})
                            </h4>
                            {allCandidates.length > 0 ? (
                              <div className="border rounded-lg overflow-hidden bg-background">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                      <th className="px-4 py-2 w-10"></th>
                                      <th className="px-4 py-2 font-medium">Insured</th>
                                      <th className="px-4 py-2 font-medium">Intermediary</th>
                                      <th className="px-4 py-2 font-medium">Branch</th>
                                      <th className="px-4 py-2 font-medium">Invoice No</th>
                                      <th className="px-4 py-2 font-medium text-right">Premium (Ksh)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allCandidates.map((c, idx) => {
                                      const candidate = c.candidate;
                                      const isSelected = selectedCandidates.get(opportunity.id)?.has(idx) || false;
                                      const premium = Number(candidate.Gross_premium_kshs || candidate["Gross Premium"] || candidate.Premium || candidate.Paid_amount_kshs || candidate.Basic_premium_kshs || 0);
                                      return (
                                        <tr 
                                          key={idx} 
                                          className={`border-t border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                          onClick={() => toggleCandidate(opportunity.id, idx)}
                                        >
                                          <td className="px-4 py-3">
                                            <input 
                                              type="checkbox" 
                                              checked={isSelected}
                                              onChange={() => {}} 
                                              className="rounded border-input text-primary focus:ring-primary h-4 w-4" 
                                              onClick={(e) => e.stopPropagation()} 
                                              onInput={() => toggleCandidate(opportunity.id, idx)}
                                            />
                                          </td>
                                          <td className="px-4 py-3 font-medium text-foreground">{candidate.Insured || candidate["Client Name"] || candidate.Client || "Unknown"}</td>
                                          <td className="px-4 py-3 text-muted-foreground">{candidate.Intermediary_name || candidate.Intermediary || "N/A"}</td>
                                          <td className="px-4 py-3 text-muted-foreground">{candidate.Branch_name || candidate.Branch || "N/A"}</td>
                                          <td className="px-4 py-3 text-muted-foreground">{candidate.Invoice_number || candidate.Invoice || "N/A"}</td>
                                          <td className="px-4 py-3 text-right font-medium text-primary">{premium.toLocaleString()}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic border rounded-lg p-4 bg-background">No candidates found in the Data Lake.</div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-5 bg-background border rounded-lg shadow-sm">
                            <div className="w-full sm:w-1/2 flex items-center gap-4">
                              <div className="w-full">
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Flag Notes</label>
                                <input 
                                  type="text" 
                                  value={flagNotes}
                                  onChange={(e) => setFlagNotes(e.target.value)}
                                  placeholder="Required if flagging this record..."
                                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-shadow"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Selected Total</div>
                                <div className={`font-bold text-lg ${Math.abs(selectedTotal - opportunity.expected_premium) <= opportunity.expected_premium * 0.05 ? 'text-green-600' : 'text-primary'}`}>
                                  Ksh {selectedTotal.toLocaleString()}
                                </div>
                              </div>

                              <button
                                disabled={isPending}
                                onClick={() => handleAction(opportunity.id, ReconciliationStatus.REJECTED)}
                                className="px-4 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                              <button
                                disabled={isPending || !flagNotes.trim()}
                                onClick={() => handleAction(opportunity.id, ReconciliationStatus.FLAGGED)}
                                className="px-4 py-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                              >
                                Flag
                              </button>
                              
                              <button
                                disabled={isPending || !hasSelection || bucket === 'C'}
                                onClick={() => handleAction(opportunity.id, ReconciliationStatus.VERIFIED)}
                                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-sm flex items-center gap-2"
                              >
                                {isPending ? (
                                  <svg className="animate-spin h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                )}
                                Merge & Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* ─── Rejected Items ─── */}
            {rejectedItems.map(({ opportunity }) => (
              <tr
                key={`rejected-${opportunity.id}`}
                className="border-b border-border opacity-40 pointer-events-none border-l-4 border-l-gray-200"
              >
                <td className="px-6 py-3 font-medium text-foreground line-through">{opportunity.client_name}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                    Rejected
                  </span>
                </td>
                <td className="px-6 py-3 text-muted-foreground">{opportunity.intermediary || "Direct"}</td>
                <td className="px-6 py-3 text-muted-foreground">Ksh {opportunity.expected_premium.toLocaleString()}</td>
                <td className="px-6 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
