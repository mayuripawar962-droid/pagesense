// ============================================================
// src/services/pageAnalysisService.js — AI Analysis Service
// ============================================================
// This file takes the clean text extracted by the scraper and
// sends it to the Google Gemini API to produce three outputs:
//
//   1. highlights  — the most important points from the page
//   2. quiz        — 5 multiple-choice questions
//   3. flashcards  — 5 question-and-answer pairs
//
// All three are requested in a SINGLE Gemini call so the user
// only waits once. The AI returns everything as one JSON object.
//
// EXPORTED FUNCTION:
//   analyzePage({ title, text }) → { highlights, quiz, flashcards }
//
// SDK USED: @google/genai (the official Google Gen AI SDK)
// Docs:     https://googleapis.github.io/js-genai/
// ============================================================

import { GoogleGenAI } from '@google/genai';
import { parseJsonResponse } from '../utils/responseParser.js';

// ── Gemini client factory ─────────────────────────────────────
// A new GoogleGenAI instance is created on every call using the
// key currently in process.env. We intentionally do NOT cache
// the client in a module-level variable.
//
// WHY NO SINGLETON CACHE?
// GoogleGenAI accepts the API key at construction time and stores
// it internally. If the server ever starts with a bad key (e.g.
// a malformed .env entry), a cached client would hold that wrong
// key for the entire lifetime of the process — even after .env
// is corrected — because the cached object is never rebuilt.
// Reading process.env on every call means a server restart is
// sufficient to pick up a corrected key.
const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
      'Open server/.env and replace "your_gemini_api_key_here" with your real key. ' +
      'Get a free key at https://aistudio.google.com/app/apikey'
    );
  }
  return new GoogleGenAI({ apiKey: key });
};

// ── How much text we send to the AI ──────────────────────────
// The scraper already caps text at 15,000 chars. We apply a
// second limit here as a safety net to avoid unexpectedly large
// prompts if this service is ever called directly.
const MAX_INPUT_LENGTH = 12000;

// ============================================================
// MAIN FUNCTION: analyzePage
// ============================================================
// Sends the page title and text to Gemini and returns the three
// structured outputs that the frontend will render.
//
// @param {{ title: string, text: string }} page
//   title — the page's <title> tag value (from the scraper)
//   text  — the cleaned readable text (from the scraper)
//
// @returns {Promise<{
//   highlights: {
//     summary: string,
//     points: string[]
//   },
//   quiz: {
//     questions: Array<{
//       question:      string,
//       options:       string[],
//       correctAnswer: string
//     }>
//   },
//   flashcards: {
//     cards: Array<{
//       question: string,
//       answer:   string
//     }>
//   }
// }>}
// ============================================================
export const analyzePage = async ({ title, text }) => {
  // ── Input validation ──────────────────────────────────────
  if (!text || typeof text !== 'string') {
    throw new Error('No text provided for analysis.');
  }
  if (text.trim().length < 100) {
    throw new Error('The page text is too short to analyze (minimum 100 characters).');
  }

  // Trim to our safety limit
  const inputText = text.length > MAX_INPUT_LENGTH
    ? text.slice(0, MAX_INPUT_LENGTH)
    : text;

  console.log(`🤖 Analyzing page: "${title}" (${inputText.length} chars)`);

  // ── Build the prompt ──────────────────────────────────────
  // Gemini's generateContent API takes a single "contents" string
  // (or array). We combine the system instruction and the user
  // content into one prompt, clearly separated.
  const prompt = buildPrompt(title, inputText);

  // ── Call Gemini ───────────────────────────────────────────
  const rawResponse = await callGemini(prompt);

  // ── Parse and validate the JSON response ─────────────────
  const parsed = parseJsonResponse(rawResponse);
  validateAnalysisResponse(parsed);

  console.log(`✅ Analysis complete for: "${title}"`);

  return parsed;
};

// ============================================================
// HELPER: buildPrompt
// ============================================================
// Combines the system instruction and user content into a single
// prompt string. Gemini handles system instructions and user
// content well when they're clearly separated like this.
// ============================================================
const buildPrompt = (title, text) => `
You are PageSense, an AI that reads a webpage and helps users understand it quickly.
You always respond with a single valid JSON object — no markdown, no code blocks, no extra text.
Every piece of output must be based ONLY on the provided webpage content.
Do not invent facts or add information from outside the page.

You have been given the content of a webpage. Analyze it and produce all three outputs below.

PAGE TITLE: "${title}"

PAGE CONTENT:
---
${text}
---

Return ONLY a valid JSON object with exactly this structure:

{
  "highlights": {
    "summary": "A clear 2-3 sentence paragraph that explains what this page is about and its most important takeaway. Write it so a beginner can understand it.",
    "points": [
      "The single most important point from the page",
      "Second most important point",
      "Third most important point",
      "Fourth most important point",
      "Fifth most important point"
    ]
  },
  "quiz": {
    "questions": [
      {
        "question": "A clear question about an important fact or concept from the page",
        "options": [
          "The correct answer",
          "A plausible but wrong answer",
          "Another plausible but wrong answer",
          "Another plausible but wrong answer"
        ],
        "correctAnswer": "The correct answer"
      }
    ]
  },
  "flashcards": {
    "cards": [
      {
        "question": "A short question that tests understanding of a key concept",
        "answer": "A concise, complete answer in 1-2 sentences"
      }
    ]
  }
}

RULES — follow these exactly:
- highlights.summary must be 2-3 sentences. Plain English. No bullet points inside it.
- highlights.points must have exactly 5 items. Each item is one sentence.
- quiz.questions must have exactly 5 items.
- Each quiz question must have exactly 4 options in the "options" array.
- correctAnswer must be an EXACT copy of one of the strings in the "options" array.
- The correct option should not always be the first one — vary its position across questions.
- flashcards.cards must have exactly 5 items.
- Flashcard answers must be self-contained (readable without the question).
- All content must come ONLY from the provided page. Do not add outside knowledge.
- Respond with ONLY the JSON object. No markdown, no code blocks, no extra explanation.
`;

