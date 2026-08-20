"use client";

import type { Discrepancy } from "../types";

export interface DiscrepancyBadgesProps {
  discrepancies: Discrepancy[];
  candidateCount?: number;  // When > 1, shows the "X Candidates" badge
}

export function DiscrepancyBadges({ discrepancies, candidateCount }: DiscrepancyBadgesProps) {
  const severityClasses: Record<string, string> = {
    red: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  };

  const basePillClasses = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap";

  return (
    <div className="flex flex-wrap gap-1.5">
      {discrepancies.map((d, i) => (
        <span key={i} className={`${basePillClasses} ${severityClasses[d.severity]}`}>
          {d.label}
        </span>
      ))}
      {candidateCount && candidateCount > 1 && (
        <span className={`${basePillClasses} ${severityClasses['blue']}`}>
          {candidateCount} Candidates 🗂
        </span>
      )}
    </div>
  );
}
