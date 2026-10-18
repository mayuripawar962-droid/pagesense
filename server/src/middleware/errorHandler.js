// ============================================================
// src/middleware/errorHandler.js — Global Error Handler
// ============================================================
// In Express, a "middleware" is a function that runs between
// a request arriving and a response being sent.
//
// This special middleware catches ANY error thrown anywhere in
// the application and sends a clean, consistent JSON error
// response instead of crashing the server or sending an ugly
// HTML error page.
//
// It must be registered LAST in server.js (after all routes).
// Express knows it's an error handler because it has 4 params:
// (err, req, res, next)
// ============================================================

export const errorHandler = (err, req, res, next) => {
  // Log the full error to the server console for debugging
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Determine the HTTP status code to send
  // If the error already has a status code, use it.
  // Otherwise default to 500 (Internal Server Error).
  const statusCode = err.statusCode || 500;

  // Send a clean JSON error response to the frontend
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server.',
    // Only show detailed stack trace during development — never in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ── Helper: Create errors with custom status codes ───────────
// Usage in controllers: throw createError(400, 'Sources are required')
export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
