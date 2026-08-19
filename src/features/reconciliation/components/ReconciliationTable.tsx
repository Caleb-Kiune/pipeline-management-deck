"use client";

import React, { useState, useTransition } from "react";
import { updateReconciliationStatus } from "../actions/update-reconciliation-status";
import { ReconciliationStatus } from "@prisma/client";
import type { EvaluatedOpportunity } from "./ReconciliationWorkspace";

export interface ReconciliationTableProps {
  evaluatedOpportunities: EvaluatedOpportunity[];
  onOpportunityMapped: (opportunityId: string) => void;
}

export function ReconciliationTable({ evaluatedOpportunities, onOpportunityMapped }: ReconciliationTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [flagNotes, setFlagNotes] = useState("");

  if (evaluatedOpportunities.length === 0) {
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

  const handleAction = (opportunityId: string, status: ReconciliationStatus, payload?: any) => {
    startTransition(async () => {
      try {
        const sanitizedPayload = payload ? JSON.parse(JSON.stringify(payload)) : undefined;
        await updateReconciliationStatus(opportunityId, status, sanitizedPayload);
        onOpportunityMapped(opportunityId);
        setExpandedRow(null);
        setFlagNotes("");
      } catch (err) {
        console.error(err);
        alert("Failed to update status");
      }
    });
  };

  const getTrafficLightColor = (color: string) => {
    switch (color) {
      case 'GREEN': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'YELLOW': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'RED': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'GRAY': default: return 'bg-gray-300';
    }
  };

  return (
    <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted uppercase tracking-wider">
            <tr className="border-b border-border">
              <th className="px-6 py-4 w-12 text-center">Match</th>
              <th className="px-6 py-4 font-medium">Client Name</th>
              <th className="px-6 py-4 font-medium">Intermediary</th>
              <th className="px-6 py-4 font-medium">Expected Premium</th>
              <th className="px-6 py-4 font-medium w-[120px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {evaluatedOpportunities.map(({ opportunity, matchColor, bestMatch, matchReasons }) => (
              <React.Fragment key={opportunity.id}>
                <tr className={`border-b border-border transition-colors ${expandedRow === opportunity.id ? 'bg-muted/30' : 'hover:bg-muted/10'}`}>
                  <td className="px-6 py-4 text-center">
                    <div className={`mx-auto h-3 w-3 rounded-full ${getTrafficLightColor(matchColor)}`}></div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{opportunity.client_name}</td>
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
                {expandedRow === opportunity.id && (
                  <tr className="bg-muted/5 border-b border-border">
                    <td colSpan={5} className="p-0">
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* COO Claim */}
                          <div className="border rounded-lg p-5 bg-background shadow-sm">
                            <h4 className="font-semibold text-xs mb-4 uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              COO Claim
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between border-b pb-2"><span className="font-medium text-muted-foreground">Client Name:</span> <span className="text-foreground font-medium text-right">{opportunity.client_name}</span></div>
                              <div className="flex justify-between border-b pb-2"><span className="font-medium text-muted-foreground">Intermediary:</span> <span className="text-foreground text-right">{opportunity.intermediary || "Direct"}</span></div>
                              <div className="flex justify-between border-b pb-2"><span className="font-medium text-muted-foreground">COO Branch:</span> <span className="text-foreground text-right font-medium">{opportunity.user?.branch?.name || "UNKNOWN"}</span></div>
                              <div className="flex justify-between border-b pb-2"><span className="font-medium text-muted-foreground">Expected Premium:</span> <span className="text-foreground font-medium text-right">Ksh {opportunity.expected_premium.toLocaleString()}</span></div>
                              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Product:</span> <span className="text-foreground text-right">{opportunity.product.replace(/_/g, " ")}</span></div>
                            </div>
                          </div>

                          {/* Excel Match */}
                          <div className={`border rounded-lg p-5 bg-background shadow-sm ${matchColor === 'RED' ? 'border-red-500/50 bg-red-500/5' : matchColor === 'GREEN' ? 'border-green-500/50 bg-green-500/5' : matchColor === 'YELLOW' ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
                            <h4 className="font-semibold text-xs mb-4 uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Top Excel Match
                            </h4>
                            {bestMatch ? (
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2 border-border/50"><span className="font-medium text-muted-foreground">Insured:</span> <span className="text-foreground font-medium text-right">{bestMatch.Insured || bestMatch["Client Name"] || bestMatch.Client || "Unknown"}</span></div>
                                <div className="flex justify-between border-b pb-2 border-border/50"><span className="font-medium text-muted-foreground">Intermediary:</span> <span className="text-foreground text-right">{bestMatch.Intermediary_name || bestMatch.Intermediary || "N/A"}</span></div>
                                <div className="flex justify-between border-b pb-2 border-border/50"><span className="font-medium text-muted-foreground">PR Branch:</span> <span className={`text-right font-bold ${matchReasons.some(r => r.includes("Cross-Branch")) ? "text-red-500" : "text-foreground"}`}>{bestMatch.Branch_name || bestMatch.Branch || "N/A"}</span></div>
                                <div className="flex justify-between border-b pb-2 border-border/50"><span className="font-medium text-primary">Actual Premium:</span> <span className="text-primary font-bold text-right">Ksh {Number(bestMatch.Gross_premium_kshs || bestMatch["Gross Premium"] || bestMatch.Premium || bestMatch.Paid_amount_kshs || bestMatch.Basic_premium_kshs || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="font-medium text-muted-foreground">Invoice No:</span> <span className="text-foreground text-right">{bestMatch.Invoice_number || bestMatch.Invoice || "N/A"}</span></div>
                                
                                <div className="mt-4 pt-4 border-t border-border/50">
                                  <span className="font-semibold text-xs uppercase text-muted-foreground mb-2 block">Match Evaluation:</span>
                                  <ul className="space-y-1 mt-1 text-xs text-muted-foreground">
                                    {matchReasons.map((r, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <svg className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${r.includes("CONFLICT") || r.includes("mismatch") ? "text-red-500" : "text-green-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          {r.includes("CONFLICT") || r.includes("mismatch") 
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                                        </svg>
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                                <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm font-medium">No suitable match found</span>
                                <span className="text-xs opacity-70 mt-1">Try manually searching or flagging this record.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-5 bg-background border rounded-lg shadow-sm">
                          <div className="w-full sm:w-1/2">
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Flag Notes</label>
                            <input 
                              type="text" 
                              value={flagNotes}
                              onChange={(e) => setFlagNotes(e.target.value)}
                              placeholder="Required if flagging this record..."
                              className="w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-shadow"
                            />
                          </div>
                          
                          <div className="flex gap-3 shrink-0 mt-4 sm:mt-0">
                            <button
                              disabled={isPending}
                              onClick={() => handleAction(opportunity.id, ReconciliationStatus.REJECTED)}
                              className="px-4 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              disabled={isPending || !flagNotes.trim()}
                              onClick={() => handleAction(opportunity.id, ReconciliationStatus.FLAGGED, { notes: flagNotes })}
                              className="px-4 py-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                            >
                              Flag
                            </button>
                            {bestMatch && (
                              <button
                                disabled={isPending || matchColor === 'RED'}
                                onClick={() => handleAction(opportunity.id, ReconciliationStatus.VERIFIED, { 
                                  pr_invoice_number: String(bestMatch.Invoice_number || bestMatch.Invoice || ""),
                                  pr_verified_data: bestMatch 
                                })}
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
                                Verify & Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
