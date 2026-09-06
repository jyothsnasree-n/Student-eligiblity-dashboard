/**
 * validator.js
 * Input validation logic layer for participant data
 * Supports collecting single or multiple validation errors across the input table.
 */

import { ERR_TYPES } from './rules.js';

/**
 * Audits raw participant records against contract constraints.
 * Collects ALL validation errors found across the participant table.
 * 
 * Rules Evaluated:
 * 1. INVALID_PARTICIPANT: Participant ID and Name must be non-empty after trimming.
 * 2. DUPLICATE_PARTICIPANT_ID: Participant IDs must be unique across all rows.
 * 3. UNKNOWN_ACTIVITY: Completed activity IDs must exist in fixedActivities.
 * 4. DUPLICATE_PARTICIPATION: Repeated activity ID for the same participant is invalid.
 * 5. Empty completed activities list is VALID.
 * 
 * @param {Array} rawParticipants 
 * @param {Array} fixedActivities 
 * @returns {object} Validation result object ({ isValid, errors: [...], errorType, participantId, offendingValue, message, cleanedParticipants })
 */
export function validateParticipantData(rawParticipants, fixedActivities) {
  if (!Array.isArray(rawParticipants)) {
    const err = {
      errorType: ERR_TYPES.INVALID_PARTICIPANT,
      participantId: 'GLOBAL',
      offendingValue: 'Non-array input',
      message: 'Participant input list must be an array.'
    };
    return {
      isValid: false,
      errors: [err],
      errorType: err.errorType,
      participantId: err.participantId,
      offendingValue: err.offendingValue,
      message: err.message
    };
  }

  const errors = [];
  const seenParticipantIds = new Set();
  const validActivityIdSet = new Set(fixedActivities.map(a => a.id));
  const cleanedParticipants = [];

  for (let i = 0; i < rawParticipants.length; i++) {
    const rawP = rawParticipants[i];
    const rawId = rawP ? String(rawP.id || '') : '';
    const rawName = rawP ? String(rawP.name || '') : '';
    
    const cleanId = rawId.trim();
    const cleanName = rawName.trim();

    // 1. Validate Non-empty Participant ID (INVALID_PARTICIPANT)
    if (!cleanId) {
      errors.push({
        errorType: ERR_TYPES.INVALID_PARTICIPANT,
        participantId: rawId || `ROW_${i + 1}`,
        offendingValue: 'Empty Participant ID',
        message: `Row ${i + 1}: Participant ID must be non-empty.`
      });
    }

    // Validate Non-empty Participant Name (INVALID_PARTICIPANT)
    if (!cleanName) {
      errors.push({
        errorType: ERR_TYPES.INVALID_PARTICIPANT,
        participantId: cleanId || `ROW_${i + 1}`,
        offendingValue: 'Empty Participant Name',
        message: `Participant Name for '${cleanId || 'Row ' + (i + 1)}' must be non-empty.`
      });
    }

    // 2. Validate Participant ID Uniqueness (DUPLICATE_PARTICIPANT_ID)
    if (cleanId && seenParticipantIds.has(cleanId)) {
      errors.push({
        errorType: ERR_TYPES.DUPLICATE_PARTICIPANT_ID,
        participantId: cleanId,
        offendingValue: cleanId,
        message: `Duplicate participant ID detected: '${cleanId}'.`
      });
    } else if (cleanId) {
      seenParticipantIds.add(cleanId);
    }

    // Parse completed activity IDs
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
        errors.push({
          errorType: ERR_TYPES.UNKNOWN_ACTIVITY,
          participantId: cleanId || `ROW_${i + 1}`,
          offendingValue: cleanActId,
          message: `Unknown activity ID '${cleanActId}' for participant '${cleanId || 'Row ' + (i + 1)}'.`
        });
      }

      // 4. Validate Duplicate Participation within same participant (DUPLICATE_PARTICIPATION)
      if (seenActivityIds.has(cleanActId)) {
        errors.push({
          errorType: ERR_TYPES.DUPLICATE_PARTICIPATION,
          participantId: cleanId || `ROW_${i + 1}`,
          offendingValue: cleanActId,
          message: `Duplicate participation '${cleanActId}' found for participant '${cleanId || 'Row ' + (i + 1)}'.`
        });
      } else {
        seenActivityIds.add(cleanActId);
      }

      cleanedActivityIds.push(cleanActId);
    }

    if (cleanId && cleanName) {
      cleanedParticipants.push({
        id: cleanId,
        name: cleanName,
        completedActivityIds: cleanedActivityIds
      });
    }
  }

  // If any errors were encountered, return invalid state with full errors array
  if (errors.length > 0) {
    const primary = errors[0];
    return {
      isValid: false,
      errors,
      errorType: primary.errorType,
      participantId: primary.participantId,
      offendingValue: primary.offendingValue,
      message: primary.message
    };
  }

  return {
    isValid: true,
    errors: [],
    cleanedParticipants
  };
}
