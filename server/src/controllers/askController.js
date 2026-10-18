// ============================================================
// src/controllers/askController.js — Ask Endpoint Logic
// ============================================================
// When a request arrives at POST /api/ask, this function runs.
//
// Its job:
//   1. Read the sources and question from the request body
//   2. Validate the input
//   3. Call the OpenAI service for a source-grounded answer
//   4. Send the answer with source attributions back to React
// ============================================================

import { askAcrossSources } from '../services/openaiService.js';
import { createError } from '../middleware/errorHandler.js';

// ── POST /api/ask ────────────────────────────────────────────
// Expected request body:
// {
//   sources: [
//     { title: "Article Title", content: "Full text..." },
//     ...
//   ],
//   question: "What do the sources say about water scarcity?"
// }
export const askQuestion = async (req, res, next) => {
  try {
    const { sources, question } = req.body;

    // ── Input Validation ─────────────────────────────────────
    if (!sources || !Array.isArray(sources) || sources.length < 1) {
      throw createError(400, 'Request must include at least one source.');
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      throw createError(400, 'Request must include a question.');
    }

    if (question.trim().length < 5) {
      throw createError(400, 'Please ask a more complete question.');
    }

    if (question.trim().length > 500) {
      throw createError(400, 'Question is too long. Please keep it under 500 characters.');
    }

    console.log(`❓ Question received: "${question.trim()}"`);

    // ── Call AI Service ───────────────────────────────────────
    const result = await askAcrossSources(sources, question.trim());

    // ── Send Response ─────────────────────────────────────────
    res.status(200).json({
      success: true,
      question: question.trim(),
      ...result, // spreads: answer, sourcesUsed, relevantExcerpts
    });

  } catch (error) {
    next(error);
  }
};
