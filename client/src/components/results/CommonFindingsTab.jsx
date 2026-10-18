// ============================================================
// src/components/results/CommonFindingsTab.jsx — Shared Findings
// ============================================================
// Displays findings that appear across multiple sources.
// Shows what the sources agree on.
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';

function CommonFindingsTab() {
  const { analysis } = useResearch();

  if (!analysis) return null;

  const { commonFindings } = analysis;

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">🤝 Common Findings</h3>
        <p className="tab-panel-description">
          These themes and findings appear across multiple sources.
        </p>
      </div>

      {commonFindings && commonFindings.length > 0 ? (
        <ul className="findings-list">
          {commonFindings.map((finding, index) => (
            <li key={index} className="finding-item">
              <span className="finding-icon">✓</span>
              <p className="finding-text">{finding}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state-text">
          No strong common findings were identified across the sources.
        </p>
      )}
    </div>
  );
}

export default CommonFindingsTab;
