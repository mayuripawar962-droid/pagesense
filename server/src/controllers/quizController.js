// ============================================================
// src/controllers/quizController.js — Quiz Endpoints
// ============================================================
// Handles generating quizzes, retrieving them, and scoring answers.
//
//   generateQuiz → POST /api/quiz/generate
//                  AI generates 5 MCQ questions from sources
//
//   getQuiz      → GET  /api/quiz/:projectId
//                  Retrieve saved quiz from a project
//
//   submitQuiz   → POST /api/quiz/:projectId/submit
//                  Score the user's answers (no AI needed — pure logic)
//
// Supports STATELESS and STATEFUL mode.
// ============================================================

import { generateQuiz as generateQuizAI } from '../services/openaiService.js';
import { createError } from '../middleware/errorHandler.js';
import { getDBStatus } from '../config/db.js';
import Project from '../models/Project.js';

// ============================================================
// POST /api/quiz/generate
// Generate a 5-question multiple-choice quiz from sources
// ============================================================
// STATELESS — body: { sources: [{ title, content }, ...] }
// STATEFUL  — body: { projectId }
//
// Returns: { success, count, questions: [...] }
// NOTE: correctAnswer IS included in the response here.
// The frontend should only reveal it AFTER the user submits.
export const generateQuizHandler = async (req, res, next) => {
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
      if (project.sources.length < 1) {
        throw createError(400, 'Project has no sources. Add sources before generating a quiz.');
      }

      sources = project.sources;

    } else {
      // ── STATELESS ──────────────────────────────────────
      sources = req.body.sources;

      if (!sources || !Array.isArray(sources) || sources.length < 1) {
        throw createError(
          400,
          'Provide either { projectId } or { sources: [...] } to generate a quiz.'
        );
      }

      for (let i = 0; i < sources.length; i++) {
        const s = sources[i];
        if (!s.title?.trim())   throw createError(400, `Source ${i + 1} is missing a title.`);
        if (!s.content?.trim()) throw createError(400, `Source ${i + 1} is missing content.`);
      }
    }

    console.log(`📝 Generating quiz from ${sources.length} source(s)...`);

    const result = await generateQuizAI(sources);
    const questions = result.questions || [];

    if (questions.length === 0) {
      throw createError(500, 'AI did not return any quiz questions. Please try again.');
    }

    // Save quiz to project if in stateful mode
    if (project) {
      project.quiz.questions   = questions;
      project.quiz.isGenerated = true;
      await project.save();
      console.log(`💾 Saved ${questions.length} quiz questions to project.`);
    }

    res.status(200).json({
      success:   true,
      count:     questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET /api/quiz/:projectId
// Retrieve a previously saved quiz from a project
// ============================================================
// URL param: :projectId
// Returns:   { success, isGenerated, count, questions }
export const getQuiz = async (req, res, next) => {
  try {
    if (!getDBStatus()) {
      throw createError(503, 'Database not connected.');
    }

    const project = await Project.findById(req.params.projectId)
      .select('quiz title');

    if (!project) throw createError(404, 'Project not found.');

    if (!project.quiz.isGenerated) {
      return res.status(200).json({
        success:     true,
        isGenerated: false,
        count:       0,
        questions:   [],
        message:     'No quiz has been generated for this project yet.',
      });
    }

    res.status(200).json({
      success:      true,
      isGenerated:  project.quiz.isGenerated,
      projectTitle: project.title,
      count:        project.quiz.questions.length,
      questions:    project.quiz.questions,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// POST /api/quiz/submit
// Score the user's answers — pure logic, no AI needed
// ============================================================
// STATELESS — body: { questions: [...], answers: { "0": "answer", "1": "answer" } }
// STATEFUL  — body: { projectId, answers: { "0": "answer", "1": "answer" } }
//
// answers is an object where:
//   key   = question index as a string ("0", "1", "2" ...)
//   value = the full text of the option the user selected
//
// Returns: {
//   success, totalQuestions, correctCount, score, percentage,
//   results: [{ questionIndex, question, userAnswer, correctAnswer,
//               isCorrect, explanation }]
// }
export const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      throw createError(400, 'Answers are required. Send { answers: { "0": "selected option", ... } }');
    }

    let questions;

    if (req.body.projectId) {
      // ── STATEFUL ───────────────────────────────────────
      if (!getDBStatus()) {
        throw createError(503, 'Database not connected.');
      }

      const project = await Project.findById(req.body.projectId).select('quiz');
      if (!project) throw createError(404, 'Project not found.');
      if (!project.quiz.isGenerated || project.quiz.questions.length === 0) {
        throw createError(400, 'No quiz found for this project. Generate a quiz first.');
      }

      questions = project.quiz.questions;

    } else {
      // ── STATELESS ──────────────────────────────────────
      questions = req.body.questions;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw createError(
          400,
          'Provide either { projectId } or { questions: [...] } along with answers.'
        );
      }
    }

    // ── Score the answers ─────────────────────────────────
    // Compare each user answer against the correct answer.
    // We use case-insensitive trimmed comparison to be forgiving
    // of minor formatting differences.
    let correctCount = 0;

    const results = questions.map((q, index) => {
      const userAnswer    = (answers[String(index)] || '').trim();
      const correctAnswer = (q.correctAnswer || '').trim();
      const isCorrect     = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) correctCount++;

      return {
        questionIndex:  index,
        question:       q.question,
        userAnswer:     userAnswer || 'Not answered',
        correctAnswer,
        isCorrect,
        explanation:    q.explanation || '',
        sourceTitle:    q.sourceTitle || '',
      };
    });

    const totalQuestions = questions.length;
    const percentage     = Math.round((correctCount / totalQuestions) * 100);

    // ── Performance message ───────────────────────────────
    let performanceMessage;
    if (percentage === 100)      performanceMessage = 'Perfect score! Outstanding work.';
    else if (percentage >= 80)   performanceMessage = 'Excellent! You have a strong grasp of the material.';
    else if (percentage >= 60)   performanceMessage = 'Good job! Review the missed questions to strengthen your understanding.';
    else if (percentage >= 40)   performanceMessage = 'Keep going! Re-read the sources and try again.';
    else                         performanceMessage = 'Keep studying! Review the sources carefully and try again.';

    res.status(200).json({
      success:            true,
      totalQuestions,
      correctCount,
      score:              `${correctCount}/${totalQuestions}`,
      percentage,
      performanceMessage,
      results,
    });
  } catch (error) {
    next(error);
  }
};
