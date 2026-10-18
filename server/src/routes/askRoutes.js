// ============================================================
// src/routes/askRoutes.js — Ask API Routes
// ============================================================
// Connects POST /api/ask to the askQuestion controller.
// ============================================================

import express from 'express';
import { askQuestion } from '../controllers/askController.js';

const router = express.Router();

// POST /api/ask
// Body: { sources: [...], question: "..." }
// Returns: { success, question, answer, sourcesUsed, relevantExcerpts }
router.post('/', askQuestion);

export default router;
