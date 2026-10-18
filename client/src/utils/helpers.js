// ============================================================
// src/utils/helpers.js — Reusable Utility Functions
// ============================================================
// Small helper functions used across multiple components.
// Keeping them here avoids repeating the same logic in
// different files.
// ============================================================

// ── countWords ────────────────────────────────────────────────
// Counts the number of words in a string.
// Used to display word count for each source.
//
// @param {string} text
// @returns {number}
export const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// ── truncateText ──────────────────────────────────────────────
// Shortens text to a maximum length and adds "..." if cut.
// Used for source card previews.
//
// @param {string} text
// @param {number} maxLength - Default 150 characters
// @returns {string}
export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// ── generateId ────────────────────────────────────────────────
// Generates a simple unique ID for each source card.
// Used as the React key prop and for identifying sources.
//
// @returns {string}
export const generateId = () => {
  return `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ── estimateReadingTime ────────────────────────────────────────
// Estimates reading time based on average 200 words per minute.
//
// @param {string} text
// @returns {string} e.g., "3 min read"
export const estimateReadingTime = (text) => {
  const words = countWords(text);
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
};

// ── formatSourcesForDisplay ───────────────────────────────────
// Adds wordCount to each source object for display.
// Called before storing sources in context.
//
// @param {Array} sources - Array of { title, content }
// @returns {Array} - Array of { id, title, content, wordCount }
export const formatSourcesForDisplay = (sources) => {
  return sources.map((source) => ({
    ...source,
    wordCount: countWords(source.content),
  }));
};
