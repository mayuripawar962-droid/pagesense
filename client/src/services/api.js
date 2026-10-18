// ============================================================
// src/services/api.js — All Backend API Calls
// ============================================================
// This is the single place where ALL communication with the
// backend lives. No component should ever call fetch() or
// axios directly — they call functions from this file instead.
//
// WHY CENTRALIZE API CALLS?
// If the backend URL ever changes, you update it in ONE place.
// If you want to add request headers or authentication later,
// you update it in ONE place.
// Components stay clean — they just call a function and get data.
//
// We use axios because it:
//   - Automatically converts request/response to JSON
//   - Has cleaner error handling than fetch()
//   - Works consistently across all browsers
// ============================================================

import axios from 'axios';

// Create a reusable axios instance with the base URL.
// All requests made with this instance will automatically
// prepend this base URL.
// The /api prefix matches Vite's proxy config in vite.config.js
const apiClient = axios.create({
  baseURL: '/api', // Vite proxy forwards this to http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 60 second timeout — AI calls can take a while
});

// ── API Function 1: analyzeSources ───────────────────────────
// Sends all sources to the backend for AI analysis.
//
// @param {Array} sources - Array of { title, content } objects
// @returns {Promise<Object>} - The analysis result from backend
//
// Usage in a component:
//   const result = await analyzeSources(sources);
export const analyzeSources = async (sources) => {
  const response = await apiClient.post('/analyze', { sources });
  return response.data;
};

// ── API Function 2: askQuestion ───────────────────────────────
// Sends the user's question + all sources to the backend.
// Returns a source-attributed answer.
//
// @param {Array} sources - The current sources array
// @param {string} question - The user's question
// @returns {Promise<Object>} - { answer, sourcesUsed, relevantExcerpts }
export const askQuestion = async (sources, question) => {
  const response = await apiClient.post('/ask', { sources, question });
  return response.data;
};

// ── API Function 3: analyzePage ──────────────────────────────
// Sends a single URL to the backend for scraping + AI analysis.
// Returns highlights, quiz, and flashcards in one response.
//
// @param {string} url - The full webpage URL to analyze
// @returns {Promise<Object>} - { success, title, wordCount, highlights, quiz, flashcards }
export const analyzePage = async (url) => {
  const response = await apiClient.post('/analyze-page', { url });
  return response.data;
};

// ── API Function 4: checkHealth ───────────────────────────────
// Checks if the backend server is running.
// Useful for debugging connection issues.
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
