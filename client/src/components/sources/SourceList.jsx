// ============================================================
// src/components/sources/SourceList.jsx — Source Cards List
// ============================================================
// Renders all added sources as a list of SourceCard components.
// Reads the sources array from global context.
// ============================================================

import { useResearch } from '../../context/ResearchContext.jsx';
import SourceCard from './SourceCard.jsx';

function SourceList() {
  const { sources } = useResearch();

  if (sources.length === 0) {
    return <p className="empty-state-text">No sources added yet.</p>;
  }

  return (
    <div className="source-list">
      {sources.map((source, index) => (
        <SourceCard
          key={source.id}
          source={source}
          index={index}
        />
      ))}
    </div>
  );
}

export default SourceList;
