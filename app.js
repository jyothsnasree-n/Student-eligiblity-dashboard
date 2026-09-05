/**
 * SI26_P12: College Event Certificate Eligibility Board
 * Full Application Script: Data Models, Validation Layer, Eligibility Engine & DOM Rendering
 */

/**
 * 1. Fixed Activity Reference Table (Immutable Data)
 * Official catalog of available activities.
 */
const FIXED_ACTIVITIES = Object.freeze([
  { id: 'A01', name: 'Emerging Tech Talk', category: 'LEARN', points: 2 },
  { id: 'A02', name: 'Soldering Mini Lab', category: 'BUILD', points: 3 },
  { id: 'A03', name: 'Project Pitch Circle', category: 'SHARE', points: 2 },
  { id: 'A04', name: 'Open Source Clinic', category: 'BUILD', points: 2 }
]);

/**
 * 2. Default Built-in Participant Records (Baseline Data for Reset)
 */
const BUILTIN_PARTICIPANTS = Object.freeze([
  { id: 'C01', name: 'Asha', completedActivityIds: ['A01', 'A02', 'A03'] },
  { id: 'C02', name: 'Bilal', completedActivityIds: ['A01', 'A03', 'A04'] },
  { id: 'C03', name: 'Chen', completedActivityIds: ['A01', 'A02', 'A04'] },
  { id: 'C04', name: 'Divya', completedActivityIds: ['A02', 'A03', 'A04'] },
  { id: 'C05', name: 'Eshan', completedActivityIds: ['A01', 'A03'] }
]);

/**
 * 3. Application State Container (In-Memory)
 */
const appState = {
  participants: JSON.parse(JSON.stringify(BUILTIN_PARTICIPANTS)),
  evaluationResult: null,
  validationError: null
};

/**
 * Helper utility function to look up an activity definition by ID
 */
function getActivityById(activityId) {
  const cleanId = String(activityId || '').trim();
  return FIXED_ACTIVITIES.find(act => act.id === cleanId);
}

/**
 * ------------------------------------------------------------------
 * 4. Validation Engine Layer
 * ------------------------------------------------------------------
 */
function validateParticipantData(rawParticipants, fixedActivities = FIXED_ACTIVITIES) {
  if (!Array.isArray(rawParticipants)) {
    return {
      isValid: false,
      errorType: 'INVALID_PARTICIPANT',
      participantId: 'GLOBAL',
      offendingValue: 'Non-array input',
      message: 'Participant input list must be an array.'
    };
  }

  const seenParticipantIds = new Set();
  const validActivityIdSet = new Set(fixedActivities.map(a => a.id));
  const cleanedParticipants = [];

  for (const rawP of rawParticipants) {
    const rawId = rawP ? String(rawP.id || '') : '';
    const rawName = rawP ? String(rawP.name || '') : '';
    
    const cleanId = rawId.trim();
    const cleanName = rawName.trim();

    // 1. Validate Non-empty Participant ID & Name (INVALID_PARTICIPANT)
    if (!cleanId) {
      return {
        isValid: false,
        errorType: 'INVALID_PARTICIPANT',
        participantId: rawId || 'EMPTY_ID',
        offendingValue: 'Empty Participant ID',
        message: 'Participant ID must be non-empty.'
      };
    }

    if (!cleanName) {
      return {
        isValid: false,
        errorType: 'INVALID_PARTICIPANT',
        participantId: cleanId,
        offendingValue: 'Empty Participant Name',
        message: `Participant Name for '${cleanId}' must be non-empty.`
      };
    }

    // 2. Validate Participant ID Uniqueness (DUPLICATE_PARTICIPANT_ID)
    if (seenParticipantIds.has(cleanId)) {
      return {
        isValid: false,
        errorType: 'DUPLICATE_PARTICIPANT_ID',
        participantId: cleanId,
        offendingValue: cleanId,
        message: `Duplicate participant ID detected: '${cleanId}'.`
      };
    }
    seenParticipantIds.add(cleanId);

    // Parse completed activity IDs (support array or comma-separated string)
    const rawActivities = Array.isArray(rawP.completedActivityIds)
      ? rawP.completedActivityIds
      : typeof rawP.completedActivityIds === 'string'
        ? rawP.completedActivityIds.split(',')
        : [];

    const cleanedActivityIds = [];
    const seenActivityIds = new Set();

    for (const rawAct of rawActivities) {
      const cleanActId = String(rawAct || '').trim();
      if (!cleanActId) continue; // Skip empty tokens

      // 3. Validate Activity existence (UNKNOWN_ACTIVITY)
      if (!validActivityIdSet.has(cleanActId)) {
        return {
          isValid: false,
          errorType: 'UNKNOWN_ACTIVITY',
          participantId: cleanId,
          offendingValue: cleanActId,
          message: `Unknown activity ID '${cleanActId}' for participant '${cleanId}'.`
        };
      }

      // 4. Validate Duplicate Participation within same participant (DUPLICATE_PARTICIPATION)
      if (seenActivityIds.has(cleanActId)) {
        return {
          isValid: false,
          errorType: 'DUPLICATE_PARTICIPATION',
          participantId: cleanId,
          offendingValue: cleanActId,
          message: `Duplicate participation '${cleanActId}' found for participant '${cleanId}'.`
        };
      }

      seenActivityIds.add(cleanActId);
      cleanedActivityIds.push(cleanActId);
    }

    cleanedParticipants.push({
      id: cleanId,
      name: cleanName,
      completedActivityIds: cleanedActivityIds
    });
  }

  return {
    isValid: true,
    cleanedParticipants
  };
}

