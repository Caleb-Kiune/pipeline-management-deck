import Fuse from 'fuse.js';
import { STOP_WORD_REGEX, PRODUCT_TO_PR_CATEGORY, NAME_MATCH_THRESHOLD, NAME_CANDIDATE_THRESHOLD, COVER_MONTH_TOLERANCE } from './constants';
import type { OpportunityWithUser, ExcelRowData, ScoredCandidate, GroupedClaims, PrCategory } from './types';

export function cleanName(raw: string): string {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .replace(STOP_WORD_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePeriodMatchesExact(periodStr: string, activeMonth: number, activeYear: number): boolean {
  const cleaned = periodStr.trim();
  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoMatch) {
    return parseInt(isoMatch[1]) === activeYear && parseInt(isoMatch[2]) === activeMonth;
  }
  const reversedMatch = cleaned.match(/^(\d{1,2})[-/](\d{4})$/);
  if (reversedMatch) {
    return parseInt(reversedMatch[2]) === activeYear && parseInt(reversedMatch[1]) === activeMonth;
  }
  const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const MONTH_ABBREVS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  const wordMatch = cleaned.match(/^([a-zA-Z]+)[-\s](\d{4})$/);
  if (wordMatch) {
    const monthWord = wordMatch[1].toLowerCase();
    const year = parseInt(wordMatch[2]);
    const monthIdx =
      MONTH_NAMES.indexOf(monthWord) !== -1
        ? MONTH_NAMES.indexOf(monthWord) + 1
        : MONTH_ABBREVS.indexOf(monthWord) !== -1
          ? MONTH_ABBREVS.indexOf(monthWord) + 1
          : -1;
    if (monthIdx > 0) {
      return year === activeYear && monthIdx === activeMonth;
    }
  }
  if (!cleaned.includes(String(activeYear))) {
    return false;
  }
  return true;
}

export function findCandidates(
  claim: OpportunityWithUser,
  dataLake: ExcelRowData[],
  config: { activePeriodMonth: number; activePeriodYear: number; verifiedInvoices: string[]; activeTab: PrCategory; }
): ScoredCandidate[] {
  const filteredLake = dataLake.filter(row => row._prCategory === config.activeTab);
  
  if (filteredLake.length === 0) return [];

  const cleanedClaimName = cleanName(claim.client_name);
  
  const lakeWithCleanedNames: ExcelRowData[] = filteredLake.map(row => ({
    ...row,
    _cleanedName: cleanName(String(row.Insured || row["Client Name"] || row.Client || ""))
  }));

  const fuse = new Fuse(lakeWithCleanedNames, {
    keys: ['_cleanedName'],
    threshold: NAME_CANDIDATE_THRESHOLD,
    includeScore: true,
  });

  const fuseResults = fuse.search(cleanedClaimName, { limit: 15 });

  const scoredCandidates: ScoredCandidate[] = fuseResults.map(res => {
    let score = 0;
    const candidate = res.item;
    const fuseScore = res.score ?? 1;

    const fieldMatches: ScoredCandidate['fieldMatches'] = {
      clientName: 'unavailable',
      intermediary: 'unavailable',
      branch: 'unavailable',
      premium: 'unavailable',
      product: 'unavailable',
      coverMonth: 'unavailable',
    };
    
    const discrepancies: ScoredCandidate['discrepancies'] = [];

    if (fuseScore <= NAME_MATCH_THRESHOLD) {
      fieldMatches.clientName = 'match';
      score += 3;
    } else {
      fieldMatches.clientName = 'mismatch';
    }

    const cooBranch = claim.user?.branch?.name?.toUpperCase() || "";
    const excelBranch = String(candidate.Branch_name || candidate.Branch || "").toUpperCase();
    if (cooBranch && excelBranch) {
      if (excelBranch.includes(cooBranch) || cooBranch.includes(excelBranch)) {
        fieldMatches.branch = 'match';
      } else {
        fieldMatches.branch = 'mismatch';
      }
    }

    if (config.activeTab === 'Non-Medical') {
      const excelProduct = String(candidate._prCategory || '').toUpperCase();
      const claimCategory = (PRODUCT_TO_PR_CATEGORY[claim.product] || '').toUpperCase();
      if (excelProduct === claimCategory) {
        fieldMatches.product = 'match';
        score += 1;
      } else {
        fieldMatches.product = 'mismatch';
      }
    } else {
      fieldMatches.product = 'match';
      score += 1;
    }

    const accountPeriod = String(
      candidate.Account_period || candidate.Cover_period || candidate.Period || ""
    );
    if (accountPeriod) {
      const matchesActivePeriod = parsePeriodMatchesExact(
        accountPeriod, config.activePeriodMonth, config.activePeriodYear
      );
      if (matchesActivePeriod) {
        fieldMatches.coverMonth = 'match';
        score += 1;
      } else {
        fieldMatches.coverMonth = 'mismatch';
      }
    }

    const excelPremium = Number(
      candidate.Gross_premium_kshs || candidate["Gross Premium"] ||
      candidate.Premium || candidate.Paid_amount_kshs ||
      candidate.Basic_premium_kshs || 0
    );
    if (excelPremium > 0) {
      const delta = Math.abs(excelPremium - claim.expected_premium);
      if (delta <= claim.expected_premium * 0.05) {
        fieldMatches.premium = 'match';
      } else {
        fieldMatches.premium = 'mismatch';
      }
    }

    const excelIntermediary = String(candidate.Intermediary_name || candidate.Intermediary || "").toUpperCase();
    const claimIntermediary = String(claim.intermediary || "").toUpperCase();
    if (claimIntermediary && excelIntermediary) {
       if (excelIntermediary.includes(claimIntermediary) || claimIntermediary.includes(excelIntermediary)) {
         fieldMatches.intermediary = 'match';
       } else {
         fieldMatches.intermediary = 'mismatch';
       }
    }

    const invoiceNo = String(candidate.Invoice_number || candidate.Invoice || "");
    if (invoiceNo && config.verifiedInvoices.includes(invoiceNo)) {
      score = -Infinity;
    }

    return {
      candidate,
      score,
      passesAllStrict: score >= 5, 
      discrepancies, 
      fieldMatches
    };
  });

  return scoredCandidates.filter(c => c.score > -Infinity).sort((a, b) => b.score - a.score);
}

export function groupClaimsByCategory(claims: OpportunityWithUser[]): GroupedClaims[] {
  const map = new Map<PrCategory, Map<string, OpportunityWithUser[]>>();
  
  claims.forEach(claim => {
    const cat = (PRODUCT_TO_PR_CATEGORY[claim.product] || 'Unknown') as PrCategory;
    if (!map.has(cat)) map.set(cat, new Map());
    
    const prodMap = map.get(cat)!;
    if (!prodMap.has(claim.product)) prodMap.set(claim.product, []);
    prodMap.get(claim.product)!.push(claim);
  });

  const categoriesOrder: PrCategory[] = ['Medical', 'Non-Medical', 'Livestock'];
  
  const result: GroupedClaims[] = [];
  categoriesOrder.forEach(cat => {
    if (map.has(cat)) {
      const prodMap = map.get(cat)!;
      const products = Array.from(prodMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([product, claims]) => ({ product, claims }));
        
      result.push({ category: cat, products });
    }
  });

  return result;
}
