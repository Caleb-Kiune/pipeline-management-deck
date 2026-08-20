"use client";

import React, { useState } from 'react';
import type { OpportunityWithUser, ScoredCandidate } from '../types';

export interface CandidateCardProps {
  candidate: ScoredCandidate;
  claim: OpportunityWithUser;
  onApprove: (candidate: ScoredCandidate) => void;
  onFlag: (candidate: ScoredCandidate, note: string) => void;
}

export function CandidateCard({ candidate, claim, onApprove, onFlag }: CandidateCardProps) {
  const [flagNote, setFlagNote] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);
  
  const matches = candidate.fieldMatches;
  const row = candidate.candidate;
  
  const getDot = (status: 'match' | 'mismatch' | 'unavailable') => {
    if (status === 'match') return <span className="text-emerald-500 mr-1">●</span>;
    if (status === 'mismatch') return <span className="text-red-500 mr-1">●</span>;
    return <span className="text-gray-400 mr-1">○</span>;
  };
  
  const premium = Number(row.Gross_premium_kshs || row["Gross Premium"] || row.Premium || row.Paid_amount_kshs || row.Basic_premium_kshs || 0);

  return (
    <div className={`bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${isFlagging ? 'bg-amber-50/50 border-amber-300' : ''}`}>
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>{getDot(matches.clientName)} <span className="font-medium text-foreground">{String(row.Insured || row["Client Name"] || row.Client || "Unknown")}</span></div>
        <div>{getDot(matches.product)} <span className="text-foreground">{String(row._prCategory || "Unknown")}</span></div>
        <div>{getDot(matches.branch)} <span className="text-foreground">Branch: {String(row.Branch_name || row.Branch || "Unknown")}</span></div>
        <div>{getDot(matches.coverMonth)} <span className="text-foreground">Period: {String(row.Account_period || row.Cover_period || row.Period || "Unknown")}</span></div>
        <div>{getDot(matches.premium)} <span className="text-foreground">Premium: Ksh {premium.toLocaleString()}</span></div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-4">
        Invoice: {String(row.Invoice_number || row.Invoice || "Unknown")} · Intermediary: {String(row.Intermediary_name || row.Intermediary || "Unknown")}
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onApprove(candidate)}
          className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 py-1.5 rounded-md transition-colors"
        >
          ✅ Add to Cart
        </button>
        
        {isFlagging ? (
          <div className="flex items-center gap-2 flex-1">
            <input 
              type="text" 
              value={flagNote}
              onChange={e => setFlagNote(e.target.value)}
              placeholder="Reason for flagging..."
              className="text-xs px-2 py-1 border rounded w-full focus:outline-none focus:border-amber-400 bg-background"
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
              Submit Flag
            </button>
            <button 
              onClick={() => setIsFlagging(false)}
              className="text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsFlagging(true)}
            className="bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
          >
            🚩 Flag
          </button>
        )}
      </div>
    </div>
  );
}
