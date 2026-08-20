import { Product } from '@prisma/client';

/**
 * ABSOLUTE RULE — Maps COO Product enum values to the PR Category tag
 * set during Excel upload (_prCategory).
 *
 * Only COOP_CARE is Medical.
 * LIVESTOCK is Livestock.
 * Everything else is Non-Medical.
 */
export const PRODUCT_TO_PR_CATEGORY: Record<Product, string> = {
  COOP_CARE:        'Medical',
  JILINDE:          'Non-Medical',
  JIKINGE:          'Non-Medical',
  HOSPICASH:        'Non-Medical',
  GFE:              'Non-Medical',
  STUDENTS_PA:      'Non-Medical',
  BIASHARA_SALAMA:  'Non-Medical',
  LIVESTOCK:        'Livestock',
  OTHER:            'Unknown',
};

export const COMMISSION_RATE = 0.01; // 1%

/**
 * Stop-words stripped from client names before fuzzy matching.
 */
export const NAME_STOP_WORDS = [
  'LTD', 'LIMITED', 'SACCO', 'FARM', 'SCHOOL', 'AGENCY', 'UNIVERSITY', 'HOSPITAL',
  'TECHNICAL', 'COLLEGE', 'TRAINING', 'SOCIETY', 'ENTERPRISES', 'INVESTMENTS',
  'COMPANY', 'CO', 'INC', 'GROUP', 'SERVICES', 'INSTITUTE', 'ACADEMY',
  'CLINIC', 'CENTER', 'CENTRE', 'TRUST', 'FOUNDATION', 'CHURCH', 'MINISTRIES',
  'COOPERATIVE', 'CO-OPERATIVE'
] as const;

export const STOP_WORD_REGEX = new RegExp(
  `\\b(${NAME_STOP_WORDS.join('|')})\\b`,
  'gi'
);

export const PR_CATEGORIES = ['Medical', 'Non-Medical', 'Livestock'] as const;
export type PrCategory = typeof PR_CATEGORIES[number];

/**
 * Fuse.js threshold for "strong" name match (Bucket A gate).
 * Lower = stricter. 0.3 is tighter than the legacy 0.4.
 */
export const NAME_MATCH_THRESHOLD = 0.3;

/**
 * Fuse.js threshold for fuzzy candidate discovery (wider net).
 */
export const NAME_CANDIDATE_THRESHOLD = 0.45;

/**
 * ABSOLUTE RULE — Cover month tolerance.
 * 0 = The PR Account_period month/year must EXACTLY match
 * the active ReportingPeriod. Any delta flags as HISTORICAL_MONTH.
 */
export const COVER_MONTH_TOLERANCE = 0;
