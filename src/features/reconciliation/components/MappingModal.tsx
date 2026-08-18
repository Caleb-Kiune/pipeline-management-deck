"use client";

import { useState, useMemo, useTransition } from "react";
import Fuse from "fuse.js";
import { updateReconciliationStatus } from "../actions/update-reconciliation-status";
import { ReconciliationStatus } from "@prisma/client";
import type { ExcelRowData } from "./ExcelUploader";

export interface MappingModalProps {
  opportunity: any;
  excelData: ExcelRowData[];
  onClose: () => void;
  onActionComplete: () => void;
}

export function MappingModal({ opportunity, excelData, onClose, onActionComplete }: MappingModalProps) {
  const [searchQuery, setSearchQuery] = useState(opportunity.client_name);
  const [isPending, startTransition] = useTransition();
  const [flagNotes, setFlagNotes] = useState("");
  const [activeAction, setActiveAction] = useState<{ type: 'FLAG' | 'VERIFY', row: ExcelRowData } | null>(null);

  // Initialize fuse on mount
  const fuse = useMemo(() => new Fuse(excelData, {
    keys: ["Insured", "Policy_number", "Client Name", "Client"],
    threshold: 0.4,
    includeScore: true,
  }), [excelData]);

  // Derive matches based on searchQuery
  const matches = useMemo(() => {
    if (!searchQuery.trim()) {
      return excelData.slice(0, 5);
    }
    return fuse.search(searchQuery).slice(0, 5).map(res => ({
      item: res.item,
      confidence: res.score !== undefined ? Math.round((1 - res.score) * 100) : 0
    }));
  }, [searchQuery, fuse, excelData]);

  const handleVerify = (row: ExcelRowData) => {
    setActiveAction({ type: 'VERIFY', row });
  };

  const handleFlag = (row: ExcelRowData) => {
    setActiveAction({ type: 'FLAG', row });
    setFlagNotes("");
  };

  const executeAction = (status: ReconciliationStatus, payload?: { premium?: number, notes?: string }) => {
    startTransition(async () => {
      try {
        await updateReconciliationStatus(opportunity.id, status, payload?.premium, payload?.notes);
        onActionComplete();
      } catch (err) {
        console.error(err);
        alert("Failed to update status");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="bg-card border shadow-xl rounded-xl w-full max-w-4xl mx-4 my-auto flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-semibold">Map Opportunity</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Matching <span className="font-medium text-foreground">{opportunity.client_name}</span> (Ksh {opportunity.expected_premium.toLocaleString()})
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded-full p-1 hover:bg-muted transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 shrink-0 bg-muted/30 border-b">
          <label className="block text-sm font-medium mb-2 text-foreground">Search Excel Data</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-md pl-10 pr-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="Type to search exact names, invoices, etc..."
            />
          </div>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <h4 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Top Matches</h4>
          
          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">No matches found in the loaded sheet.</p>
            ) : (
              matches.map((match, idx) => {
                const row = 'item' in match ? match.item : match;
                const confidence = 'confidence' in match ? match.confidence : null;
                const premium = Number(row.Gross_premium_kshs || row["Gross Premium"] || row.Premium || 0);
                
                return (
                  <div key={idx} className="border rounded-lg p-4 bg-background shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-base text-foreground">{row.Insured || row["Client Name"] || row.Client || "Unknown"}</span>
                        {confidence !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${confidence >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : confidence >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {confidence}% Match
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><span className="font-medium">Premium:</span> <span className="text-foreground">Ksh {premium.toLocaleString()}</span></div>
                        {(row.Branch_name || row.Branch) && <div className="flex items-center gap-1"><span className="font-medium">Branch:</span> <span className="text-foreground">{row.Branch_name || row.Branch}</span></div>}
                        {row.Policy_number && <div className="flex items-center gap-1"><span className="font-medium">Policy:</span> <span className="text-foreground">{row.Policy_number}</span></div>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                      <button 
                        disabled={isPending}
                        onClick={() => handleVerify(row)}
                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium rounded-md disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button 
                        disabled={isPending}
                        onClick={() => executeAction(ReconciliationStatus.REJECTED)}
                        className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm font-medium rounded-md disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        disabled={isPending}
                        onClick={() => handleFlag(row)}
                        className="px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-colors text-sm font-medium rounded-md disabled:opacity-50"
                      >
                        Flag
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Inline Modals for Verification/Flagging */}
        {activeAction && activeAction.type === 'VERIFY' && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-card border rounded-xl shadow-2xl p-6 transform transition-all">
              <h3 className="text-xl font-semibold mb-2 text-foreground">Confirm Verification</h3>
              <p className="text-sm text-muted-foreground mb-6">
                You are matching <strong>{opportunity.client_name}</strong> to <strong>{activeAction.row.Insured || activeAction.row["Client Name"] || activeAction.row.Client}</strong>.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium text-muted-foreground">Expected Premium (COO)</span>
                  <span className="text-sm font-semibold text-foreground">Ksh {opportunity.expected_premium.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">Actual Premium (Excel)</span>
                  <span className="text-sm font-bold text-primary">Ksh {Number(activeAction.row.Gross_premium_kshs || activeAction.row["Gross Premium"] || activeAction.row.Premium || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeAction(ReconciliationStatus.VERIFIED, { premium: Number(activeAction.row.Gross_premium_kshs || activeAction.row["Gross Premium"] || activeAction.row.Premium || 0) })}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  disabled={isPending}
                >
                  {isPending ? "Verifying..." : "Confirm & Verify"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeAction && activeAction.type === 'FLAG' && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-card border rounded-xl shadow-2xl p-6 transform transition-all">
              <h3 className="text-xl font-semibold mb-2 text-orange-500">Flag Discrepancy</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Provide mandatory notes explaining why <strong>{opportunity.client_name}</strong> is flagged against <strong>{activeAction.row.Insured || activeAction.row["Client Name"] || activeAction.row.Client}</strong>.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-foreground">Reconciliation Notes</label>
                <textarea 
                  value={flagNotes} 
                  onChange={(e) => setFlagNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-3 text-sm bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow"
                  placeholder="E.g. Premium mismatch, wrong COO..."
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeAction(ReconciliationStatus.FLAGGED, { notes: flagNotes })}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                  disabled={isPending || !flagNotes.trim()}
                >
                  {isPending ? "Saving..." : "Flag Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
