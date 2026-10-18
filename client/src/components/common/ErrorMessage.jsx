// ============================================================
// src/components/common/ErrorMessage.jsx — Error Display
// ============================================================
// Displays a clean, dismissible error message.
// Used throughout the app whenever something goes wrong.
//
// Usage:
//   <ErrorMessage
//     message="Please add at least 2 sources."
//     onDismiss={() => setError(null)}
//   />
// ============================================================

function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      <span className="error-icon">⚠️</span>
      <p className="error-text">{message}</p>
      {onDismiss && (
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
