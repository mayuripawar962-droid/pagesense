// ============================================================
// src/routes/scrapeRoutes.js — Scraper Route
// ============================================================
// Registers the single scrape endpoint:
//
//   POST /api/scrape
//   Body: { "url": "https://example.com/article" }
//
// This is the only route in this file. It calls scrapeUrl()
// from the scraper service and returns the result as JSON.
// ============================================================

import express from 'express';
import { scrapeUrl } from '../services/scraperService.js';

const router = express.Router();

// ── POST /api/scrape ─────────────────────────────────────────
// Accepts a URL in the request body, fetches the webpage, and
// returns the extracted title and clean text.
//
// Request body:  { "url": "https://..." }
// Success response:
//   {
//     "success": true,
//     "title":     "Page title from <title> tag",
//     "text":      "Clean readable article text...",
//     "wordCount": 847
//   }
//
// Error response (handled by errorHandler middleware):
//   { "success": false, "message": "Descriptive error message" }
router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;

    // Basic check — the scrapeUrl function validates further
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a "url" field in the request body.',
      });
    }

    const result = await scrapeUrl(url);

    res.status(200).json({
      success:   true,
      title:     result.title,
      text:      result.text,
      wordCount: result.wordCount,
    });

  } catch (error) {
    // Pass the error to Express's global error handler
    // (defined in src/middleware/errorHandler.js)
    next(error);
  }
});

export default router;
