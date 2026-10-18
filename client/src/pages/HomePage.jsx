// ============================================================
// src/pages/HomePage.jsx — URL Input Screen
// ============================================================
// The first screen the user sees.
//
// It shows:
//   - PageSense branding and headline
//   - A single URL input field
//   - "Analyze Page" button
//   - Loading state while the backend is working
//   - Error message if something goes wrong
//
// Flow:
//   1. User pastes a URL and clicks "Analyze Page"
//   2. We call analyzePage(url) from the API service
//   3. The result is stored in ResearchContext
//   4. User is navigated to /results
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext.jsx';
import { analyzePage } from '../services/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

function HomePage() {
  const navigate = useNavigate();
  const { setPageUrl, setPageAnalysis, resetResearch } = useResearch();

  const [url, setUrl]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ── Basic URL validation ──────────────────────────────────
  // We just check it starts with http:// or https://.
  // The backend scraper will catch anything more specific.
  const isValidUrl = (value) => {
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // ── Handle form submit ────────────────────────────────────
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Please enter a URL before clicking Analyze.');
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setError('That doesn\'t look like a valid URL. Make sure it starts with https:// or http://');
      return;
    }

    setIsLoading(true);

    try {
      // Clear any previous analysis before running a new one
      resetResearch();

      const data = await analyzePage(trimmedUrl);

      if (!data.success) {
        throw new Error(data.message || 'Analysis failed. Please try again.');
      }

      // Store results in context so ResultsPage can read them
      setPageUrl(trimmedUrl);
      setPageAnalysis({
        title:      data.title,
        wordCount:  data.wordCount,
        highlights: data.highlights,
        quiz:       data.quiz,
        flashcards: data.flashcards,
      });

      navigate('/results');

    } catch (err) {
      // axios wraps HTTP errors in err.response — extract the message
      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-page">

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="hero">
        <h1 className="hero-title">Turn Any Webpage Into a Learning Kit</h1>
        <p className="hero-description">
          Paste a URL and PageSense will read the page, extract the key highlights,
          build a short quiz, and create flashcards — all in seconds.
        </p>
      </section>

      {/* ── URL Input Form ────────────────────────────────── */}
      <section className="section">
        <form className="url-form" onSubmit={handleAnalyze} noValidate>
          <div className="url-input-group">
            <label htmlFor="page-url" className="form-label">
              Webpage URL
            </label>
            <div className="url-input-row">
              <input
                id="page-url"
                type="url"
                className="form-input url-input"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Clear error as soon as the user starts editing
                  if (error) setError(null);
                }}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="btn btn-primary btn-large analyze-btn"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? 'Analyzing…' : 'Analyze Page'}
              </button>
            </div>
            <p className="hint-text">
              Works best with articles, blog posts, Wikipedia pages, and documentation.
            </p>
          </div>
        </form>
      </section>

      {/* ── Error Message ─────────────────────────────────── */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* ── Loading State ─────────────────────────────────── */}
      {isLoading && (
        <LoadingSpinner message="Fetching page and running AI analysis… this takes 10–20 seconds." />
      )}

      {/* ── Feature Cards ─────────────────────────────────── */}
      {!isLoading && (
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📋</span>
              <h3 className="feature-title">Key Highlights</h3>
              <p className="feature-desc">
                A plain-English summary and the 5 most important points from the page.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🧠</span>
              <h3 className="feature-title">Quiz</h3>
              <p className="feature-desc">
                5 multiple-choice questions to test your understanding of the content.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🃏</span>
              <h3 className="feature-title">Flashcards</h3>
              <p className="feature-desc">
                5 click-to-reveal flashcards covering the key concepts from the page.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
