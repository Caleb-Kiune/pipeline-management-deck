"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { 
  UploadSlotState, 
  CooEntry, 
  ExcelRowData, 
  OpportunityWithUser, 
  ScoredCandidate, 
  ClaimActionState, 
  FlagNote, 
  PayrollRow,
  PrCategory 
} from './types';
import { PR_CATEGORIES, COMMISSION_RATE } from './constants';

export interface ReconciliationState {
  uploads: Record<PrCategory, UploadSlotState>;
  allCoos: CooEntry[];
  selectedCooId: string | null;
  dataLake: ExcelRowData[];
  activeClaims: OpportunityWithUser[];
  selectedClaimId: string | null;
  evaluatedCandidates: ScoredCandidate[];
  claimActions: Map<string, ClaimActionState>;
  flagNotes: Map<string, FlagNote>;
  payrollCart: PayrollRow[];
  activePeriodMonth: number;
  activePeriodYear: number;
  verifiedInvoices: string[];
  allOpportunities: OpportunityWithUser[];
  activeTab: PrCategory;
  searchQuery: string;
}

export type ReconciliationAction =
  | { type: 'SELECT_COO'; payload: string | null }
  | { type: 'UPLOAD_FILE'; payload: { category: PrCategory; file: File; sheetNames?: string[] } }
  | { type: 'UPLOAD_PARSED'; payload: { category: PrCategory; rows: ExcelRowData[]; selectedSheet: string } }
  | { type: 'UPLOAD_ERROR'; payload: { category: PrCategory; error: string } }
  | { type: 'UPLOAD_CLEAR'; payload: { category: PrCategory } }
  | { type: 'SELECT_CLAIM'; payload: string }
  | { type: 'SET_EVALUATED_CANDIDATES'; payload: ScoredCandidate[] }
  | { type: 'APPROVE_CANDIDATE'; payload: { opportunityId: string; candidate: ScoredCandidate } }
  | { type: 'REJECT_CLAIM'; payload: { opportunityId: string } }
  | { type: 'FLAG_CLAIM'; payload: { opportunityId: string; note: string } }
  | { type: 'UNDO_PAYROLL'; payload: { opportunityId: string } }
  | { type: 'SET_TAB'; payload: PrCategory }
  | { type: 'SET_SEARCH_QUERY'; payload: string };

function rebuildDataLake(uploads: Record<PrCategory, UploadSlotState>): ExcelRowData[] {
  return PR_CATEGORIES.flatMap(cat => uploads[cat].rows);
}

