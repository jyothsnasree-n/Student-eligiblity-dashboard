/**
 * eligibility.js
 * Core Eligibility Calculation Engine (Pure business logic decoupled from DOM)
 */

import { MIN_ELIGIBILITY_POINTS, FAILURE_REASONS } from './rules.js';

/**
 * Evaluates points, category coverage, eligibility status, and failure reasons.
 * 
 * Rules Evaluated:
 * 1. Sum points for completed activities (each activity counted exactly once).
 * 2. Collect unique category set (LEARN, BUILD, SHARE).
 * 3. Eligibility require points >= 6 AND all 3 categories covered.
 * 4. Ineligible participants list missing categories in sequence:
 *    MISSING_CATEGORY: LEARN -> MISSING_CATEGORY: BUILD -> MISSING_CATEGORY: SHARE -> POINTS_BELOW_6
 * 5. Sort outputs: Eligible first, Ineligible second, then Participant ID ascending.
 * 
 * @param {Array} cleanedParticipants 
 * @param {Array} fixedActivities 
 * @returns {object} { rows, totalEvaluated, totalEligible, totalIneligible }
 */
export function evaluateEligibility(cleanedParticipants, fixedActivities) {
  const activityMap = new Map(fixedActivities.map(act => [act.id, act]));
  const evaluatedRows = [];

  for (const p of cleanedParticipants) {
    let totalPoints = 0;
    const coveredCategories = new Set();

    // Map completed activities, sum points, extract categories
    for (const actId of p.completedActivityIds) {
      const actObj = activityMap.get(actId);
      if (actObj) {
        totalPoints += actObj.points;
        coveredCategories.add(actObj.category);
      }
    }

    const hasLearn = coveredCategories.has('LEARN');
    const hasBuild = coveredCategories.has('BUILD');
    const hasShare = coveredCategories.has('SHARE');
    const hasEnoughPoints = totalPoints >= MIN_ELIGIBILITY_POINTS;

    const isEligible = hasLearn && hasBuild && hasShare && hasEnoughPoints;
    const failureReasons = [];

    // Contract Failure Reason Ordering
    if (!isEligible) {
      if (!hasLearn) failureReasons.push(FAILURE_REASONS.MISSING_LEARN);
      if (!hasBuild) failureReasons.push(FAILURE_REASONS.MISSING_BUILD);
      if (!hasShare) failureReasons.push(FAILURE_REASONS.MISSING_SHARE);
      if (!hasEnoughPoints) failureReasons.push(FAILURE_REASONS.POINTS_BELOW_6);
    }

    evaluatedRows.push({
      id: p.id,
      name: p.name,
      completedActivityIds: p.completedActivityIds,
      totalPoints,
      coveredCategories: Array.from(coveredCategories),
      hasLearn,
      hasBuild,
      hasShare,
      isEligible,
      failureReasons
    });
  }

  // Contract Result Sorting Rules:
  // 1. Primary: Eligible participants first, Ineligible second
  // 2. Secondary: Participant ID ascending within each status
  evaluatedRows.sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalEligible = evaluatedRows.filter(r => r.isEligible).length;
  const totalIneligible = evaluatedRows.filter(r => !r.isEligible).length;

  return {
    rows: evaluatedRows,
    totalEvaluated: evaluatedRows.length,
    totalEligible,
    totalIneligible
  };
}
