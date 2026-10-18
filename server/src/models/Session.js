// ============================================================
// src/models/Session.js — Research Session Data Schema
// ============================================================
// A "model" in Mongoose defines the SHAPE of data stored in
// MongoDB. Think of it like a form template — it describes
// what fields every research session document must have.
//
// This is used in Phase 2 when we add save/load session feature.
// For MVP, you don't need to call this model yet — but having
// it here keeps the project ready to grow.
// ============================================================

import mongoose from 'mongoose';

// ── Source Sub-Schema ────────────────────────────────────────
// Each research session contains multiple sources.
// This defines what one source looks like.
const sourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true, // removes leading/trailing whitespace automatically
  },
  content: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
});

// ── Q&A History Sub-Schema ───────────────────────────────────
// Stores the history of questions asked in a session.
const qaEntrySchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  sourcesUsed: [String], // array of source titles that supported the answer
  askedAt: { type: Date, default: Date.now },
});

// ── Main Session Schema ──────────────────────────────────────
// This is the complete shape of one research session document.
const sessionSchema = new mongoose.Schema(
  {
    sessionTitle: {
      type: String,
      default: 'Untitled Research Session',
      trim: true,
    },

    // Array of source objects — each has title, content, wordCount
    sources: [sourceSchema],

    // The AI-generated analysis results
    analysis: {
      combinedSummary: { type: String, default: '' },
      commonFindings: [String],     // array of finding strings
      conflictingPoints: [String],  // array of conflict strings
      uniqueInsights: {
        type: Map,                  // Map allows dynamic keys (source titles)
        of: [String],               // each key maps to an array of insight strings
      },
      viewpoints: [String],         // different perspectives identified
    },

    // Array of question-answer pairs from the session
    qaHistory: [qaEntrySchema],
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Export the model so controllers can use it to save/find sessions
export default mongoose.model('Session', sessionSchema);