function reducer(state: ReconciliationState, action: ReconciliationAction): ReconciliationState {
  switch (action.type) {
    case 'SELECT_COO': {
      return {
        ...state,
        selectedCooId: action.payload,
        activeClaims: state.allOpportunities.filter(o => o.user_id === action.payload),
        selectedClaimId: null,
        evaluatedCandidates: [],
        payrollCart: [],
        claimActions: new Map(),
        flagNotes: new Map(),
        searchQuery: ''
      };
    }
    case 'SET_TAB': {
      return {
        ...state,
        activeTab: action.payload,
        selectedClaimId: null,
        evaluatedCandidates: [],
        searchQuery: ''
      };
    }
    case 'UPLOAD_FILE': {
      const { category, file, sheetNames } = action.payload;
      return {
        ...state,
        uploads: {
          ...state.uploads,
          [category]: { ...state.uploads[category], file, status: sheetNames && sheetNames.length > 1 ? 'loading' : 'loading', sheetNames }
        }
      };
    }
    case 'UPLOAD_PARSED': {
      const { category, rows, selectedSheet } = action.payload;
      const newUploads = {
        ...state.uploads,
        [category]: { ...state.uploads[category], rows, status: 'loaded' as const, error: undefined, selectedSheet }
      };
      return {
        ...state,
        uploads: newUploads,
        dataLake: rebuildDataLake(newUploads)
      };
    }
    case 'UPLOAD_ERROR': {
      const { category, error } = action.payload;
      const newUploads = {
        ...state.uploads,
        [category]: { ...state.uploads[category], error, status: 'error' as const }
      };
      return {
        ...state,
        uploads: newUploads,
        dataLake: rebuildDataLake(newUploads)
      };
    }
    case 'UPLOAD_CLEAR': {
      const { category } = action.payload;
      const newUploads = {
        ...state.uploads,
        [category]: { category, file: null, rows: [], status: 'empty' as const }
      };
      return {
        ...state,
        uploads: newUploads,
        dataLake: rebuildDataLake(newUploads)
      };
    }
    case 'SELECT_CLAIM': {
      return { ...state, selectedClaimId: action.payload, searchQuery: '' };
    }
    case 'SET_EVALUATED_CANDIDATES': {
      return { ...state, evaluatedCandidates: action.payload };
    }
    case 'SET_SEARCH_QUERY': {
      return { ...state, searchQuery: action.payload };
    }
    case 'APPROVE_CANDIDATE': {
      const { opportunityId, candidate } = action.payload;
      const claim = state.allOpportunities.find(c => c.id === opportunityId);
      if (!claim) return state;

      const grossPremium = Number(
        candidate.candidate.Gross_premium_kshs || 
        candidate.candidate["Gross Premium"] || 
        candidate.candidate.Premium || 
        candidate.candidate.Paid_amount_kshs || 
        candidate.candidate.Basic_premium_kshs || 
        0
      );

      const payrollRow: PayrollRow = {
        opportunityId,
        clientName: claim.client_name,
        product: claim.product,
        cooName: claim.user.name,
        cooBranch: claim.user?.branch?.name || 'Unknown',
        grossPremium,
        commission: grossPremium * COMMISSION_RATE,
        matchedPrRows: [candidate.candidate],
        verifiedAt: new Date(),
      };

      const newActions = new Map(state.claimActions);
      newActions.set(opportunityId, 'approved');

      return {
        ...state,
        payrollCart: [...state.payrollCart, payrollRow],
        claimActions: newActions,
        activeClaims: state.activeClaims.filter(c => c.id !== opportunityId),
        selectedClaimId: state.selectedClaimId === opportunityId ? null : state.selectedClaimId
      };
    }
    case 'REJECT_CLAIM': {
      const { opportunityId } = action.payload;
      const newActions = new Map(state.claimActions);
      newActions.set(opportunityId, 'rejected');
      
      return {
        ...state,
        claimActions: newActions,
        activeClaims: state.activeClaims.filter(c => c.id !== opportunityId),
        selectedClaimId: state.selectedClaimId === opportunityId ? null : state.selectedClaimId
      };
    }
    case 'FLAG_CLAIM': {
      const { opportunityId, note } = action.payload;
      const newActions = new Map(state.claimActions);
      newActions.set(opportunityId, 'flagged');
      
      const newNotes = new Map(state.flagNotes);
      newNotes.set(opportunityId, { opportunityId, note, flaggedAt: new Date() });

      return {
        ...state,
        claimActions: newActions,
        flagNotes: newNotes
      };
    }
    case 'UNDO_PAYROLL': {
      const { opportunityId } = action.payload;
      const claim = state.allOpportunities.find(c => c.id === opportunityId);
      if (!claim) return state;

      const newActions = new Map(state.claimActions);
      newActions.delete(opportunityId);

      return {
        ...state,
        payrollCart: state.payrollCart.filter(r => r.opportunityId !== opportunityId),
        claimActions: newActions,
        activeClaims: [...state.activeClaims, claim]
      };
    }
    default:
      return state;
  }
}

export const ReconciliationContext = createContext<{
  state: ReconciliationState;
  dispatch: React.Dispatch<ReconciliationAction>;
} | null>(null);

export function useReconciliation() {
  const context = useContext(ReconciliationContext);
  if (!context) throw new Error('useReconciliation must be used within ReconciliationProvider');
  return context;
}

export function ReconciliationProvider({ 
  initialOpportunities, 
  verifiedInvoices, 
  activePeriodMonth, 
  activePeriodYear, 
  children 
}: { 
  initialOpportunities: OpportunityWithUser[]; 
  verifiedInvoices: string[]; 
  activePeriodMonth: number; 
  activePeriodYear: number; 
  children: ReactNode 
}) {
  const allCoos = React.useMemo(() => {
    const map = new Map<string, CooEntry>();
    initialOpportunities.forEach(opp => {
      if (opp.user) {
        const existing = map.get(opp.user.id);
        if (existing) {
          existing.claimCount++;
        } else {
          map.set(opp.user.id, { 
            id: opp.user.id, 
            name: opp.user.name, 
            branchName: opp.user.branch?.name || null,
            claimCount: 1 
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.claimCount - a.claimCount);
  }, [initialOpportunities]);

  const initialState: ReconciliationState = {
    uploads: PR_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = { category: cat, file: null, rows: [], status: 'empty' };
      return acc;
    }, {} as Record<PrCategory, UploadSlotState>),
    allCoos,
    selectedCooId: null,
    dataLake: [],
    activeClaims: [],
    selectedClaimId: null,
    evaluatedCandidates: [],
    claimActions: new Map(),
    flagNotes: new Map(),
    payrollCart: [],
    activePeriodMonth,
    activePeriodYear,
    verifiedInvoices,
    allOpportunities: initialOpportunities,
    activeTab: 'Medical' as PrCategory,
    searchQuery: '',
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ReconciliationContext.Provider value={{ state, dispatch }}>
      {children}
    </ReconciliationContext.Provider>
  );
}
