import type { Opportunity, User, Branch } from '@prisma/client';
import type { ExcelRowData } from './components/ExcelUploader';

// ─── Opportunity with its relations (replaces `any` throughout) ───
export type OpportunityWithUser = Opportunity & {
  user: User & { branch: Branch | null };
};

// ─── Bucket Classification ───
export type MatchBucket = 'A' | 'B' | 'C';

// ─── Discrepancy Flags (Bucket B only) ───
export type DiscrepancyType =
  | 'CROSS_BRANCH'
  | 'HISTORICAL_MONTH'
  | 'PRODUCT_MISMATCH'
  | 'NAME_FUZZY'
  | 'PREMIUM_DRIFT'
  | 'MULTIPLE_CANDIDATES';

export interface Discrepancy {
  type: DiscrepancyType;
  label: string;       // Human-readable label, e.g. "Branch: Mombasa ⚠"
  cooValue: string;    // The COO-side value
  prValue: string;     // The PR-side value
  severity: 'red' | 'orange' | 'yellow' | 'blue';
}

// ─── Field-level match map for the Diff View ───
export type FieldMatchStatus = 'match' | 'mismatch' | 'unavailable';

export interface FieldMatchMap {
  clientName: FieldMatchStatus;
  intermediary: FieldMatchStatus;
  branch: FieldMatchStatus;
  premium: FieldMatchStatus;
  product: FieldMatchStatus;
  coverMonth: FieldMatchStatus;
}

// ─── Scored Candidate ───
export interface ScoredCandidate {
  candidate: ExcelRowData;
  score: number;
  passesAllStrict: boolean;  // true = all 4 strict rules pass
  discrepancies: Discrepancy[];
  fieldMatches: FieldMatchMap;
}

// ─── Evaluated Opportunity (replaces current EvaluatedOpportunity) ───
export interface EvaluatedOpportunity {
  opportunity: OpportunityWithUser;
  bucket: MatchBucket;
  bestCandidate: ScoredCandidate | null;
  allCandidates: ScoredCandidate[];
  discrepancies: Discrepancy[];   // Shortcut: bestCandidate's discrepancies
}

// ─── Action States ───
export type RowActionState = 'pending' | 'verified' | 'rejected' | 'flagged';