/**
 * Executes validation and manages state.
 * STALE DATA RULE: Clears evaluation results if validation fails.
 */
function runValidation(participants = appState.participants) {
  const result = validateParticipantData(participants, FIXED_ACTIVITIES);

  if (!result.isValid) {
    appState.validationError = result;
    appState.evaluationResult = null; // CLEARS PREVIOUS RESULTS & SUMMARY COUNTS!
  } else {
    appState.validationError = null;
  }

  return result;
}

/**
 * ------------------------------------------------------------------
 * 5. Eligibility Evaluation Engine Layer
 * ------------------------------------------------------------------
 */
function evaluateEligibility(cleanedParticipants, fixedActivities = FIXED_ACTIVITIES) {
  const activityMap = new Map(fixedActivities.map(act => [act.id, act]));
  const evaluatedRows = [];

  for (const p of cleanedParticipants) {
    let totalPoints = 0;
    const coveredCategories = new Set();

    // Map completed activities, sum points (each activity contributes exactly once), extract categories
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
    const hasEnoughPoints = totalPoints >= 6;

    const isEligible = hasLearn && hasBuild && hasShare && hasEnoughPoints;
    const failureReasons = [];

    // Contract Failure Reason Ordering:
    // 1. MISSING_CATEGORY: LEARN
    // 2. MISSING_CATEGORY: BUILD
    // 3. MISSING_CATEGORY: SHARE
    // 4. POINTS_BELOW_6
    if (!isEligible) {
      if (!hasLearn) failureReasons.push('MISSING_CATEGORY: LEARN');
      if (!hasBuild) failureReasons.push('MISSING_CATEGORY: BUILD');
      if (!hasShare) failureReasons.push('MISSING_CATEGORY: SHARE');
      if (!hasEnoughPoints) failureReasons.push('POINTS_BELOW_6');
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
      return a.isEligible ? -1 : 1; // Eligible (-1) before Ineligible (1)
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

/**
 * Maps raw backend failure reasons to clean, natural user-facing text
 */
function formatFailureReasonForDisplay(reason) {
  switch (reason) {
    case 'MISSING_CATEGORY: LEARN': return 'Learn';
    case 'MISSING_CATEGORY: BUILD': return 'Build';
    case 'MISSING_CATEGORY: SHARE': return 'Share';
    case 'POINTS_BELOW_6': return 'Below 6';
    default: return reason;
  }
}

/**
 * ------------------------------------------------------------------
 * 6. UI DOM Rendering Engine
 * ------------------------------------------------------------------
 */
function render() {
  renderFixedActivitiesTable();
  renderParticipantInputTable();
  renderValidationBanner();
  renderResultsSection();
}

/** Render Fixed Activities Reference Table */
function renderFixedActivitiesTable() {
  const tbody = document.getElementById('fixed-activities-body');
  if (!tbody) return;

  tbody.innerHTML = FIXED_ACTIVITIES.map(act => `
    <tr>
      <td><strong>${act.id}</strong></td>
      <td>${act.name}</td>
      <td><span class="badge badge-neutral">${act.category}</span></td>
      <td><strong>${act.points} Points</strong></td>
    </tr>
  `).join('');
}

/** Render Editable Participant Input Table */
function renderParticipantInputTable() {
  const tbody = document.getElementById('participant-input-body');
  if (!tbody) return;

  tbody.innerHTML = appState.participants.map((p, index) => {
    const actString = Array.isArray(p.completedActivityIds)
      ? p.completedActivityIds.join(', ')
      : p.completedActivityIds;

    return `
      <tr>
        <td>
          <input type="text" class="input-text" data-index="${index}" data-field="id" value="${escapeHtml(p.id)}" placeholder="e.g. C01">
        </td>
        <td>
          <input type="text" class="input-text" data-index="${index}" data-field="name" value="${escapeHtml(p.name)}" placeholder="Participant Name">
        </td>
        <td>
          <input type="text" class="input-text" data-index="${index}" data-field="completedActivityIds" value="${escapeHtml(actString)}" placeholder="e.g. A01, A02, A03">
        </td>
      </tr>
    `;
  }).join('');

  // Attach input event listeners to sync typed input to appState
  tbody.querySelectorAll('.input-text').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const field = e.target.getAttribute('data-field');
      const val = e.target.value;

      if (field === 'completedActivityIds') {
        appState.participants[idx].completedActivityIds = val;
      } else {
        appState.participants[idx][field] = val;
      }
    });
  });
}

