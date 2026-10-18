// ============================================================
// src/controllers/flashcardController.js — Flashcard Endpoints
// ============================================================
// Handles generating and retrieving flashcards.
//
//   generateFlashcards → POST /api/flashcards/generate
//                        AI generates flashcards from sources
//
//   getFlashcards      → GET  /api/flashcards/:projectId
//                        Get saved flashcards from a project
//
// Supports STATELESS and STATEFUL mode (same pattern as analyzeController).
// ============================================================

import { generateFlashcards as generateFlashcardsAI } from '../services/openaiService.js';
import { createError } from '../middleware/errorHandler.js';
import { getDBStatus } from '../config/db.js';
import Project from '../models/Project.js';

// ============================================================
// POST /api/flashcards/generate
// Generate flashcards from sources using AI
// ============================================================
// STATELESS — body: { sources: [{ title, content }, ...] }
// STATEFUL  — body: { projectId }
//
// Returns: { success, count, flashcards: [{ question, answer, sourceTitle }] }
export const generateFlashcardsHandler = async (req, res, next) => {
  try {
    let sources;
    let project = null;

    if (req.body.projectId) {
      // ── STATEFUL: load sources from database ───────────
      if (!getDBStatus()) {
        throw createError(503, 'Database not connected. Provide sources directly for stateless mode.');
      }

      project = await Project.findById(req.body.projectId);
      if (!project) throw createError(404, 'Project not found.');
      if (project.sources.length < 1) {
        throw createError(400, 'Project has no sources. Add sources before generating flashcards.');
      }

      sources = project.sources;

    } else {
      // ── STATELESS: sources provided directly ──────────
      sources = req.body.sources;

      if (!sources || !Array.isArray(sources) || sources.length < 1) {
        throw createError(
          400,
          'Provide either { projectId } or { sources: [...] } to generate flashcards.'
        );
      }

      // Validate each source
      for (let i = 0; i < sources.length; i++) {
        const s = sources[i];
        if (!s.title?.trim())  throw createError(400, `Source ${i + 1} is missing a title.`);
        if (!s.content?.trim()) throw createError(400, `Source ${i + 1} is missing content.`);
      }
    }

    console.log(`🃏 Generating flashcards from ${sources.length} source(s)...`);

    const result = await generateFlashcardsAI(sources);
    const flashcards = result.flashcards || [];

    if (flashcards.length === 0) {
      throw createError(500, 'AI did not return any flashcards. Please try again.');
    }

    // Save flashcards to project if in stateful mode
    if (project) {
      project.flashcards = flashcards;
      await project.save();
      console.log(`💾 Saved ${flashcards.length} flashcards to project.`);
    }

    res.status(200).json({
      success:    true,
      count:      flashcards.length,
      flashcards,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/flashcards/:projectId
// Get previously saved flashcards from a project
// ============================================================
// URL param: :projectId
// Returns:   { success, count, flashcards }
export const getFlashcards = async (req, res, next) => {
  try {
    if (!getDBStatus()) {
      throw createError(503, 'Database not connected. Flashcards can only be retrieved when MongoDB is running.');
    }

    const project = await Project.findById(req.params.projectId)
      .select('flashcards title');

    if (!project) throw createError(404, 'Project not found.');

    res.status(200).json({
      success:      true,
      projectTitle: project.title,
      count:        project.flashcards.length,
      flashcards:   project.flashcards,
    });
  } catch (error) {
    next(error);
  }
};
