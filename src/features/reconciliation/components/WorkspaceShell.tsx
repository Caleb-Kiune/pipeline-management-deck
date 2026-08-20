"use client";

import React from 'react';
import { TopBar } from './TopBar';
import { CategoryTabs } from './CategoryTabs';
import { MasterList } from './MasterList';
import { TriageArena } from './TriageArena';
import { PayrollCart } from './PayrollCart';
import { useReconciliation } from '../reconciliation-context';
import { ArrowUp } from 'lucide-react';

export function WorkspaceShell() {
  const { state } = useReconciliation();

  const hasSelectedCoo = Boolean(state.selectedCooId);
  const hasUploads = state.dataLake.length > 0;

  return (
    <div className="grid grid-rows-[auto_auto_1fr_auto] h-[calc(100vh-theme(spacing.16))] w-full bg-background border-x border-border">
      <TopBar />
      {hasSelectedCoo && <CategoryTabs />}
      
      <div className="grid grid-cols-[320px_1fr] min-h-0">
        <aside className="overflow-y-auto border-r border-border bg-muted/30">
          {hasSelectedCoo && <MasterList />}
        </aside>
        
        <main className="overflow-y-auto p-6 bg-canvas">
          {!hasSelectedCoo ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ArrowUp className="mb-4 animate-bounce" size={32} />
              <p className="text-lg font-medium text-foreground">Select a COO to begin</p>
              <p className="mt-1 text-sm">Choose a COO from the top bar to view their pending opportunities.</p>
            </div>
          ) : !hasUploads ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ArrowUp className="mb-4 animate-bounce" size={32} />
              <p className="text-lg font-medium text-foreground">Upload PR data to begin matching</p>
              <p className="mt-1 text-sm">Load at least one category to triage claims.</p>
            </div>
          ) : (
            <TriageArena />
          )}
        </main>
      </div>
      
      <footer className="border-t-2 border-border bg-card h-auto max-h-[50vh] flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 relative">
        <PayrollCart />
      </footer>
    </div>
  );
}
