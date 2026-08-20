"use client";

import React, { useMemo, useState } from 'react';
import { useReconciliation } from '../reconciliation-context';
import { groupClaimsByCategory } from '../search-engine';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { OpportunityWithUser } from '../types';

export function MasterList() {
  const { state, dispatch } = useReconciliation();
  
  const grouped = useMemo(() => groupClaimsByCategory(state.activeClaims), [state.activeClaims]);
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedProducts, setCollapsedProducts] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleProduct = (prod: string) => {
    setCollapsedProducts(prev => {
      const next = new Set(prev);
      if (next.has(prod)) next.delete(prod);
      else next.add(prod);
      return next;
    });
  };

  const selectedCoo = state.allCoos.find(c => c.id === state.selectedCooId);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
        <h2 className="font-semibold text-foreground">COO: {selectedCoo?.name} — {selectedCoo?.branchName || 'Unknown'}</h2>
        <p className="text-sm text-muted-foreground">{state.activeClaims.length} pending claims</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {grouped.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No active claims found.</div>
        ) : (
          grouped.map(group => {
            const isCatCollapsed = collapsedCategories.has(group.category);
            const totalClaims = group.products.reduce((acc, p) => acc + p.claims.length, 0);

            return (
              <div key={group.category} className="space-y-1">
                <button 
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-sm font-semibold text-foreground"
                >
                  {isCatCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span>{group.category}</span>
                  <span className="text-xs text-muted-foreground font-normal">({totalClaims})</span>
                </button>
                
                {!isCatCollapsed && (
                  <div className="pl-4 space-y-2 mt-1">
                    {group.products.map(prodGroup => {
                      const isProdCollapsed = collapsedProducts.has(prodGroup.product);
                      
                      return (
                        <div key={prodGroup.product} className="space-y-1">
                          <button 
                            onClick={() => toggleProduct(prodGroup.product)}
                            className="w-full flex items-center gap-2 px-2 py-1 hover:bg-muted rounded text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {isProdCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            <span>{prodGroup.product.replace(/_/g, ' ')}</span>
                            <span className="font-normal">({prodGroup.claims.length})</span>
                          </button>
                          
                          {!isProdCollapsed && (
                            <div className="pl-2 space-y-1 mt-1">
                              {prodGroup.claims.map(claim => {
                                const isSelected = state.selectedClaimId === claim.id;
                                const actionState = state.claimActions.get(claim.id);
                                
                                return (
                                  <button
                                    key={claim.id}
                                    onClick={() => dispatch({ type: 'SELECT_CLAIM', payload: claim.id })}
                                    className={`w-full text-left p-2 rounded border text-sm transition-colors block ${
                                      isSelected 
                                        ? 'bg-primary/10 border-primary text-foreground font-medium' 
                                        : 'bg-background border-border hover:border-primary/50 text-foreground'
                                    } ${
                                      actionState === 'flagged' ? 'bg-amber-50/50 border-amber-200' : ''
                                    } ${
                                      actionState === 'rejected' ? 'opacity-50 line-through' : ''
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="truncate max-w-[180px] block">
                                        {claim.client_name}
                                      </span>
                                      {actionState === 'flagged' && <span title="Flagged">🟡</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                                      <span>Ksh {claim.expected_premium.toLocaleString()}</span>
                                      <span>·</span>
                                      <span className="truncate">{claim.intermediary || 'Direct'}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
