// ============================================================
// src/utils/helpers.js — Shared Backend Utility Functions
// ============================================================
// Small reusable functions used by multiple controllers.
// Keeping them here avoids repeating the same logic everywhere.
// ============================================================

// ── countWords ────────────────────────────────────────────────
// Counts the number of words in a string.
// Used when a source is added to calculate its wordCount field.
//
// @param {string} text
// @returns {number}
export const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// ── isValidMongoId ────────────────────────────────────────────
// Checks if a string looks like a valid MongoDB ObjectId.
// MongoDB IDs are exactly 24 hex characters.
// Used in controllers before querying to give a cleaner error.
//
// @param {string} id
// @returns {boolean}
export const isValidMongoId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};
