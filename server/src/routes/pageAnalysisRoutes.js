// ============================================================
// src/routes/pageAnalysisRoutes.js — Page Analysis Route
// ============================================================
// Registers one endpoint:
//
//   POST /api/analyze-page
//
// This is the single entry point for the full PageSense flow:
//   1. Accept a URL from the frontend
//   2. Scrape the page (scraperService)
//   3. Analyze the text with AI (pageAnalysisService)
//   4. Return highlights, quiz, and flashcards as JSON
//
// WHY COMBINE SCRAPE + ANALYZE HERE?
// The frontend only needs to send one request and get one
// response. This route acts as the "orchestrator" — it calls
// the scraper and the AI service in sequence, then assembles
// the final response. Each service still does only one job.
// ============================================================

import express from 'express';
import { scrapeUrl }    from '../services/scraperService.js';
import { analyzePage }  from '../services/pageAnalysisService.js';

const router = express.Router();

// ── POST /api/analyze-page ────────────────────────────────────
//
// Request body:
//   { "url": "https://example.com/some-article" }
//
// Success response (HTTP 200):
//   {
//     "success": true,
//     "url":       "https://example.com/some-article",
//     "title":     "Article Title from the Page",
//     "wordCount": 1234,
//     "highlights": {
//       "summary": "2-3 sentence overview...",
//       "points":  ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
//     },
//     "quiz": {
//       "questions": [
//         {
//           "question":      "Question text?",
//           "options":       ["A", "B", "C", "D"],
//           "correctAnswer": "A"
//         },
//         ... (5 total)
//       ]
//     },
//     "flashcards": {
//       "cards": [
//         { "question": "...", "answer": "..." },
//         ... (5 total)
//       ]
//     }
//   }
//
// Error response (HTTP 4xx / 5xx):
//   { "success": false, "message": "Descriptive error message" }
router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;

    // ── Validate input ──────────────────────────────────────
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a "url" field in the request body.',
      });
    }

    const cleanUrl = url.trim();

    // ── Step 1: Scrape the webpage ──────────────────────────
    // scrapeUrl fetches the page and returns clean text.
    // If the URL is unreachable or the page has no readable text,
    // it throws an error that gets caught below.
    console.log(`\n📥 New request: ${cleanUrl}`);
    const { title, text, wordCount } = await scrapeUrl(cleanUrl);

    // ── Step 2: Analyze with AI ─────────────────────────────
    // analyzePage sends the text to OpenAI and returns the
    // three structured outputs.
    const analysis = await analyzePage({ title, text });

    // ── Step 3: Send the combined response ──────────────────
    // We include the url, title, and wordCount alongside the AI
    // analysis so the frontend has everything it needs.
    res.status(200).json({
      success:    true,
      url:        cleanUrl,
      title,
      wordCount,
      highlights: analysis.highlights,
      quiz:       analysis.quiz,
      flashcards: analysis.flashcards,
    });

  } catch (error) {
    // Forward to the global error handler in errorHandler.js
    next(error);
  }
});

export default router;
