// ============================================================
// src/routes/quizRoutes.js — Quiz Routes
// ============================================================
// All routes here are prefixed with /api/quiz in server.js
//
// ROUTE OVERVIEW:
//   POST /api/quiz/generate           → generate quiz from sources
//   POST /api/quiz/submit             → score the user's answers (stateless)
//   GET  /api/quiz/:projectId         → get saved quiz from a project
//   POST /api/quiz/:projectId/submit  → score answers (stateful, from project)
// ============================================================

import express from 'express';
import {
  generateQuizHandler,
  getQuiz,
  submitQuiz,
} from '../controllers/quizController.js';
import { validateMongoId } from '../middleware/validateMongoId.js';

const router = express.Router();

// Generate a quiz (stateless or stateful)
router.post('/generate', generateQuizHandler);

// Submit answers for scoring — stateless version
// body: { questions: [...], answers: { "0": "...", "1": "..." } }
router.post('/submit', submitQuiz);

// Get saved quiz from a project
router.get('/:projectId', validateMongoId('projectId'), getQuiz);

// Submit answers for scoring — stateful version (uses saved project quiz)
// body: { projectId: "...", answers: { "0": "...", "1": "..." } }
router.post('/:projectId/submit', validateMongoId('projectId'), submitQuiz);

export default router;
