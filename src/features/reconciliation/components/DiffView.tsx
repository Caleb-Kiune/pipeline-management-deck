"use client";

import type { OpportunityWithUser, ScoredCandidate, FieldMatchStatus, FieldMatchMap } from "../types";

export interface DiffViewProps {
  opportunity: OpportunityWithUser;
  bestCandidate: ScoredCandidate;
}

const FIELD_ORDER: (keyof FieldMatchMap)[] = [
  'clientName',
  'intermediary',
  'branch',
  'premium',
  'product',
  'coverMonth',
];

function getDiffIcon(status: FieldMatchStatus): { symbol: string; className: string } {
  switch (status) {
    case 'match':       return { symbol: '=', className: 'text-gray-300 text-sm' };
    case 'mismatch':    return { symbol: '≠', className: 'text-red-500 font-bold text-lg' };
    case 'unavailable': return { symbol: '—', className: 'text-gray-200 text-sm' };
  }
}

function FieldRow({ label, value, isMismatch }: { label: string, value: string, isMismatch?: boolean }) {
  return (
    <div className="flex justify-between items-baseline text-sm h-[28px]">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className={`font-medium ${isMismatch ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

export function DiffView({ opportunity, bestCandidate }: DiffViewProps) {
  const candidate = bestCandidate.candidate;

  return (
    <div className="grid grid-cols-[1fr_40px_1fr] gap-0 items-stretch">
      {/* Left: COO Claim */}
      <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-l-lg p-5">
        <h4 className="font-semibold text-xs mb-4 uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          COO Claim
        </h4>
        <div className="space-y-3">
          <FieldRow label="Client" value={opportunity.client_name} />
          <FieldRow label="Intermediary" value={opportunity.intermediary || "Direct"} />
          <FieldRow label="Branch" value={opportunity.user?.branch?.name || "Unknown"} />
          <FieldRow label="Premium" value={`Ksh ${opportunity.expected_premium.toLocaleString()}`} />
          <FieldRow label="Product" value={opportunity.product.replace(/_/g, " ")} />
          <FieldRow label="Cover" value={opportunity.expected_closure_month || "Unknown"} />
        </div>
      </div>

      {/* Center: Diff connectors */}
      <div className="flex flex-col items-center justify-center space-y-3 py-5 pt-[52px]">
        {FIELD_ORDER.map(field => {
          const status = bestCandidate.fieldMatches[field];
          const icon = getDiffIcon(status);
          return (
            <div key={field} className={`flex items-center justify-center h-[28px] ${icon.className}`}>
              {icon.symbol}
            </div>
          );
        })}
      </div>

      {/* Right: PR Source */}
      <div className="bg-white dark:bg-gray-950 rounded-r-lg p-5 border-l border-border">
        <h4 className="font-semibold text-xs mb-4 uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          PR Source
        </h4>
        <div className="space-y-3">
          <FieldRow label="Insured" value={String(candidate.Insured || candidate["Client Name"] || candidate.Client || "Unknown")} isMismatch={bestCandidate.fieldMatches.clientName === 'mismatch'} />
          <FieldRow label="Intermediary" value={String(candidate.Intermediary_name || candidate.Intermediary || "Unknown")} isMismatch={bestCandidate.fieldMatches.intermediary === 'mismatch'} />
          <FieldRow label="Branch" value={String(candidate.Branch_name || candidate.Branch || "Unknown")} isMismatch={bestCandidate.fieldMatches.branch === 'mismatch'} />
          <FieldRow label="Premium" value={`Ksh ${Number(candidate.Gross_premium_kshs || candidate["Gross Premium"] || candidate.Premium || candidate.Paid_amount_kshs || candidate.Basic_premium_kshs || 0).toLocaleString()}`} isMismatch={bestCandidate.fieldMatches.premium === 'mismatch'} />
          <FieldRow label="Category" value={String(candidate._prCategory || "Unknown")} isMismatch={bestCandidate.fieldMatches.product === 'mismatch'} />
          <FieldRow label="Period" value={String(candidate.Account_period || candidate.Cover_period || candidate.Period || "Unknown")} isMismatch={bestCandidate.fieldMatches.coverMonth === 'mismatch'} />
        </div>
      </div>
    </div>
  );
}
