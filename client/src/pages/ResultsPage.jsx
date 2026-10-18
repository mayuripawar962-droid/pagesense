// ============================================================
// src/pages/ResultsPage.jsx — Analysis Results Screen
// ============================================================
// Shows the full PageSense learning kit for an analyzed page.
//
// Three tabs:
//   📋 Highlights — summary paragraph + 5 key points
//   🧠 Quiz       — 5 multiple-choice questions, interactive
//   🃏 Flashcards — 5 click-to-reveal Q&A cards
//
// Guard: if the user lands here without running an analysis
// (e.g. typed /results in the address bar), redirect home.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext.jsx';

const TABS = [
  { id: 'highlights', label: '📋 Highlights'  },
  { id: 'quiz',       label: '🧠 Quiz'        },
  { id: 'flashcards', label: '🃏 Flashcards'  },
];

function ResultsPage() {
  const navigate = useNavigate();
  const { pageAnalysis, pageUrl, resetResearch } = useResearch();
  const [activeTab, setActiveTab] = useState('highlights');

  // ── Guard ─────────────────────────────────────────────────
  if (!pageAnalysis) {
    return (
      <div className="empty-state">
        <p>No analysis found. Please analyze a page first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go to Home
        </button>
      </div>
    );
  }

  const { title, wordCount, highlights, quiz, flashcards } = pageAnalysis;

  const handleNewAnalysis = () => {
    resetResearch();
    navigate('/');
  };

  return (
    <div className="results-page">

      {/* ── Results Header ────────────────────────────────── */}
      <div className="results-header">
        <div>
          <h2 className="results-title">{title || 'Page Analysis'}</h2>
          <p className="results-meta">AI-generated learning kit</p>
        </div>
        <button className="btn btn-secondary" onClick={handleNewAnalysis}>
          ＋ Analyze Another Page
        </button>
      </div>

      {/* ── Meta chips: URL + word count ─────────────────── */}
      <div className="page-meta-bar">
        {pageUrl && (
          <span className="meta-chip">
            🔗&nbsp;
            <a href={pageUrl} target="_blank" rel="noopener noreferrer">
              {pageUrl}
            </a>
          </span>
        )}
        {wordCount && (
          <span className="meta-chip">
            📄 {wordCount.toLocaleString()} words read
          </span>
        )}
      </div>

      {/* ── Tab Navigation ────────────────────────────────── */}
      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <div className="tab-content">
        {activeTab === 'highlights' && (
          <HighlightsTab highlights={highlights} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab quiz={quiz} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab flashcards={flashcards} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// HighlightsTab
// ============================================================
// Shows the AI summary paragraph and the 5 key points.
// ============================================================
function HighlightsTab({ highlights }) {
  if (!highlights) {
    return <p className="empty-state-text">No highlights available.</p>;
  }

  const { summary, points = [] } = highlights;

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">Key Highlights</h3>
        <p className="tab-panel-description">
          A plain-English summary and the most important points from the page.
        </p>
      </div>

      {/* Summary paragraph */}
      {summary && (
        <div className="summary-block">
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {/* Key points */}
      {points.length > 0 && (
        <>
          <h4 className="section-title" style={{ marginTop: 'var(--space-6)' }}>
            Key Points
          </h4>
          <ul className="key-points-list">
            {points.map((point, i) => (
              <li key={i} className="key-point-item">
                <span className="key-point-number">{i + 1}</span>
                <span className="key-point-text">{point}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ============================================================
// QuizTab
// ============================================================
// 5 multiple-choice questions.
// The user clicks an option to select it, then clicks
// "Check Answer" to see if they were right.
// After checking, the correct answer is always revealed.
// ============================================================
function QuizTab({ quiz }) {
  // Track selected option and whether the user has checked,
  // independently for each question.
  // State shape: { [questionIndex]: { selected: string, checked: boolean } }
  const [answers, setAnswers] = useState({});

  if (!quiz?.questions?.length) {
    return <p className="empty-state-text">No quiz available.</p>;
  }

  const { questions } = quiz;

  const selectOption = (qIndex, option) => {
    // Don't allow changing after the answer is checked
    if (answers[qIndex]?.checked) return;
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: { selected: option, checked: false },
    }));
  };

  const checkAnswer = (qIndex) => {
    if (!answers[qIndex]?.selected) return;
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], checked: true },
    }));
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">Quiz</h3>
        <p className="tab-panel-description">
          Select an answer for each question, then click "Check Answer".
        </p>
      </div>

      <ol className="quiz-list">
        {questions.map((q, qIndex) => {
          const state      = answers[qIndex] || {};
          const selected   = state.selected  || null;
          const checked    = state.checked   || false;
          const isCorrect  = checked && selected === q.correctAnswer;
          const isWrong    = checked && selected !== q.correctAnswer;

          return (
            <li key={qIndex} className="quiz-question-block">
              <span className="quiz-question-number">
                Question {qIndex + 1} of {questions.length}
              </span>
              <p className="quiz-question-text">{q.question}</p>

              <div className="quiz-options">
                {q.options.map((option, oIndex) => {
                  // Determine the visual state of this option button
                  let optionClass = 'quiz-option';
                  let icon        = null;

                  if (checked) {
                    if (option === q.correctAnswer) {
                      // Always highlight the correct answer after checking
                      optionClass += ' quiz-option--correct';
                      icon = '✓';
                    } else if (option === selected) {
                      // Highlight the wrong selection in red
                      optionClass += ' quiz-option--wrong';
                      icon = '✗';
                    }
                  } else if (option === selected) {
                    // Just selected, not checked yet — show as active
                    optionClass += ' quiz-option--selected';
                  }

                  return (
                    <button
                      key={oIndex}
                      className={optionClass}
                      onClick={() => selectOption(qIndex, option)}
                      disabled={checked}
                      aria-pressed={option === selected}
                    >
                      {icon && (
                        <span className="quiz-option-icon">{icon}</span>
                      )}
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Check Answer button — only shown before checking */}
              {!checked && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => checkAnswer(qIndex)}
                  disabled={!selected}
                >
                  Check Answer
                </button>
              )}

              {/* Feedback shown after checking */}
              {checked && (
                <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
                  {isCorrect
                    ? '✓ Correct!'
                    : `✗ Not quite. The correct answer is: "${q.correctAnswer}"`
                  }
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ============================================================
// FlashcardsTab
// ============================================================
// 5 flashcards. The question is always visible.
// Clicking "Reveal Answer" (or anywhere on the card) toggles
// the answer open/closed.
// ============================================================
function FlashcardsTab({ flashcards }) {
  // Track which cards have their answer revealed.
  // State shape: Set of revealed indices.
  const [revealed, setRevealed] = useState(new Set());

  if (!flashcards?.cards?.length) {
    return <p className="empty-state-text">No flashcards available.</p>;
  }

  const { cards } = flashcards;

  const toggleCard = (index) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">Flashcards</h3>
        <p className="tab-panel-description">
          Click a card to reveal the answer.
        </p>
      </div>

      <div className="flashcards-list">
        {cards.map((card, index) => {
          const isOpen = revealed.has(index);

          return (
            <div
              key={index}
              className="flashcard"
              onClick={() => toggleCard(index)}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCard(index);
                }
              }}
            >
              {/* Question row */}
              <div className="flashcard-question">
                <p className="flashcard-q-text">
                  <span className="quiz-question-number" style={{ marginRight: 'var(--space-2)' }}>
                    {index + 1}
                  </span>
                  {card.question}
                </p>
                <button
                  className="flashcard-toggle"
                  onClick={(e) => { e.stopPropagation(); toggleCard(index); }}
                  aria-label={isOpen ? 'Hide answer' : 'Reveal answer'}
                >
                  {isOpen ? 'Hide' : 'Reveal'}
                </button>
              </div>

              {/* Answer row — only shown when revealed */}
              {isOpen && (
                <div className="flashcard-answer">
                  <span className="flashcard-a-label">Answer</span>
                  <p className="flashcard-a-text">{card.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultsPage;
