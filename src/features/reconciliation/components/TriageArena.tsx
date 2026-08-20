"use client";

import React, { useMemo } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { CandidateCard } from './CandidateCard';
import { findCandidates } from '../search-engine';
import { updateReconciliationStatus } from '../actions/update-reconciliation-status';
import { PRODUCT_TO_PR_CATEGORY } from '../constants';
import type { PrCategory } from '../types';

export function TriageArena() {
  const { state, dispatch } = useReconciliation();
  
  const claim = state.allOpportunities.find(c => c.id === state.selectedClaimId);
  
  const evaluatedCandidates = useMemo(() => {
    if (!claim || state.dataLake.length === 0) return [];
    return findCandidates(claim, state.dataLake, {
      activePeriodMonth: state.activePeriodMonth,
      activePeriodYear: state.activePeriodYear,
      verifiedInvoices: state.verifiedInvoices,
    });
  }, [claim, state.dataLake, state.activePeriodMonth, state.activePeriodYear, state.verifiedInvoices]);

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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-card border rounded-xl p-5 shadow-sm relative">
        <div className="absolute top-5 right-5">
          <button 
            onClick={handleReject}
            className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
          >
            ❌ Reject Claim
          </button>
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-1 pr-32">{claim.client_name}</h3>
        <div className="text-sm text-muted-foreground mb-3 font-medium">
          {claim.product.replace(/_/g, ' ')} · {state.uploads[PRODUCT_TO_PR_CATEGORY[claim.product] as PrCategory]?.category || 'Category'} · Ksh {claim.expected_premium.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          Branch: {claim.user?.branch?.name || 'Unknown'} · Intermediary: {claim.intermediary || 'Direct'}
        </div>
        {state.claimActions.get(claim.id) === 'flagged' && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-md text-sm border border-amber-200">
            <strong>Flag Note:</strong> {state.flagNotes.get(claim.id)?.note}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          — {evaluatedCandidates.length} Candidates Found —
        </h4>
        
        {evaluatedCandidates.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-background text-muted-foreground text-sm italic">
            No matching records found in the PR Data Lake.
          </div>
        ) : (
          <div className="space-y-4">
            {evaluatedCandidates.map((cand, idx) => (
              <CandidateCard 
                key={idx} 
                candidate={cand} 
                claim={claim} 
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
