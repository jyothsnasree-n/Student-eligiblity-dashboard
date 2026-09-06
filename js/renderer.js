/**
 * renderer.js
 * DOM Rendering layer (Handles UI presentation and HTML template generation)
 */

import { formatFailureReasonForDisplay } from './rules.js';

/** Escapes HTML characters to prevent XSS in dynamic rendering */
export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Render Fixed Activities Reference Table */
export function renderFixedActivitiesTable(fixedActivities) {
  const tbody = document.getElementById('fixed-activities-body');
  if (!tbody) return;

  tbody.innerHTML = fixedActivities.map(act => `
    <tr>
      <td><strong>${act.id}</strong></td>
      <td>${act.name}</td>
      <td><span class="badge badge-neutral">${act.category}</span></td>
      <td><strong>${act.points} Points</strong></td>
    </tr>
  `).join('');
}

/** Render Editable Participant Input Table */
export function renderParticipantInputTable(participants, onInputChange) {
  const tbody = document.getElementById('participant-input-body');
  if (!tbody) return;

  tbody.innerHTML = participants.map((p, index) => {
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

  // Attach input event listeners to sync typed input to appState via callback
  tbody.querySelectorAll('.input-text').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const field = e.target.getAttribute('data-field');
      const val = e.target.value;
      if (typeof onInputChange === 'function') {
        onInputChange(idx, field, val);
      }
    });
  });
}

/** Render Validation Error Banner (Supports single or multiple validation errors) */
export function renderValidationBanner(validationError) {
  const container = document.getElementById('validation-container');
  if (!container) return;

  if (validationError && !validationError.isValid) {
    container.className = 'validation-banner';
    const errorList = Array.isArray(validationError.errors) && validationError.errors.length > 0
      ? validationError.errors
      : [validationError];

    if (errorList.length === 1) {
      const err = errorList[0];
      container.innerHTML = `
        <div class="validation-title">
          <span>${escapeHtml(err.errorType)}</span>
        </div>
        <div class="validation-detail">
          Participant ID: <strong>${escapeHtml(err.participantId)}</strong> | Offending Value: <strong>'${escapeHtml(err.offendingValue)}'</strong> — ${escapeHtml(err.message)}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="validation-title">
          <span>Multiple Validation Errors Detected (${errorList.length})</span>
        </div>
        <ul style="margin-top: 0.5rem; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
          ${errorList.map(err => `
            <li class="validation-detail">
              <strong>${escapeHtml(err.errorType)}</strong> — Participant ID: <strong>${escapeHtml(err.participantId)}</strong> | Offending Value: <strong>'${escapeHtml(err.offendingValue)}'</strong> — ${escapeHtml(err.message)}
            </li>
          `).join('')}
        </ul>
      `;
    }
  } else {
    container.className = 'validation-banner hidden';
    container.innerHTML = '';
  }
}

/** Render Summary Counts and Results Table */
export function renderResultsSection(evaluationResult) {
  const container = document.getElementById('results-container');
  if (!container) return;

  if (!evaluationResult) {
    container.className = 'results-wrapper hidden';
    return;
  }

  container.className = 'results-wrapper';

  // Update Summary Counts
  document.getElementById('stat-total').textContent = evaluationResult.totalEvaluated;
  document.getElementById('stat-eligible').textContent = evaluationResult.totalEligible;
  document.getElementById('stat-ineligible').textContent = evaluationResult.totalIneligible;

  // Render Results Table
  const tbody = document.getElementById('results-body');
  if (!tbody) return;

  tbody.innerHTML = evaluationResult.rows.map(r => {
    const statusBadge = r.isEligible
      ? `<span class="badge badge-eligible">Eligible</span>`
      : `<span class="badge badge-ineligible">Ineligible</span>`;

    const pointsClass = r.totalPoints >= 6 ? 'points-pass' : 'points-fail';
    const pointsBadge = `<span class="points-badge ${pointsClass}">${r.totalPoints} Points</span>`;

    // Category progress: ONLY render completed categories
    const categoryChips = r.coveredCategories.length > 0
      ? `<div class="category-strip">${r.coveredCategories.map(cat => `<span class="cat-chip">${cat}</span>`).join('')}</div>`
      : `<span style="color: var(--text-muted); font-size: 0.85rem;">None</span>`;

    // Failure reasons list
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

/** Complete UI Render Pipeline */
export function renderAll(state, fixedActivities, onInputChange) {
  renderFixedActivitiesTable(fixedActivities);
  renderParticipantInputTable(state.participants, onInputChange);
  renderValidationBanner(state.validationError);
  renderResultsSection(state.evaluationResult);
}
