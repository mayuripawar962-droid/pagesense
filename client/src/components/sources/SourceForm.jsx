// ============================================================
// src/components/sources/SourceForm.jsx — Add Source Form
// ============================================================
// The form that lets users add a new research source.
//
// Fields:
//   - Source Title (text input)
//   - Source Content (textarea for pasting article text)
//
// On submit, it adds the source to the global context
// and clears the form for the next source to be added.
// ============================================================

import { useState } from 'react';
import { useResearch } from '../../context/ResearchContext.jsx';
import { generateId, countWords } from '../../utils/helpers.js';

function SourceForm() {
  const { addSource, sources } = useResearch();

  // Local form state — only this component needs it
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');

  const wordCount = countWords(content);
  const MAX_SOURCES = 6;

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    setFormError('');

    // ── Form Validation ─────────────────────────────────
    if (!title.trim()) {
      setFormError('Please enter a source title.');
      return;
    }

    if (!content.trim()) {
      setFormError('Please paste some content for this source.');
      return;
    }

    if (content.trim().length < 100) {
      setFormError('Content is too short. Please paste at least a paragraph.');
      return;
    }

    if (content.length > 12000) {
      setFormError('Content is too long. Please limit to ~12,000 characters per source.');
      return;
    }

    if (sources.length >= MAX_SOURCES) {
      setFormError(`Maximum ${MAX_SOURCES} sources allowed per analysis.`);
      return;
    }

    // ── Add to Global State ──────────────────────────────
    addSource({
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      wordCount: countWords(content),
    });

    // ── Clear the form ───────────────────────────────────
    setTitle('');
    setContent('');
    setFormError('');
  };

  return (
    <form className="source-form" onSubmit={handleSubmit} noValidate>
      {/* Source Title Input */}
      <div className="form-group">
        <label htmlFor="source-title" className="form-label">
          Source Title
        </label>
        <input
          id="source-title"
          type="text"
          className="form-input"
          placeholder="e.g., NASA Climate Report 2024"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Source Content Textarea */}
      <div className="form-group">
        <label htmlFor="source-content" className="form-label">
          Paste Article or Webpage Content
        </label>
        <textarea
          id="source-content"
          className="form-textarea"
          placeholder="Paste the full content of the article or webpage here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
        />
        <span className="char-count">
          {wordCount} words · {content.length} / 12,000 characters
        </span>
      </div>

      {/* Form Error */}
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={sources.length >= MAX_SOURCES}
      >
        + Add Source
      </button>

      {sources.length >= MAX_SOURCES && (
        <p className="hint-text">Maximum number of sources reached.</p>
      )}
    </form>
  );
}

export default SourceForm;
