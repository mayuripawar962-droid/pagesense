// ============================================================
// src/App.jsx — Root Component and Router Setup
// ============================================================
// App.jsx is the root of the entire React component tree.
//
// Its job:
//   - Define which page component renders for which URL path
//   - Render the app layout (header + main content area)
//
// React Router works like this:
//   - User visits "/"     → HomePage renders
//   - User visits "/results" → ResultsPage renders
//
// The layout (header, footer) lives here so it appears
// on every page without repeating code.
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import './styles/global.css';

function App() {
  return (
    <div className="app">
      {/* ── App Header ───────────────────────────────────── */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-logo">◈</span>
            <span className="brand-name">PageSense</span>
          </div>
          <p className="brand-tagline">
            Browse → Analyze → Understand → Ask → Learn
          </p>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────── */}
      {/* React Router renders the correct page here based on URL */}
      <main className="app-main">
        <Routes>
          {/* "/" shows the source input page */}
          <Route path="/" element={<HomePage />} />

          {/* "/results" shows the analysis results page */}
          <Route path="/results" element={<ResultsPage />} />

          {/* Any unknown URL redirects to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ── App Footer ───────────────────────────────────── */}
      <footer className="app-footer">
        <p>PageSense · AI-Powered Multi-Source Research Assistant</p>
      </footer>
    </div>
  );
}

export default App;
