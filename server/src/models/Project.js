// ============================================================
// src/models/Project.js — The Complete PageSense Data Schema
// ============================================================
//
// WHAT IS A MONGOOSE MODEL?
// Think of it as a blueprint (or template) for your data.
// Every research project stored in MongoDB must match this
// blueprint exactly. Mongoose enforces the rules automatically.
//
// DESIGN DECISION — ONE COLLECTION, ONE DOCUMENT:
// Everything for one research project is stored in ONE document:
//   - The project title and description
//   - All sources the user added (title + content)
//   - AI-generated individual source summaries
//   - Combined research analysis (summary, findings, conflicts)
//   - Q&A history (questions + source-attributed answers)
//   - Generated flashcards
//   - Generated quiz (questions + answers)
//
// WHY EMBED instead of separate collections?
// Because all this data ALWAYS belongs to ONE project and is
// ALWAYS fetched together. Embedding keeps it simple and fast.
//
// SEPARATE COLLECTIONS added later:
//   - users (when you add accounts)
//   - At that point, add userId field to this schema
// ============================================================

import mongoose from 'mongoose';

// ============================================================
// SUB-SCHEMA 1: Key Term
// ============================================================
// Represents one important term/concept identified by the AI
// in an individual source.
// Example: { term: "Photosynthesis", explanation: "The process by which..." }
const keyTermSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false }); // _id: false means don't create an _id for each sub-item
// We use _id: false on small sub-documents that don't need
// their own unique ID — keeps the data cleaner.

// ============================================================
// SUB-SCHEMA 2: Individual Source Analysis
// ============================================================
// The AI analysis of ONE single source.
// Each source gets its own summary, key findings, and key terms.
const sourceAnalysisSchema = new mongoose.Schema({
  summary: {
    type: String,
    default: '',
    // A 2-4 sentence summary of just this one source
  },
  keyFindings: {
    type: [String], // Array of finding strings
    default: [],
    // The most important points from this source
  },
  keyTerms: {
    type: [keyTermSchema], // Array of { term, explanation } objects
    default: [],
    // Important concepts with simple explanations
  },
}, { _id: false });

// ============================================================
// SUB-SCHEMA 3: Source
// ============================================================
// One research source added by the user.
// Contains the raw content AND the AI analysis of that source.
const sourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Source title is required'],
    trim: true,
    maxlength: [200, 'Source title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Source content is required'],
    minlength: [100, 'Source content must be at least 100 characters'],
    maxlength: [15000, 'Source content cannot exceed 15,000 characters'],
  },
  wordCount: {
    type: Number,
    default: 0,
    // Calculated from content when source is added
  },
  // The AI analysis of this individual source
  // null means analysis hasn't been run for this source yet
  analysis: {
    type: sourceAnalysisSchema,
    default: null,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});
// Note: sourceSchema DOES get an _id (the default).
// This lets us identify and remove individual sources by their ID.

// ============================================================
// SUB-SCHEMA 4: Q&A Entry
// ============================================================
// One question asked by the user + the AI answer + source attribution.
const qaEntrySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters'],
  },
  answer: {
    type: String,
    required: true,
    // The AI-generated answer grounded in the provided sources
  },
  sourcesUsed: {
    type: [String],
    default: [],
    // Array of source TITLES that the AI used to answer this question
    // Example: ["NASA Report", "WHO Study 2023"]
  },
  relevantExcerpts: {
    type: [{
      sourceTitle: String,
      excerpt: String,
    }],
    default: [],
    // Direct quotes from sources that support the answer
  },
  askedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================================
// SUB-SCHEMA 5: Flashcard
// ============================================================
// One flashcard = one question + one answer.
// Generated from the key concepts in all sources.
const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    // The "front" of the card — what you're asked
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    // The "back" of the card — the correct explanation
  },
  sourceTitle: {
    type: String,
    default: '',
    // Which source this concept came from (for attribution)
  },
}, { _id: false });

