// ============================================================
// src/context/ResearchContext.jsx — Global State Management
// ============================================================
// React Context creates a "global store" that any component
// in the app can read from or write to directly, without
// having to pass data down through props at every level.
//
// This context stores two kinds of state:
//
//   PAGE ANALYSIS STATE (new PageSense flow):
//     pageUrl      — the URL the user submitted
//     pageAnalysis — the full result from POST /api/analyze-page
//                    { title, wordCount, highlights, quiz, flashcards }
//
//   LEGACY RESEARCH STATE (kept, not removed):
//     sources, analysis — the old multi-source flow state.
//     These are preserved so existing code that imports them
//     does not break during the transition.
//
// USAGE IN ANY COMPONENT:
//   const { pageAnalysis, setPageAnalysis } = useResearch();
// ============================================================

import { createContext, useContext, useState } from 'react';

// Step 1: Create the context object (an empty container)
const ResearchContext = createContext(null);

// ── ResearchProvider Component ───────────────────────────────
// Wraps the entire app (in main.jsx) and makes all context
// values available to every child component.
export function ResearchProvider({ children }) {

  // ── Page Analysis State (PageSense single-URL flow) ───────

  // The URL the user submitted for analysis.
  // Shown on the ResultsPage so the user knows which page
  // was analyzed.
  const [pageUrl, setPageUrl] = useState(null);

  // The full analysis result returned by the backend.
  // Shape when set:
  // {
  //   title:      string,
  //   wordCount:  number,
  //   highlights: { summary: string, points: string[] },
  //   quiz:       { questions: [{ question, options, correctAnswer }] },
  //   flashcards: { cards: [{ question, answer }] }
  // }
  // Null means no analysis has been run yet.
  const [pageAnalysis, setPageAnalysis] = useState(null);

  // ── Legacy Research State (multi-source flow) ─────────────
  // Kept intact so no other existing code breaks.

  // The list of sources the user added.
  // Each source: { id, title, content, wordCount }
  const [sources, setSources] = useState([]);

  // The structured results from the old POST /api/analyze.
  const [analysis, setAnalysis] = useState(null);

  // ── Shared UI State ───────────────────────────────────────
  // isLoading and error are kept here for legacy components
  // that read them. The new HomePage manages its own local
  // loading/error state for simplicity.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  // ── Helpers: Legacy source management ────────────────────
  const addSource = (source) => {
    setSources((prev) => [...prev, source]);
  };

  const removeSource = (id) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Helper: Reset everything ──────────────────────────────
  // Clears both the new page-analysis state AND the legacy
  // research state. Called when the user starts a new analysis.
  const resetResearch = () => {
    setPageUrl(null);
    setPageAnalysis(null);
    setSources([]);
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
  };

  // ── Context value ─────────────────────────────────────────
  // Everything listed here is accessible by any component
  // that calls useResearch().
  const value = {
    // ── New page-analysis state ──────────────────────────
    pageUrl,
    setPageUrl,
    pageAnalysis,
    setPageAnalysis,

    // ── Legacy state (preserved) ─────────────────────────
    sources,
    setSources,
    addSource,
    removeSource,
    analysis,
    setAnalysis,
    isLoading,
    setIsLoading,
    error,
    setError,

    // ── Shared action ─────────────────────────────────────
    resetResearch,
  };

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
}

// ── Custom Hook ───────────────────────────────────────────────
// Components call: const { pageAnalysis } = useResearch();
// instead of the more verbose: useContext(ResearchContext)
export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used inside a ResearchProvider');
  }
  return context;
}
