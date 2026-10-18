// ============================================================
// src/components/results/UniqueInsightsTab.jsx — Unique Insights
// ============================================================
// Shows insights that are unique to each individual source —
// information that no other source mentioned.
// Each source gets its own section.
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';

function UniqueInsightsTab() {
  const { analysis, sources } = useResearch();

  if (!analysis) return null;

  const { uniqueInsights } = analysis;

  // uniqueInsights is an object like:
  // { "Source Title": ["insight 1", "insight 2"], ... }
  const hasInsights =
    uniqueInsights && Object.keys(uniqueInsights).length > 0;

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">💡 Unique Insights</h3>
        <p className="tab-panel-description">
          Information found exclusively in each individual source.
        </p>
      </div>

      {hasInsights ? (
        <div className="unique-insights-grid">
          {Object.entries(uniqueInsights).map(([sourceTitle, insights]) => (
            <div key={sourceTitle} className="insight-card">
              {/* Source name header */}
              <div className="insight-card-header">
                <span className="insight-source-label">Only in:</span>
                <h4 className="insight-source-title">{sourceTitle}</h4>
              </div>

              {/* Insights list for this source */}
              {insights && insights.length > 0 ? (
                <ul className="insights-list">
                  {insights.map((insight, index) => (
                    <li key={index} className="insight-item">
                      <span className="insight-bullet">◆</span>
                      <p className="insight-text">{insight}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state-text">
                  No unique insights identified for this source.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state-text">
          No unique insights were identified. The sources may cover very
          similar ground.
        </p>
      )}
    </div>
  );
}

export default UniqueInsightsTab;
