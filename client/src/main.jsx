// ============================================================
// src/main.jsx — React Application Entry Point
// ============================================================
// This is the very first JavaScript file that runs in the browser.
//
// Its job:
//   1. Find the <div id="root"> in index.html
//   2. Mount (attach) the entire React application into that div
//   3. Wrap the app in providers (Router, Context) so every
//      component has access to navigation and global state
//
// You almost never need to edit this file after setup.
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ResearchProvider } from './context/ResearchContext.jsx';
import App from './App.jsx';
import './styles/global.css';

// Find the root div in index.html and mount React into it
createRoot(document.getElementById('root')).render(
  // StrictMode helps catch common mistakes during development.
  // It runs some checks twice in dev mode — this is normal.
  <StrictMode>
    {/* BrowserRouter enables React Router navigation */}
    <BrowserRouter>
      {/* ResearchProvider makes global state available to all components */}
      <ResearchProvider>
        <App />
      </ResearchProvider>
    </BrowserRouter>
  </StrictMode>
);
