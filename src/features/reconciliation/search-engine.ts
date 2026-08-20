import { STOP_WORD_REGEX, PRODUCT_TO_PR_CATEGORY, COVER_MONTH_TOLERANCE } from './constants';
import type { OpportunityWithUser, ExcelRowData, ScoredCandidate, GroupedClaims, PrCategory } from './types';

const PRODUCT_STOP_WORDS = [
  'COOPCARE', 'COOP CARE', 'COOP_CARE', 'JILINDE', 'JIKINGE', 'HOSPICASH', 'GFE', 
  'STUDENTS PA', 'STUDENTS_PA', 'BIASHARA SALAMA', 'BIASHARA_SALAMA', 'LIVESTOCK'
];
const PRODUCT_STOP_REGEX = new RegExp(`\\b(${PRODUCT_STOP_WORDS.join('|')})\\b`, 'gi');

export function cleanName(raw: string): string {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .replace(/[-.,'"”’—_]/g, ' ')
    .replace(STOP_WORD_REGEX, '')
    .replace(PRODUCT_STOP_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
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
  config: { activePeriodMonth: number; activePeriodYear: number; verifiedInvoices: string[]; activeTab: PrCategory; manualQuery?: string; }
): ScoredCandidate[] {
  if (dataLake.length === 0) return [];

  const lakeWithCleanedNames: ExcelRowData[] = dataLake.map(row => ({
    ...row,
    _cleanedName: cleanName(String(row.Insured || row["Client Name"] || row.Client || row["PROPOSER NAME"] || ""))
  }));

  let evaluatedCandidates: Array<{ item: ExcelRowData, score: number }> = [];

  const manualQ = (config.manualQuery || '').trim();
  if (manualQ.length > 2) {
    const cleanedManual = cleanName(manualQ);
    const matches = lakeWithCleanedNames.filter(row => 
      (row._cleanedName || '').includes(cleanedManual)
    );
    evaluatedCandidates = matches.map(item => ({ item, score: 100 }));
  } else {
    const cleanedClaimName = cleanName(claim.client_name);
    const cooTokens = cleanedClaimName.split(' ').filter(t => t.length > 0);

    const scored = lakeWithCleanedNames.map(candidate => {
      let baseScore = 0;
      const candidateTokens = (candidate._cleanedName || '').split(' ').filter(t => t.length > 0);

      if (cooTokens.length > 0 && candidateTokens.length > 0) {
        const cooFirst = cooTokens[0];
        const candFirst = candidateTokens[0];

        if (cooFirst === candFirst) {
          baseScore += 50;
        } else if (levenshteinDistance(cooFirst, candFirst) <= 2) {
          baseScore += 30;
        } else if (cooFirst.includes(candFirst) || candFirst.includes(cooFirst)) {
          baseScore += 20;
        }

        for (let i = 1; i < cooTokens.length; i++) {
          if (candidateTokens.includes(cooTokens[i])) {
            baseScore += 10;
          }
        }
      }

      return { item: candidate, score: baseScore };
    });

    evaluatedCandidates = scored.filter(c => c.score > 0);
  }

  const scoredCandidates: ScoredCandidate[] = evaluatedCandidates.map(res => {
    let score = res.score;
    const candidate = res.item;

    const fieldMatches: ScoredCandidate['fieldMatches'] = {
      clientName: 'match', // Implicit match because it passed the Token Matcher threshold
      intermediary: 'unavailable',
      branch: 'unavailable',
      premium: 'unavailable',
      product: 'unavailable',
      coverMonth: 'unavailable',
    };
    
    const discrepancies: ScoredCandidate['discrepancies'] = [];

    const cooBranch = claim.user?.branch?.name?.toUpperCase() || "";
    const excelBranch = String(candidate.Branch_name || candidate.Branch || candidate["BRANCH NAME"] || "").toUpperCase();
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
      candidate.Premium || candidate["GROSS PREMIUM"] || 
      candidate["ADJUSTED GROSS PREMIUM"] || candidate.Paid_amount_kshs ||
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
