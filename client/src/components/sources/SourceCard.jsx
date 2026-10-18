// ============================================================
// src/components/sources/SourceCard.jsx — Single Source Card
// ============================================================
// Displays one source as a clean card showing:
//   - Source number and title
//   - Word count
//   - A short content preview
//   - A remove button
//
// Props:
//   source  — { id, title, content, wordCount }
//   index   — position in the list (for "Source 1", "Source 2" etc.)
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';
import { truncateText } from '../../utils/helpers.js';

function SourceCard({ source, index }) {
  const { removeSource } = useResearch();

  return (
    <div className="source-card">
      {/* Card Header */}
      <div className="source-card-header">
        <div className="source-card-title-group">
          <span className="source-number">Source {index + 1}</span>
          <h3 className="source-title">{source.title}</h3>
        </div>
        <button
          className="remove-btn"
          onClick={() => removeSource(source.id)}
          aria-label={`Remove source: ${source.title}`}
          title="Remove this source"
        >
          ✕
        </button>
      </div>

      {/* Word Count */}
      <p className="source-word-count">{source.wordCount} words</p>

      {/* Content Preview */}
      <p className="source-preview">
        {truncateText(source.content, 180)}
      </p>
    </div>
  );
}

export default SourceCard;
