// ============================================================
// src/components/results/AskPageSense.jsx — Q&A Interface
// ============================================================
// The Ask PageSense tab — lets users ask questions about
// their sources and receive source-attributed answers.
//
// Features:
//   - Question input field
//   - Submit button
//   - Displays the answer
//   - Shows which sources supported the answer
//   - Shows relevant excerpts from sources
//   - Keeps a history of questions asked in this session
// ============================================================

import { useState } from 'react';
import { useResearch } from '../../context/ResearchContext.jsx';
import { askQuestion } from '../../services/api.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

function AskPageSense() {
  const { sources } = useResearch();

  // Local state for this component
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const [qaHistory, setQaHistory] = useState([]); // stores past Q&A pairs

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setAskError('');

    try {
      const result = await askQuestion(sources, question.trim());

      // Add this Q&A pair to the history at the top
      setQaHistory((prev) => [
        {
          question: question.trim(),
          answer: result.answer,
          sourcesUsed: result.sourcesUsed || [],
          relevantExcerpts: result.relevantExcerpts || [],
        },
        ...prev,
      ]);

      setQuestion(''); // clear input after asking
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to get an answer. Please try again.';
      setAskError(message);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">❓ Ask PageSense</h3>
        <p className="tab-panel-description">
          Ask any question about your sources. Answers are grounded only in
          the content you provided.
        </p>
      </div>

      {/* ── Question Form ──────────────────────────────────── */}
      <form className="ask-form" onSubmit={handleAsk}>
        <div className="ask-input-group">
          <input
            type="text"
            className="form-input ask-input"
            placeholder="e.g. What do the sources say about climate impact on food security?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAsking}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!question.trim() || isAsking}
          >
            Ask
          </button>
        </div>

        {askError && (
          <p className="form-error" role="alert">{askError}</p>
        )}
      </form>

      {/* ── Loading State ─────────────────────────────────── */}
      {isAsking && (
        <LoadingSpinner message="Searching across your sources..." />
      )}

      {/* ── Q&A History ───────────────────────────────────── */}
      {qaHistory.length > 0 && (
        <div className="qa-history">
          {qaHistory.map((entry, index) => (
            <div key={index} className="qa-entry">
              {/* Question */}
              <div className="qa-question">
                <span className="qa-label">You asked:</span>
                <p className="qa-question-text">{entry.question}</p>
              </div>

              {/* Answer */}
              <div className="qa-answer">
                <span className="qa-label">PageSense:</span>
                <p className="qa-answer-text">{entry.answer}</p>
              </div>

              {/* Sources Used */}
              {entry.sourcesUsed && entry.sourcesUsed.length > 0 && (
                <div className="qa-sources-used">
                  <span className="qa-sources-label">Sources used:</span>
                  <div className="qa-source-tags">
                    {entry.sourcesUsed.map((src, i) => (
                      <span key={i} className="source-tag">{src}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Excerpts */}
              {entry.relevantExcerpts && entry.relevantExcerpts.length > 0 && (
                <div className="qa-excerpts">
                  <span className="qa-sources-label">Relevant excerpts:</span>
                  {entry.relevantExcerpts.map((excerpt, i) => (
                    <div key={i} className="excerpt-block">
                      <span className="excerpt-source">{excerpt.sourceTitle}</span>
                      <blockquote className="excerpt-text">
                        "{excerpt.excerpt}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────── */}
      {!isAsking && qaHistory.length === 0 && (
        <div className="ask-empty-state">
          <p>Type a question above to get a source-grounded answer.</p>
          <div className="example-questions">
            <p className="example-label">Example questions:</p>
            <ul>
              <li>"What do the sources agree on?"</li>
              <li>"What solutions are mentioned?"</li>
              <li>"What evidence is provided for the main claim?"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AskPageSense;