// ============================================================
// SUB-SCHEMA 6: Quiz Question
// ============================================================
// One multiple-choice quiz question with 4 options.
const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'Each quiz question must have exactly 4 options',
    },
    // Always exactly 4 choices: ["Option A", "Option B", "Option C", "Option D"]
  },
  correctAnswer: {
    type: String,
    required: true,
    // The full text of the correct option (not just A/B/C/D index)
    // This makes it easy to compare on the frontend
  },
  explanation: {
    type: String,
    default: '',
    // Why this answer is correct — shown after the user answers
  },
  sourceTitle: {
    type: String,
    default: '',
    // Which source this question came from
  },
}, { _id: false });

// ============================================================
// SUB-SCHEMA 7: Combined Analysis
// ============================================================
// The cross-source AI analysis — the core feature of PageSense.
// This is generated when the user clicks "Analyze All Sources".
const combinedAnalysisSchema = new mongoose.Schema({
  combinedSummary: {
    type: String,
    default: '',
    // A synthesized summary across ALL sources together
    // NOT individual summaries — a true combined view
  },
  commonFindings: {
    type: [String],
    default: [],
    // Things that multiple sources AGREE on
    // Example: "Both NASA and WHO confirm that CO2 levels have risen 40%"
  },
  conflictingPoints: {
    type: [String],
    default: [],
    // Where sources DISAGREE or CONTRADICT each other
    // Example: "NASA says X, but the BBC article says Y"
  },
  uniqueInsights: {
    type: Map,
    of: [String],
    default: {},
    // Map of { sourceTitle: [array of insights unique to that source] }
    // Example: { "NASA Report": ["First mentioned X", "Only source to cover Y"] }
  },
  viewpoints: {
    type: [String],
    default: [],
    // Different perspectives or framings across sources
    // Example: "Source A approaches from economic angle, Source B from environmental"
  },
}, { _id: false });

// ============================================================
// MAIN SCHEMA: Project
// ============================================================
// The top-level document. Everything belongs to a Project.
const projectSchema = new mongoose.Schema(
  {
    // ── Basic Project Info ─────────────────────────────────
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Project title cannot exceed 200 characters'],
      default: 'Untitled Research Project',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
      // Optional: a short note about what this project is researching
    },

    // ── Sources ────────────────────────────────────────────
    // Array of source documents — each has title, content, analysis
    sources: {
      type: [sourceSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 6,
        message: 'A project cannot have more than 6 sources',
      },
    },

    // ── Combined Cross-Source Analysis ────────────────────
    // null = analysis hasn't been run yet
    // populated = the user clicked "Analyze All Sources"
    combinedAnalysis: {
      type: combinedAnalysisSchema,
      default: null,
    },

    // ── Q&A History ────────────────────────────────────────
    // All questions asked in this project session + their answers
    qaHistory: {
      type: [qaEntrySchema],
      default: [],
    },

    // ── Flashcards ─────────────────────────────────────────
    // Generated by AI from the key concepts across all sources
    flashcards: {
      type: [flashcardSchema],
      default: [],
    },

    // ── Quiz ───────────────────────────────────────────────
    quiz: {
      questions: {
        type: [quizQuestionSchema],
        default: [],
      },
      // Was the quiz generated for this project?
      isGenerated: {
        type: Boolean,
        default: false,
      },
    },

    // ── Status Flags ───────────────────────────────────────
    // These help the frontend know what has been done already
    isAnalyzed: {
      type: Boolean,
      default: false,
      // true = combined analysis has been run at least once
    },
  },
  {
    // timestamps: true auto-adds createdAt and updatedAt
    // Mongoose updates updatedAt every time the document is saved
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================
// Indexes speed up database queries.
// createdAt index means "list all projects sorted by date" is fast.
projectSchema.index({ createdAt: -1 }); // -1 = newest first

// ============================================================
// EXPORT
// ============================================================
// 'Project' becomes the MongoDB collection name 'projects'
// (Mongoose automatically lowercases and pluralizes it)
export default mongoose.model('Project', projectSchema);
