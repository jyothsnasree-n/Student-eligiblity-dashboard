/**
 * app.js
 * Application Orchestration Layer (State Management, Event Binding, and Pipeline Execution)
 */

import { FIXED_ACTIVITIES, BUILTIN_PARTICIPANTS } from './data.js';
import { validateParticipantData } from './validator.js';
import { evaluateEligibility } from './eligibility.js';
import { renderAll } from './renderer.js';

/** Application State Container (In-Memory Data Store) */
export const appState = {
  participants: JSON.parse(JSON.stringify(BUILTIN_PARTICIPANTS)),
  evaluationResult: null,
  validationError: null
};

/** Syncs input field changes from DOM into memory state */
function handleInputChange(index, field, value) {
  if (appState.participants[index]) {
    appState.participants[index][field] = value;
  }
}

/** Handles Evaluate Action */
export function handleEvaluate() {
  const valResult = validateParticipantData(appState.participants, FIXED_ACTIVITIES);

  if (valResult.isValid) {
    appState.validationError = null;
    appState.evaluationResult = evaluateEligibility(valResult.cleanedParticipants, FIXED_ACTIVITIES);
  } else {
    appState.validationError = valResult;
    appState.evaluationResult = null; // STALE DATA RULE: Clear previous results on error
  }

  renderAll(appState, FIXED_ACTIVITIES, handleInputChange);
}

/** Handles Reset Action */
export function handleReset() {
  // Restore baseline built-in records
  appState.participants = JSON.parse(JSON.stringify(BUILTIN_PARTICIPANTS));
  appState.validationError = null;
  appState.evaluationResult = null; // CLEARS VALIDATION, RESULTS, AND COUNTS

  renderAll(appState, FIXED_ACTIVITIES, handleInputChange);
}

/** Initializes application DOM listeners and evaluates baseline records */
export function init() {
  const btnEval = document.getElementById('btn-evaluate');
  const btnReset = document.getElementById('btn-reset');

  if (btnEval) btnEval.addEventListener('click', handleEvaluate);
  if (btnReset) btnReset.addEventListener('click', handleReset);

  // Initial evaluation on load
  handleEvaluate();
}

// Auto-boot if running in browser DOM
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