// ============================================================
// HELPER: callGemini
// ============================================================
// Makes the actual API call to Google Gemini.
// Uses ai.models.generateContent from the @google/genai SDK.
//
// responseMimeType: 'application/json' tells Gemini to return
// pure JSON, which reduces the chance it wraps the output in
// markdown code fences.
//
// RETRY STRATEGY:
//   - Up to 3 attempts on the primary model with exponential
//     backoff (2s → 4s → 8s) for transient 503/500 errors.
//   - If the primary model is still unavailable after all
//     retries, one final attempt is made on the fallback model.
//   - Non-retryable errors (400, 401, 403, 404) are thrown
//     immediately — retrying them would never help.
// ============================================================
const callGemini = async (prompt) => {
  // Primary model from .env; fallback is the next lightest stable model.
  const primaryModel  = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.5-flash-lite';

  // Exponential backoff delays in milliseconds (2s, 4s, 8s)
  const MAX_RETRIES = 3;
  const DELAYS      = [2000, 4000, 8000];

  // ── Helper: is this error worth retrying? ────────────────
  // Only retry server-side transient errors (5xx) and rate
  // limits (429). Client errors (4xx except 429) mean the
  // request itself is wrong — retrying won't fix that.
  const isRetryable = (error) => {
    const status =
      error?.status ??
      error?.code ??
      error?.response?.status;

    if (typeof status !== 'number') return false;
    return status === 429 || status === 408 || status >= 500;
  };

  // ── Helper: single attempt against a named model ─────────
  const attempt = async (model) => {
    console.log(`🤖 Calling Gemini model: ${model}`);
    const response = await getGemini().models.generateContent({
      model,
      contents: prompt,
      config: {
        // Ask Gemini to return raw JSON (no markdown wrapping)
        responseMimeType: 'application/json',
        // Low temperature = focused, consistent, factual output
        temperature: 0.2,
      },
    });
    return response.text;
  };

  // ── Retry loop on primary model ───────────────────────────
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await attempt(primaryModel);
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        // Non-transient error — no point retrying.
        throw error;
      }

      const delay = DELAYS[i];
      console.warn(
        `⚠️  Gemini (${primaryModel}) returned a transient error ` +
        `(attempt ${i + 1}/${MAX_RETRIES}). Retrying in ${delay / 1000}s…`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // ── Fallback model (one attempt, no further retries) ──────
  // Only reached if the primary model failed all retries with
  // transient errors. We try the fallback once so the user
  // still gets a result rather than a hard failure.
  if (fallbackModel && fallbackModel !== primaryModel) {
    try {
      console.warn(
        `⚠️  Primary model (${primaryModel}) unavailable after ` +
        `${MAX_RETRIES} attempts. Trying fallback: ${fallbackModel}`
      );
      return await attempt(fallbackModel);
    } catch (fallbackError) {
      // If the fallback also fails, throw the original primary error
      // because it has more context about the root cause.
      console.error(`❌ Fallback model (${fallbackModel}) also failed.`);
      throw lastError;
    }
  }

  // No fallback configured — surface the last primary error.
  throw lastError;
};

// ============================================================
// HELPER: validateAnalysisResponse
// ============================================================
// After parsing the JSON, we check that all required fields
// are present and have the right shapes. This catches cases
// where the AI returns valid JSON but with missing sections.
//
// We throw descriptive errors so it's easy to debug if the
// AI starts returning unexpected formats.
// ============================================================
const validateAnalysisResponse = (data) => {
  // ── highlights ────────────────────────────────────────────
  if (!data.highlights) {
    throw new Error('AI response is missing the "highlights" section.');
  }
  if (typeof data.highlights.summary !== 'string' || !data.highlights.summary.trim()) {
    throw new Error('AI response is missing "highlights.summary".');
  }
  if (!Array.isArray(data.highlights.points) || data.highlights.points.length === 0) {
    throw new Error('AI response is missing "highlights.points" array.');
  }

  // ── quiz ──────────────────────────────────────────────────
  if (!data.quiz) {
    throw new Error('AI response is missing the "quiz" section.');
  }
  if (!Array.isArray(data.quiz.questions) || data.quiz.questions.length === 0) {
    throw new Error('AI response is missing "quiz.questions" array.');
  }

  // Validate each quiz question's shape
  data.quiz.questions.forEach((q, i) => {
    if (typeof q.question !== 'string') {
      throw new Error(`quiz.questions[${i}] is missing the "question" field.`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`quiz.questions[${i}] must have exactly 4 options.`);
    }
    if (!q.options.includes(q.correctAnswer)) {
      throw new Error(
        `quiz.questions[${i}]: "correctAnswer" does not match any of the options.`
      );
    }
  });

  // ── flashcards ────────────────────────────────────────────
  if (!data.flashcards) {
    throw new Error('AI response is missing the "flashcards" section.');
  }
  if (!Array.isArray(data.flashcards.cards) || data.flashcards.cards.length === 0) {
    throw new Error('AI response is missing "flashcards.cards" array.');
  }

  // Validate each flashcard's shape
  data.flashcards.cards.forEach((card, i) => {
    if (typeof card.question !== 'string' || !card.question.trim()) {
      throw new Error(`flashcards.cards[${i}] is missing the "question" field.`);
    }
    if (typeof card.answer !== 'string' || !card.answer.trim()) {
      throw new Error(`flashcards.cards[${i}] is missing the "answer" field.`);
    }
  });
};
