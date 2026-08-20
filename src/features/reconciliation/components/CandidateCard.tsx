"use client";

import React, { useState } from 'react';
import type { OpportunityWithUser, ScoredCandidate, PrCategory } from '../types';
import { HighlightedText } from './HighlightedText';
import { PRODUCT_TO_PR_CATEGORY } from '../constants';

const TRIAGE_GRID_CLASSES = "grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-x-3 items-center px-4 text-sm";

export interface CandidateCardProps {
  candidate: ScoredCandidate;
  claim: OpportunityWithUser;
  activeTab: PrCategory;
  onApprove: (candidate: ScoredCandidate) => void;
  onFlag: (candidate: ScoredCandidate, note: string) => void;
}

export function CandidateCard({ candidate, claim, activeTab, onApprove, onFlag }: CandidateCardProps) {
  const [flagNote, setFlagNote] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);
  
  const matches = candidate.fieldMatches;
  const row = candidate.candidate;
  
  const premium = Number(row.Gross_premium_kshs || row["Gross Premium"] || row.Premium || row.Paid_amount_kshs || row.Basic_premium_kshs || 0);

  return (
    <div className={`hover:bg-muted/30 transition-colors ${isFlagging ? 'bg-amber-50/30' : ''}`}>
      <div className={`${TRIAGE_GRID_CLASSES} py-2`}>
        {/* Col 1: Client Name — partial highlight */}
        <div className="truncate">
          <HighlightedText
            candidateText={String(row.Insured || row["Client Name"] || row.Client || "Unknown")}
            referenceText={claim.client_name}
            mode="partial"
          />
        </div>

        {/* Col 2: Branch — exact highlight */}
        <div className="truncate">
          <HighlightedText
            candidateText={String(row.Branch_name || row.Branch || "Unknown")}
            referenceText={claim.user?.branch?.name || ""}
            mode="exact"
          />
        </div>

        {/* Col 3: Product — exact highlight only for Non-Medical, plain otherwise */}
        <div className="truncate">
          {activeTab === 'Non-Medical' ? (
            <HighlightedText
              candidateText={String(row._prCategory || "Unknown")}
              referenceText={PRODUCT_TO_PR_CATEGORY[claim.product] || ""}
              mode="exact"
            />
          ) : (
            <span className="text-foreground">{String(row._prCategory || "Unknown")}</span>
          )}
        </div>

        {/* Col 4: Premium — color by match status */}
        <div className={`font-mono ${
          matches.premium === 'match' ? 'text-emerald-600 font-bold' :
          matches.premium === 'mismatch' ? 'text-red-500' : 'text-foreground'
        }`}>
          Ksh {premium.toLocaleString()}
        </div>

        {/* Col 5: Actions — horizontal */}
        <div className="flex items-center gap-1.5 justify-end">
          <button 
            onClick={() => onApprove(candidate)}
            className="bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs px-2 py-1 rounded transition-colors border border-emerald-200 hover:border-emerald-600"
          >
            Approve
          </button>
          
          <button 
            onClick={() => setIsFlagging(!isFlagging)}
            className={`text-xs px-2 py-1 rounded transition-colors border ${
              isFlagging 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-600'
            }`}
          >
            Flag
          </button>
        </div>
      </div>

      {isFlagging && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 max-w-lg bg-amber-50 p-2 rounded-md border border-amber-200 ml-auto">
            <input 
              type="text" 
              value={flagNote}
              onChange={e => setFlagNote(e.target.value)}
              placeholder="Reason for flagging..."
              className="text-xs px-2 py-1.5 border rounded flex-1 focus:outline-none focus:border-amber-400 bg-background"
              autoFocus
            />
            <button 
              onClick={() => {
                if (flagNote.trim()) {
                  onFlag(candidate, flagNote);
                  setIsFlagging(false);
                  setFlagNote('');
                }
              }}
              disabled={!flagNote.trim()}
              className="bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
            >
              Submit
            </button>
            <button 
              onClick={() => setIsFlagging(false)}
              className="text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
