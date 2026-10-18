// ============================================================
// src/routes/analyzeRoutes.js — Analysis Routes
// ============================================================
// All routes here are prefixed with /api/analyze in server.js
//
// ROUTE OVERVIEW:
//   POST /api/analyze/source    → analyze one individual source
//   POST /api/analyze/combined  → cross-source combined analysis
//   POST /api/analyze/ask       → ask a question across sources
// ============================================================

import express from 'express';
import {
  analyzeOne,
  analyzeAll,
  askQuestion,
} from '../controllers/analyzeController.js';

const router = express.Router();

// Analyze a single source (individual summary + key terms)
router.post('/source',   analyzeOne);

// Run full cross-source combined analysis
router.post('/combined', analyzeAll);

// Ask a question grounded in the provided sources
router.post('/ask',      askQuestion);

export default router;
