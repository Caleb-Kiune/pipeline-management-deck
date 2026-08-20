"use client";

import React, { useMemo } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { CandidateCard } from './CandidateCard';
import { findCandidates } from '../search-engine';
import { updateReconciliationStatus } from '../actions/update-reconciliation-status';
import type { PrCategory } from '../types';

const TRIAGE_GRID_CLASSES = "grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-x-3 items-center px-4 text-sm";

export function TriageArena() {
  const { state, dispatch } = useReconciliation();
  
  const claim = state.allOpportunities.find(c => c.id === state.selectedClaimId);
  
  const evaluatedCandidates = useMemo(() => {
    if (!claim || state.dataLake.length === 0) return [];
    return findCandidates(claim, state.dataLake, {
      activePeriodMonth: state.activePeriodMonth,
      activePeriodYear: state.activePeriodYear,
      verifiedInvoices: state.verifiedInvoices,
      activeTab: state.activeTab,
    });
  }, [claim, state.dataLake, state.activePeriodMonth, state.activePeriodYear, state.verifiedInvoices, state.activeTab]);

  const handleApprove = async (candidate: any) => {
    if (!claim) return;
    dispatch({ type: 'APPROVE_CANDIDATE', payload: { opportunityId: claim.id, candidate } });
    
    const row = candidate.candidate;
    const invoiceNo = String(row.Invoice_number || row.Invoice || "");
    await updateReconciliationStatus(claim.id, 'VERIFIED', {
      pr_invoice_number: invoiceNo || undefined,
      pr_verified_data: [row]
    });
  };

  const handleFlag = async (candidate: any, note: string) => {
    if (!claim) return;
    dispatch({ type: 'FLAG_CLAIM', payload: { opportunityId: claim.id, note } });
    await updateReconciliationStatus(claim.id, 'FLAGGED', { notes: note });
  };

  const handleReject = async () => {
    if (!claim) return;
    dispatch({ type: 'REJECT_CLAIM', payload: { opportunityId: claim.id } });
    await updateReconciliationStatus(claim.id, 'REJECTED');
  };

  if (!claim) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">No claim selected</p>
        <p className="mt-1 text-sm">Select a claim from the left pane to begin triage.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur shadow-sm border-b">
        <div className={`${TRIAGE_GRID_CLASSES} py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50`}>
          <span>Client Name</span>
          <span>Branch</span>
          <span>Product</span>
          <span>Expected Premium</span>
          <span>Actions</span>
        </div>

        <div className={`${TRIAGE_GRID_CLASSES} py-2.5 font-medium text-foreground bg-card/80`}>
          <span className="truncate font-semibold">{claim.client_name}</span>
          <span>{claim.user?.branch?.name || 'Unknown'}</span>
          <span>{claim.product.replace(/_/g, ' ')}</span>
          <span className="font-mono">Ksh {claim.expected_premium.toLocaleString()}</span>
          <div className="flex justify-end">
            <button 
              onClick={handleReject}
              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {state.claimActions.get(claim.id) === 'flagged' && (
        <div className="m-4 p-3 bg-amber-50 text-amber-800 rounded-md text-sm border border-amber-200">
          <strong>Flag Note:</strong> {state.flagNotes.get(claim.id)?.note}
        </div>
      )}

      <div className="mt-4">
        {evaluatedCandidates.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-background text-muted-foreground text-sm italic mx-4">
            No matching records found in the PR Data Lake.
          </div>
        ) : (
          <div className="divide-y divide-border border-b border-border">
            {evaluatedCandidates.map((cand, idx) => (
              <CandidateCard 
                key={idx} 
                candidate={cand} 
                claim={claim} 
                activeTab={state.activeTab}
                onApprove={handleApprove}
                onFlag={handleFlag}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
