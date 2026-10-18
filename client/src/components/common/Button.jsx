// ============================================================
// src/components/common/Button.jsx — Reusable Button Component
// ============================================================
// Instead of repeating button styling everywhere, we create
// one Button component with variants. Any page can use:
//   <Button variant="primary" onClick={handleClick}>Analyze</Button>
//   <Button variant="secondary" disabled>Remove</Button>
// ============================================================

function Button({ children, variant = 'primary', onClick, disabled = false, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
