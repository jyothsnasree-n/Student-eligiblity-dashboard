/**
 * tests/eligibility.test.js
 * Focused Unit Tests for Business & Eligibility Logic (Independent of DOM)
 */

import { FIXED_ACTIVITIES, BUILTIN_PARTICIPANTS } from '../js/data.js';
import { validateParticipantData } from '../js/validator.js';
import { evaluateEligibility } from '../js/eligibility.js';
import { FAILURE_REASONS, ERR_TYPES } from '../js/rules.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('  RUNNING P12 ELIGIBILITY & VALIDATION UNIT TESTS   ');
console.log('====================================================\n');

// Baseline Evaluation Setup
const valBaseline = validateParticipantData(BUILTIN_PARTICIPANTS, FIXED_ACTIVITIES);
const resBaseline = evaluateEligibility(valBaseline.cleanedParticipants, FIXED_ACTIVITIES);

// 1. C01 Eligible (7 Points)
const c01 = resBaseline.rows.find(r => r.id === 'C01');
assert(c01 && c01.totalPoints === 7 && c01.isEligible === true && c01.failureReasons.length === 0,
  'C01 is eligible with 7 points and 0 failure reasons');

// 2. C02 Eligible at exactly 6 Points (Exact Point Boundary)
const c02 = resBaseline.rows.find(r => r.id === 'C02');
assert(c02 && c02.totalPoints === 6 && c02.isEligible === true && c02.failureReasons.length === 0,
  'C02 is eligible at exactly 6 points boundary');

// 3. C03 Missing SHARE Category
const c03 = resBaseline.rows.find(r => r.id === 'C03');
assert(c03 && c03.totalPoints === 7 && c03.isEligible === false && c03.failureReasons.join(',') === FAILURE_REASONS.MISSING_SHARE,
  'C03 is ineligible due to missing SHARE category only');

// 4. C04 Missing LEARN Category
const c04 = resBaseline.rows.find(r => r.id === 'C04');
assert(c04 && c04.totalPoints === 7 && c04.isEligible === false && c04.failureReasons.join(',') === FAILURE_REASONS.MISSING_LEARN,
  'C04 is ineligible due to missing LEARN category only');

// 5. C05 Missing BUILD + Points Below 6
const c05 = resBaseline.rows.find(r => r.id === 'C05');
const expectedC05Reasons = `${FAILURE_REASONS.MISSING_BUILD},${FAILURE_REASONS.POINTS_BELOW_6}`;
assert(c05 && c05.totalPoints === 4 && c05.isEligible === false && c05.failureReasons.join(',') === expectedC05Reasons,
  'C05 is ineligible due to missing BUILD and points below 6');

// 6. Adding A04 makes C05 Eligible
const modifiedParticipants = JSON.parse(JSON.stringify(BUILTIN_PARTICIPANTS));
modifiedParticipants.find(p => p.id === 'C05').completedActivityIds.push('A04');
const valMod = validateParticipantData(modifiedParticipants, FIXED_ACTIVITIES);
const resMod = evaluateEligibility(valMod.cleanedParticipants, FIXED_ACTIVITIES);
const c05Mod = resMod.rows.find(r => r.id === 'C05');
assert(c05Mod && c05Mod.totalPoints === 6 && c05Mod.isEligible === true && resMod.totalEligible === 3 && resMod.totalIneligible === 2,
  'Adding A04 to C05 increases total points to 6 and makes C05 eligible (3 eligible, 2 ineligible)');

// 7. Empty Activities List is Valid & Yields All 4 Failure Reasons
const emptyListParticipant = [{ id: 'C99', name: 'Empty Test', completedActivityIds: [] }];
const valEmpty = validateParticipantData(emptyListParticipant, FIXED_ACTIVITIES);
const resEmpty = evaluateEligibility(valEmpty.cleanedParticipants, FIXED_ACTIVITIES);
const rEmpty = resEmpty.rows[0];
const expectedAll4Reasons = `${FAILURE_REASONS.MISSING_LEARN},${FAILURE_REASONS.MISSING_BUILD},${FAILURE_REASONS.MISSING_SHARE},${FAILURE_REASONS.POINTS_BELOW_6}`;
assert(valEmpty.isValid && rEmpty.totalPoints === 0 && rEmpty.failureReasons.join(',') === expectedAll4Reasons,
  'Empty completed activities list is valid, yields 0 points and all 4 failure reasons in exact order');

// 8. Duplicate Participation Triggers DUPLICATE_PARTICIPATION Error
const dupParticipant = [{ id: 'C01', name: 'Asha', completedActivityIds: ['A01', 'A01'] }];
const valDup = validateParticipantData(dupParticipant, FIXED_ACTIVITIES);
assert(!valDup.isValid && valDup.errorType === ERR_TYPES.DUPLICATE_PARTICIPATION && valDup.offendingValue === 'A01',
  'Duplicate participation (A01 repeated) triggers DUPLICATE_PARTICIPATION validation error');

// 9. Required Result Ordering (Eligible First, then Ineligible; ID Ascending)
const orderString = resBaseline.rows.map(r => `${r.id}:${r.isEligible ? 'E' : 'I'}`).join(',');
assert(orderString === 'C01:E,C02:E,C03:I,C04:I,C05:I',
  'Result rows are sorted by Eligible first, then Ineligible, and ascending by ID (C01:E, C02:E, C03:I, C04:I, C05:I)');

// 10. Multi-Error Validation Collection
const multiErrInput = [
  { id: 'C01', name: 'Asha', completedActivityIds: ['A99'] },          // UNKNOWN_ACTIVITY
  { id: 'C02', name: 'Bilal', completedActivityIds: ['A01', 'A01'] },   // DUPLICATE_PARTICIPATION
  { id: '', name: 'Empty ID Test', completedActivityIds: ['A01'] }    // INVALID_PARTICIPANT
];
const valMulti = validateParticipantData(multiErrInput, FIXED_ACTIVITIES);
assert(!valMulti.isValid && Array.isArray(valMulti.errors) && valMulti.errors.length === 3,
  'validateParticipantData collects all 3 errors when multiple rows contain invalid inputs');

console.log('\n====================================================');
console.log(`  TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED  `);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
