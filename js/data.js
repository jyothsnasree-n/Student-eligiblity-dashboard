/**
 * data.js
 * Holds immutable baseline reference data (Fixed Activities & Built-in Sample Participants)
 */

export const FIXED_ACTIVITIES = Object.freeze([
  { id: 'A01', name: 'Emerging Tech Talk', category: 'LEARN', points: 2 },
  { id: 'A02', name: 'Soldering Mini Lab', category: 'BUILD', points: 3 },
  { id: 'A03', name: 'Project Pitch Circle', category: 'SHARE', points: 2 },
  { id: 'A04', name: 'Open Source Clinic', category: 'BUILD', points: 2 }
]);

export const BUILTIN_PARTICIPANTS = Object.freeze([
  { id: 'C01', name: 'Asha', completedActivityIds: ['A01', 'A02', 'A03'] },
  { id: 'C02', name: 'Bilal', completedActivityIds: ['A01', 'A03', 'A04'] },
  { id: 'C03', name: 'Chen', completedActivityIds: ['A01', 'A02', 'A04'] },
  { id: 'C04', name: 'Divya', completedActivityIds: ['A02', 'A03', 'A04'] },
  { id: 'C05', name: 'Eshan', completedActivityIds: ['A01', 'A03'] }
]);
