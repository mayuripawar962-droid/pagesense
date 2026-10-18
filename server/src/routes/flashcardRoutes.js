// ============================================================
// src/routes/flashcardRoutes.js — Flashcard Routes
// ============================================================
// All routes here are prefixed with /api/flashcards in server.js
//
// ROUTE OVERVIEW:
//   POST /api/flashcards/generate          → generate flashcards from sources
//   GET  /api/flashcards/:projectId        → get saved flashcards from a project
// ============================================================

import express from 'express';
import {
  generateFlashcardsHandler,
  getFlashcards,
} from '../controllers/flashcardController.js';
import { validateMongoId } from '../middleware/validateMongoId.js';

const router = express.Router();

// Generate flashcards (stateless or stateful)
router.post('/generate', generateFlashcardsHandler);

// Get saved flashcards from a project
router.get('/:projectId', validateMongoId('projectId'), getFlashcards);

export default router;
