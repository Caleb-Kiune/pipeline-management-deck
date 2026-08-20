"use client";

import React, { useMemo } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { PRODUCT_TO_PR_CATEGORY } from '../constants';

export function MasterList() {
  const { state, dispatch } = useReconciliation();
  
  const filteredClaims = useMemo(() => 
    state.activeClaims.filter(
      c => (PRODUCT_TO_PR_CATEGORY[c.product] || 'Unknown') === state.activeTab
    ),
    [state.activeClaims, state.activeTab]
  );
  
  const selectedCoo = state.allCoos.find(c => c.id === state.selectedCooId);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
        <h2 className="font-semibold text-foreground">
          COO: {selectedCoo?.name} — {selectedCoo?.branchName || 'Unknown'}
        </h2>
        <p className="text-sm text-muted-foreground">{filteredClaims.length} {state.activeTab} claims</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredClaims.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No active claims found.</div>
        ) : (
          filteredClaims.map(claim => {
            const isSelected = state.selectedClaimId === claim.id;
            const actionState = state.claimActions.get(claim.id);
            
            return (
              <button
                key={claim.id}
                onClick={() => dispatch({ type: 'SELECT_CLAIM', payload: claim.id })}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors block border-l-2 ${
                  isSelected 
                    ? 'bg-primary/10 border-primary text-foreground font-medium' 
                    : 'bg-background border-transparent hover:bg-muted/50 text-foreground'
                } ${
                  actionState === 'flagged' ? 'bg-amber-50/50 border-amber-400' : ''
                } ${
                  actionState === 'rejected' ? 'opacity-40 line-through border-destructive' : ''
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate max-w-[200px] block">
                    {claim.client_name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Ksh {claim.expected_premium.toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
