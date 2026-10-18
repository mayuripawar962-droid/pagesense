// ============================================================
// vite.config.js — Vite Build Tool Configuration
// ============================================================
// Vite is the tool that runs the React development server.
//
// The most important thing here is the "proxy" configuration.
//
// WHAT IS A PROXY?
// When your React code calls "/api/analyze", the browser would
// try to reach http://localhost:5173/api/analyze — which is the
// React server. That's wrong. We want it to reach our Express
// server at http://localhost:5000/api/analyze.
//
// The proxy below says: "Any request starting with /api,
// forward it to http://localhost:5000 automatically."
//
// This means in your React code you NEVER have to write the
// full backend URL. Just write "/api/analyze" and Vite handles
// the rest during development.
// ============================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // React app runs here
    proxy: {
      // Any request starting with /api goes to the backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
