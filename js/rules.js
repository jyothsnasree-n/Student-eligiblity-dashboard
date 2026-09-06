/**
 * rules.js
 * Eligibility business rules, error constants, and display formatting maps
 */

export const MIN_ELIGIBILITY_POINTS = 6;
export const REQUIRED_CATEGORIES = Object.freeze(['LEARN', 'BUILD', 'SHARE']);

// Validation Error Type Identifiers
export const ERR_TYPES = Object.freeze({
  INVALID_PARTICIPANT: 'INVALID_PARTICIPANT',
  DUPLICATE_PARTICIPANT_ID: 'DUPLICATE_PARTICIPANT_ID',
  UNKNOWN_ACTIVITY: 'UNKNOWN_ACTIVITY',
  DUPLICATE_PARTICIPATION: 'DUPLICATE_PARTICIPATION'
});

// Failure Reason Identifiers (Contract Exact Strings)
export const FAILURE_REASONS = Object.freeze({
  MISSING_LEARN: 'MISSING_CATEGORY: LEARN',
  MISSING_BUILD: 'MISSING_CATEGORY: BUILD',
  MISSING_SHARE: 'MISSING_CATEGORY: SHARE',
  POINTS_BELOW_6: 'POINTS_BELOW_6'
});

/**
 * Maps raw backend contract failure reasons to clean, natural user-facing text
 * @param {string} reason 
 * @returns {string}
 */
export function formatFailureReasonForDisplay(reason) {
  switch (reason) {
    case FAILURE_REASONS.MISSING_LEARN: return 'Learn';
    case FAILURE_REASONS.MISSING_BUILD: return 'Build';
    case FAILURE_REASONS.MISSING_SHARE: return 'Share';
    case FAILURE_REASONS.POINTS_BELOW_6: return 'Below 6';
    default: return reason;
  }
}
