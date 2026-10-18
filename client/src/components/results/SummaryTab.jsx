// ============================================================
// src/components/results/SummaryTab.jsx — Combined Summary Tab
// ============================================================
// Displays the AI-generated combined summary of all sources.
// This is the first tab the user sees after analysis.
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';

function SummaryTab() {
  const { analysis, sources } = useResearch();

  if (!analysis) return null;

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">📋 Combined Research Summary</h3>
        <p className="tab-panel-description">
          A synthesized overview of all {sources.length} sources analyzed together.
        </p>
      </div>

      {/* Main Summary Block */}
      <div className="summary-block">
        <p className="summary-text">{analysis.combinedSummary}</p>
      </div>

      {/* Source count info */}
      <div className="analysis-meta">
        <span className="meta-badge">
          {sources.length} sources · {sources.map(s => s.title).join(' · ')}
        </span>
      </div>
    </div>
  );
}

export default SummaryTab;
