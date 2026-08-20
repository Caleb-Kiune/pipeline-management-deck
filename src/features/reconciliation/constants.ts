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

/**
 * Premium tolerance for "close match".
 * 5% of the expected premium.
 */
export const PREMIUM_TOLERANCE_PERCENT = 0.05;

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
