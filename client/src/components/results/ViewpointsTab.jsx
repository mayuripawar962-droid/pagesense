// ============================================================
// src/components/results/ViewpointsTab.jsx — Viewpoints & Conflicts
// ============================================================
// Shows where sources have different perspectives or
// contradict each other. This is one of PageSense's most
// unique and valuable features.
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';

function ViewpointsTab() {
  const { analysis } = useResearch();

  if (!analysis) return null;

  const { viewpoints, conflictingPoints } = analysis;

  return (
    <div className="tab-panel">
      {/* Different Perspectives */}
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">🔄 Different Viewpoints</h3>
        <p className="tab-panel-description">
          How the sources approach or frame the topic differently.
        </p>
      </div>

      {viewpoints && viewpoints.length > 0 ? (
        <ul className="viewpoints-list">
          {viewpoints.map((viewpoint, index) => (
            <li key={index} className="viewpoint-item">
              <span className="viewpoint-icon">↔</span>
              <p className="viewpoint-text">{viewpoint}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state-text">
          No distinct different viewpoints were identified.
        </p>
      )}

      {/* Conflicting Points */}
      <div className="tab-panel-header" style={{ marginTop: '2rem' }}>
        <h3 className="tab-panel-title">⚡ Possible Contradictions</h3>
        <p className="tab-panel-description">
          Points where sources appear to conflict or contradict each other.
        </p>
      </div>

      {conflictingPoints && conflictingPoints.length > 0 ? (
        <ul className="conflicts-list">
          {conflictingPoints.map((conflict, index) => (
            <li key={index} className="conflict-item">
              <span className="conflict-icon">!</span>
              <p className="conflict-text">{conflict}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state-text">
          No clear contradictions were found between the sources.
        </p>
      )}
    </div>
  );
}

export default ViewpointsTab;
