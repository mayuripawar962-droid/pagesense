// ============================================================
// server.js — The Entry Point of the PageSense Backend
// ============================================================
// This is the first file Node.js runs when you start the server.
// It does four things:
//   1. Loads environment variables from the .env file
//   2. Creates the Express application
//   3. Connects to MongoDB
//   4. Registers all API routes
//   5. Starts listening for incoming requests on PORT 5000
// ============================================================

// Load environment variables FIRST — before anything else.
// This makes process.env.PORT, process.env.OPENAI_API_KEY, etc. available.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import analyzeRoutes from './src/routes/analyzeRoutes.js';
import askRoutes from './src/routes/askRoutes.js';
import scrapeRoutes from './src/routes/scrapeRoutes.js';
import pageAnalysisRoutes from './src/routes/pageAnalysisRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// ── Create the Express application ──────────────────────────
const app = express();

// ── Middleware ───────────────────────────────────────────────
// Middleware are functions that run on every incoming request
// before it reaches your route handlers.

// cors() allows the React frontend (port 5173) to make requests
// to this backend (port 5000) without the browser blocking it.
app.use(cors({
  origin: 'http://localhost:5173', // Only allow requests from our React app
  methods: ['GET', 'POST', 'DELETE'],
}));

// express.json() reads the request body and converts JSON text
// into a JavaScript object available at req.body.
app.use(express.json());

// ── Database Connection ──────────────────────────────────────
// Connect to MongoDB when the server starts.
connectDB();

// ── Routes ──────────────────────────────────────────────────
// Register API route groups.
// Any request to /api/analyze will be handled by analyzeRoutes.
// Any request to /api/ask will be handled by askRoutes.
app.use('/api/analyze', analyzeRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/analyze-page', pageAnalysisRoutes);

// ── Health Check Route ───────────────────────────────────────
// A simple route to verify the server is running.
// Visit http://localhost:5000/api/health in your browser to test.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PageSense API is running.' });
});

// ── Global Error Handler ─────────────────────────────────────
// This MUST be registered AFTER all routes.
// It catches any errors thrown anywhere in the app and sends
// a clean JSON error response instead of crashing the server.
app.use(errorHandler);

// ── Start the Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ PageSense server is running on http://localhost:${PORT}`);
});