/** Render Validation Error Banner (or hide if valid) */
function renderValidationBanner() {
  const container = document.getElementById('validation-container');
  if (!container) return;

  if (appState.validationError) {
    const err = appState.validationError;
    container.className = 'validation-banner';
    container.innerHTML = `
      <div class="validation-title">
        <span>${err.errorType}</span>
      </div>
      <div class="validation-detail">
        Participant ID: <strong>${escapeHtml(err.participantId)}</strong> | Offending Value: <strong>'${escapeHtml(err.offendingValue)}'</strong> — ${escapeHtml(err.message)}
      </div>
    `;
  } else {
    container.className = 'validation-banner hidden';
    container.innerHTML = '';
  }
}

/** Render Summary Counts and Results Table */
function renderResultsSection() {
  const container = document.getElementById('results-container');
  if (!container) return;

  if (!appState.evaluationResult) {
    container.className = 'results-wrapper hidden';
    return;
  }

  container.className = 'results-wrapper';
  const res = appState.evaluationResult;

  // Update Summary Counts
  document.getElementById('stat-total').textContent = res.totalEvaluated;
  document.getElementById('stat-eligible').textContent = res.totalEligible;
  document.getElementById('stat-ineligible').textContent = res.totalIneligible;

  // Render Results Table
  const tbody = document.getElementById('results-body');
  if (!tbody) return;

  tbody.innerHTML = res.rows.map(r => {
    const statusBadge = r.isEligible
      ? `<span class="badge badge-eligible">Eligible</span>`
      : `<span class="badge badge-ineligible">Ineligible</span>`;

    const pointsClass = r.totalPoints >= 6 ? 'points-pass' : 'points-fail';
    const pointsBadge = `<span class="points-badge ${pointsClass}">${r.totalPoints} Points</span>`;

    // Category progress: ONLY render completed categories (no red missing chips!)
    const categoryChips = r.coveredCategories.length > 0
      ? `<div class="category-strip">${r.coveredCategories.map(cat => `<span class="cat-chip">${cat}</span>`).join('')}</div>`
      : `<span style="color: var(--text-muted); font-size: 0.85rem;">None</span>`;

    // Failure reasons list (User-facing clean natural display)
    const failureHTML = r.isEligible || r.failureReasons.length === 0
      ? `<span style="color: var(--text-muted); font-size: 0.85rem;">None</span>`
      : `<ul class="reasons-list">${r.failureReasons.map(reason => `<li><span class="reason-tag">${escapeHtml(formatFailureReasonForDisplay(reason))}</span></li>`).join('')}</ul>`;

    return `
      <tr>
        <td><strong>${escapeHtml(r.id)}</strong> — ${escapeHtml(r.name)}</td>
        <td>${pointsBadge}</td>
        <td>${categoryChips}</td>
        <td>${statusBadge}</td>
        <td>${failureHTML}</td>
      </tr>
    `;
  }).join('');
}

/** Escapes HTML characters to prevent XSS in dynamic rendering */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * ------------------------------------------------------------------
 * 7. Action Event Handlers (Evaluate & Reset)
 * ------------------------------------------------------------------
 */

/** Handle Evaluate Action */
function handleEvaluate() {
  const valResult = runValidation(appState.participants);

  if (valResult.isValid) {
    appState.evaluationResult = evaluateEligibility(valResult.cleanedParticipants, FIXED_ACTIVITIES);
  } else {
    appState.evaluationResult = null; // STALE DATA RULE: Clear results on error
  }

  render();
}

/** Handle Reset Action */
function handleReset() {
  // Restore initial built-in participants
  appState.participants = JSON.parse(JSON.stringify(BUILTIN_PARTICIPANTS));
  appState.validationError = null;
  appState.evaluationResult = null; // CLEARS VALIDATION, RESULTS, AND COUNTS

  render();
}

/**
 * Application Initialization
 */
function init() {
  // Attach button event listeners
  const btnEval = document.getElementById('btn-evaluate');
  const btnReset = document.getElementById('btn-reset');

  if (btnEval) btnEval.addEventListener('click', handleEvaluate);
  if (btnReset) btnReset.addEventListener('click', handleReset);

  // Load and evaluate built-in records initially
  handleEvaluate();
}

// Run initialization when DOM content is loaded
document.addEventListener('DOMContentLoaded', init);
