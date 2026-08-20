"use client";

import React from 'react';
import { useReconciliation } from '../reconciliation-context';
import { PR_CATEGORIES, PRODUCT_TO_PR_CATEGORY } from '../constants';
import type { PrCategory } from '../constants';

export function CategoryTabs() {
  const { state, dispatch } = useReconciliation();

  return (
    <div className="flex items-center border-b border-border bg-card/95 px-6 gap-6">
      {PR_CATEGORIES.map(cat => {
        const count = state.activeClaims.filter(
          c => (PRODUCT_TO_PR_CATEGORY[c.product] || 'Unknown') === cat
        ).length;

        const isActive = state.activeTab === cat;

        return (
          <button
            key={cat}
            onClick={() => dispatch({ type: 'SET_TAB', payload: cat })}
            className={`py-3 text-sm flex items-center gap-2 transition-colors border-b-2 ${
              isActive 
                ? 'border-primary text-primary font-semibold' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{cat}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
