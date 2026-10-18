// ============================================================
// src/components/common/LoadingSpinner.jsx — Loading Indicator
// ============================================================
// Shown while the AI is processing.
// Accepts an optional message to display below the spinner.
//
// Usage:
//   <LoadingSpinner message="Analyzing 3 sources..." />
// ============================================================

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" aria-label="Loading" role="status"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
