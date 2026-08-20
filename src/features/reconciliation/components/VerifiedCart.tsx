"use client";

import { useState } from "react";
import type { EvaluatedOpportunity } from "../types";

export interface VerifiedCartProps {
  items: EvaluatedOpportunity[];
  onUndoVerify?: (opportunityId: string) => void;
}

export function VerifiedCart({ items, onUndoVerify }: VerifiedCartProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) return null;

  const displayItems = isCollapsed ? [] : items.slice(0, 3);
  const hiddenCount = items.length - displayItems.length;

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
            ✓
          </span>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Verified Cart ({items.length})
          </h3>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {isCollapsed ? 'Expand ▸' : 'Collapse ▾'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {displayItems.map((item) => (
            <div key={item.opportunity.id} className="flex items-center justify-between py-2 border-b border-emerald-200/50 dark:border-emerald-800/50 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-foreground">{item.opportunity.client_name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{item.opportunity.product.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Ksh {item.opportunity.expected_premium.toLocaleString()}</span>
              </div>
              {onUndoVerify && (
                <button
                  onClick={() => onUndoVerify(item.opportunity.id)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-red-500 transition-colors"
                >
                  Undo ↺
                </button>
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="text-xs text-muted-foreground italic pt-2">
              + {hiddenCount} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
