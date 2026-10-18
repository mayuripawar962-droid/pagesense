// ============================================================
// src/hooks/useAnalysis.js — Custom Hook for Analysis Logic
// ============================================================
// WHAT IS A CUSTOM HOOK?
// A custom hook is a reusable function that contains React
// logic (useState, useEffect, etc.) that multiple components
// might need.
//
// This hook manages the "run analysis" action:
//   - Calls the analyze API
//   - Updates loading state during the call
//   - Stores the result in global context
//   - Handles and stores errors
//   - Navigates to results page on success
//
// Any component that needs to trigger analysis just calls:
//   const { runAnalysis } = useAnalysis();
//   runAnalysis(sources);
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext.jsx';
import { analyzeSources } from '../services/api.js';

export function useAnalysis() {
  const navigate = useNavigate();
  const { setAnalysis, setIsLoading, setError, sources } = useResearch();

  // ── runAnalysis ────────────────────────────────────────────
  // Triggers the full analysis flow.
  // Called when user clicks "Analyze Sources" button.
  const runAnalysis = async () => {
    // Prevent running with fewer than 2 sources
    if (!sources || sources.length < 2) {
      setError('Please add at least 2 sources before analyzing.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the API service function
      const result = await analyzeSources(sources);

      // Store the result in global context
      setAnalysis(result.analysis);

      // Navigate to the results page
      navigate('/results');

    } catch (err) {
      // Extract the error message from the axios error
      const message =
        err.response?.data?.message ||
        err.message ||
        'Analysis failed. Please try again.';
      setError(message);
    } finally {
      // Always stop the loading spinner, success or failure
      setIsLoading(false);
    }
  };

  return { runAnalysis };
}
