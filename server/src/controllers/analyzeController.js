// ============================================================
// src/controllers/analyzeController.js — All Analysis Endpoints
// ============================================================
// This controller handles every AI analysis operation:
//
//   analyzeOne     → POST /api/analyze/source
//                    Analyze one individual source
//
//   analyzeAll     → POST /api/analyze/combined
//                    Cross-source combined analysis of all sources
//
//   askQuestion    → POST /api/analyze/ask
//                    Answer a question grounded in provided sources
//
// STATELESS vs STATEFUL:
// Every endpoint works in TWO modes:
//
//   STATELESS (no projectId provided):
//   - React sends sources directly in the request body
//   - AI analyzes them and returns results
//   - Nothing is saved to the database
//   - This works even without MongoDB running
//   - Perfect for the MVP and testing
//
//   STATEFUL (projectId provided):
//   - React sends a projectId
//   - Controller loads the project from MongoDB
//   - AI analyzes the sources from the database
//   - Results are saved back to the project document
//   - Requires MongoDB to be connected
//
// The frontend can use whichever mode is appropriate.
// ============================================================

import {
  analyzeSingleSource,
  analyzeMultipleSources,
  askAcrossSources,
} from '../services/openaiService.js';
import { createError } from '../middleware/errorHandler.js';
import { getDBStatus } from '../config/db.js';
import Project from '../models/Project.js';

// ============================================================
// POST /api/analyze/source
// Analyze a single source individually
// ============================================================
// STATELESS mode — body: { source: { title, content } }
// STATEFUL mode  — body: { projectId, sourceId }
//
// Returns: { success, analysis: { summary, keyFindings, keyTerms } }
export const analyzeOne = async (req, res, next) => {
  try {
    let source;

    if (req.body.projectId && req.body.sourceId) {
      // ── STATEFUL: load from database ───────────────────
      if (!getDBStatus()) {
        throw createError(503, 'Database not connected. Use stateless mode by providing source directly.');
      }

      const project = await Project.findById(req.body.projectId);
      if (!project) throw createError(404, 'Project not found.');

      source = project.sources.id(req.body.sourceId);
      if (!source) throw createError(404, 'Source not found in this project.');

      console.log(`🔍 Analyzing source: "${source.title}" (from project)`);

      const analysis = await analyzeSingleSource(source);

      // Save the analysis result back to the source in the database
      source.analysis = analysis;
      await project.save();

      return res.status(200).json({
        success:  true,
        sourceId: req.body.sourceId,
        analysis,
      });

    } else {
      // ── STATELESS: source provided directly in body ────
      source = req.body.source;

      if (!source || !source.title || !source.content) {
        throw createError(
          400,
          'Provide either { source: { title, content } } for stateless mode, or { projectId, sourceId } for stateful mode.'
        );
      }
      if (source.content.trim().length < 100) {
        throw createError(400, 'Source content is too short. Paste at least a paragraph.');
      }
      if (source.content.length > 15000) {
        throw createError(400, 'Source content is too long. Max 15,000 characters per source.');
      }

      console.log(`🔍 Analyzing source: "${source.title}" (stateless)`);

      const analysis = await analyzeSingleSource(source);

      return res.status(200).json({
        success:  true,
        analysis,
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/analyze/combined
// Run cross-source analysis across ALL sources
// ============================================================
// STATELESS mode — body: { sources: [{ title, content }, ...] }
// STATEFUL mode  — body: { projectId }
//
// Returns: {
//   success,
//   sourceCount,
//   analysis: {
//     combinedSummary,
//     commonFindings,
//     conflictingPoints,
//     uniqueInsights,
//     viewpoints
//   }
// }
export const analyzeAll = async (req, res, next) => {
  try {
    let sources;
    let project = null;

    if (req.body.projectId) {
      // ── STATEFUL ───────────────────────────────────────
      if (!getDBStatus()) {
        throw createError(503, 'Database not connected. Provide sources directly for stateless mode.');
      }

      project = await Project.findById(req.body.projectId);
      if (!project) throw createError(404, 'Project not found.');

      sources = project.sources;

      if (sources.length < 2) {
        throw createError(400, 'Project needs at least 2 sources for combined analysis.');
      }

    } else {
      // ── STATELESS ──────────────────────────────────────
      sources = req.body.sources;

      if (!sources || !Array.isArray(sources)) {
        throw createError(400, 'Provide either { projectId } or { sources: [...] }.');
      }
      if (sources.length < 2) {
        throw createError(400, 'PageSense requires at least 2 sources for combined analysis.');
      }
      if (sources.length > 6) {
        throw createError(400, 'Maximum 6 sources allowed per analysis.');
      }

      // Validate each source
      for (let i = 0; i < sources.length; i++) {
        const s = sources[i];
        if (!s.title?.trim())              throw createError(400, `Source ${i + 1} is missing a title.`);
        if (!s.content?.trim())            throw createError(400, `Source ${i + 1} is missing content.`);
        if (s.content.trim().length < 100) throw createError(400, `Source ${i + 1} content is too short.`);
        if (s.content.length > 15000)      throw createError(400, `Source ${i + 1} content is too long.`);
      }
    }

    console.log(`📚 Running combined analysis on ${sources.length} sources...`);

    const analysis = await analyzeMultipleSources(sources);

    // Save to project if in stateful mode
    if (project) {
      project.combinedAnalysis = analysis;
      project.isAnalyzed = true;
      await project.save();
    }

    res.status(200).json({
      success:     true,
      sourceCount: sources.length,
      sourceTitles: sources.map((s) => s.title),
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/analyze/ask
// Answer a question grounded in the provided sources
// ============================================================
// STATELESS mode — body: { sources: [...], question }
// STATEFUL mode  — body: { projectId, question }
//
// Returns: {
//   success,
//   question,
//   answer,
//   sourcesUsed,
//   relevantExcerpts
// }
export const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;

    // Validate question (same for both modes)
    if (!question || !question.trim()) {
      throw createError(400, 'A question is required.');
    }
    if (question.trim().length < 5) {
      throw createError(400, 'Please ask a more complete question.');
    }
    if (question.trim().length > 500) {
      throw createError(400, 'Question is too long. Please keep it under 500 characters.');
    }

    let sources;
    let project = null;

    if (req.body.projectId) {
      // ── STATEFUL ───────────────────────────────────────
      if (!getDBStatus()) {
        throw createError(503, 'Database not connected. Provide sources directly for stateless mode.');
      }

      project = await Project.findById(req.body.projectId);
      if (!project) throw createError(404, 'Project not found.');
      if (project.sources.length < 1) throw createError(400, 'Project has no sources to ask about.');

      sources = project.sources;

    } else {
      // ── STATELESS ──────────────────────────────────────
      sources = req.body.sources;

      if (!sources || !Array.isArray(sources) || sources.length < 1) {
        throw createError(400, 'Provide either { projectId } or { sources: [...] } along with the question.');
      }
    }

    console.log(`❓ Question: "${question.trim()}" across ${sources.length} sources`);

    const result = await askAcrossSources(sources, question.trim());

    // Save Q&A to project history if in stateful mode
    if (project) {
      project.qaHistory.push({
        question:         question.trim(),
        answer:           result.answer,
        sourcesUsed:      result.sourcesUsed      || [],
        relevantExcerpts: result.relevantExcerpts || [],
      });
      await project.save();
    }

    res.status(200).json({
      success:  true,
      question: question.trim(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
