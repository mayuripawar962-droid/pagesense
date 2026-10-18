// ============================================================
// src/utils/responseParser.js — Safe AI Response Parser
// ============================================================
// AI models sometimes wrap their JSON in markdown code blocks
// like ```json ... ``` or add extra explanation text.
//
// This utility safely extracts the JSON from whatever the AI
// returns, no matter how it's formatted.
//
// If parsing fails, it throws a clear error so the controller
// can handle it gracefully instead of crashing.
// ============================================================

export const parseJsonResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI returned an empty or invalid response.');
  }

  let cleaned = rawText.trim();

  // Remove markdown code blocks if present
  // Pattern: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Try to find a JSON object in the text
  // This handles cases where the AI adds text before or after the JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find a valid JSON object in the AI response.');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    throw new Error(
      `AI response could not be parsed as JSON: ${parseError.message}`
    );
  }
};
