// ============================================================
// src/services/openaiService.js — All AI Logic Lives Here
// ============================================================
// This file is the only place in the entire backend that talks
// to the OpenAI API. Every AI feature has its own function here.
//
// FUNCTIONS IN THIS FILE:
//   1. analyzeSingleSource     — summarize one source + key terms
//   2. analyzeMultipleSources  — cross-source combined analysis
//   3. askAcrossSources        — source-grounded Q&A
//   4. generateFlashcards      — flashcard pairs from concepts
//   5. generateQuiz            — multiple-choice quiz questions
//
// HOW PROMPTS WORK:
// A prompt is the instruction we send to the AI. Think of it
// like a very detailed question. The better the prompt, the
// better the AI's answer. All prompts here ask for JSON so
// the response is easy to parse and render in React.
// ============================================================

import OpenAI from 'openai';
import { parseJsonResponse } from '../utils/responseParser.js';

// ── Lazy OpenAI Client ────────────────────────────────────────
// The client is created on the FIRST API call, not at startup.
// This means the server starts fine even without an API key.
// The error only appears when the user actually tries to use AI.
let _openai = null;

const getOpenAI = () => {
  if (!_openai) {
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === 'your_openai_api_key_here'
    ) {
      throw new Error(
        'OPENAI_API_KEY is not configured. Please add your key to server/.env'
      );
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
};

// ── Shared Helper: Format Sources for Prompts ─────────────────
// Converts an array of sources into a clearly labelled text block.
//
// Input:  [{ title: "NASA Report", content: "..." }, ...]
// Output:
//   SOURCE 1: "NASA Report"
//   ---
//   [content]
//   ===
//   SOURCE 2: "WHO Study"
//   ---
//   [content]
const formatSourcesForPrompt = (sources) => {
  return sources
    .map(
      (source, index) =>
        `SOURCE ${index + 1}: "${source.title}"\n---\n${source.content.trim()}`
    )
    .join('\n\n===\n\n');
};

// ── Shared Helper: Call OpenAI ────────────────────────────────
// Centralises the OpenAI call so we don't repeat it everywhere.
// All functions below use this helper.
const callOpenAI = async (systemPrompt, userPrompt, temperature = 0.3) => {
  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature,
    // temperature controls how "creative" vs "focused" the AI is
    // 0.0 = very deterministic and consistent
    // 1.0 = more creative but less reliable
    // We use low values (0.2-0.4) because we want accurate analysis
  });
  return response.choices[0].message.content;
};

// ============================================================
// FUNCTION 1: analyzeSingleSource
// ============================================================
// Analyzes ONE source individually.
// Called once per source when the user adds sources.
//
// Returns:
// {
//   summary: "...",
//   keyFindings: ["...", "..."],
//   keyTerms: [{ term: "...", explanation: "..." }]
// }
//
// @param {{ title: string, content: string }} source
// @returns {Promise<Object>}
export const analyzeSingleSource = async (source) => {
  const systemPrompt =
    'You are PageSense, a research analyst. You analyze individual articles and always respond with valid JSON only. Never include markdown, code blocks, or extra explanation.';

  const userPrompt = `
Analyze the following research source carefully and thoroughly.

SOURCE TITLE: "${source.title}"
SOURCE CONTENT:
---
${source.content.trim()}
---

Respond with ONLY a valid JSON object in exactly this format:

{
  "summary": "A clear 2-4 sentence summary of what this source is about and its main argument or findings.",
  "keyFindings": [
    "The most important finding or claim from this source",
    "Second most important finding",
    "Third finding (include up to 5 total)"
  ],
  "keyTerms": [
    {
      "term": "Important concept or technical term from the source",
      "explanation": "A simple 1-2 sentence explanation of what this term means in context"
    }
  ]
}

RULES:
- summary must be based ONLY on this source's content.
- keyFindings should have 3 to 5 items.
- keyTerms should have 3 to 6 important terms/concepts from this source.
- Respond with ONLY the JSON. No markdown, no code blocks, no extra text.
`;

  const rawText = await callOpenAI(systemPrompt, userPrompt, 0.3);
  return parseJsonResponse(rawText);
};

// ============================================================
// FUNCTION 2: analyzeMultipleSources
// ============================================================
// The core PageSense feature — cross-source analysis.
// Reads ALL sources together and finds connections.
//
// Returns:
// {
//   combinedSummary: "...",
//   commonFindings: ["..."],
//   conflictingPoints: ["..."],
//   uniqueInsights: { "Source Title": ["..."] },
//   viewpoints: ["..."]
// }
//
// @param {Array<{ title: string, content: string }>} sources
// @returns {Promise<Object>}
export const analyzeMultipleSources = async (sources) => {
  const formattedSources = formatSourcesForPrompt(sources);
  const sourceNames = sources.map((s) => `"${s.title}"`).join(', ');

  const systemPrompt =
    'You are PageSense, an expert research analyst. You perform deep cross-source analysis and always respond with valid JSON only. Never include markdown, code blocks, or extra explanation.';

  const userPrompt = `
You have been given ${sources.length} research sources: ${sourceNames}.

Read ALL sources carefully and perform a deep cross-source analysis.

${formattedSources}

Respond with ONLY a valid JSON object in exactly this format:

{
  "combinedSummary": "A 3-5 sentence summary that synthesizes the COMBINED message across ALL sources. Do NOT summarize each source individually. Synthesize them together into one coherent overview.",
  "commonFindings": [
    "A finding or theme that appears in MULTIPLE sources — mention which sources agree on this",
    "Another shared finding across sources"
  ],
  "conflictingPoints": [
    "A specific point where SOURCE A and SOURCE B disagree or present conflicting information — name the sources",
    "Another contradiction between sources"
  ],
  "uniqueInsights": {
    "EXACT_SOURCE_TITLE_1": [
      "An insight or point found ONLY in this source and not in any other",
      "Another unique point from this source"
    ],
    "EXACT_SOURCE_TITLE_2": [
      "A unique insight only this source covers"
    ]
  },
  "viewpoints": [
    "How Source A's perspective or approach differs from Source B's perspective",
    "Another meaningful difference in how sources frame or approach the topic"
  ]
}

STRICT RULES:
- Replace EXACT_SOURCE_TITLE_1 etc. with the EXACT title strings provided above.
- commonFindings needs at least 2 items if sources share any themes.
- conflictingPoints should be [] if there are genuinely no contradictions.
- Every insight must come ONLY from the provided source content.
- Do not invent information not present in the sources.
- Respond with ONLY the JSON. No markdown, no code blocks, no extra text.
`;

  const rawText = await callOpenAI(systemPrompt, userPrompt, 0.3);
  return parseJsonResponse(rawText);
};

// ============================================================
// FUNCTION 3: askAcrossSources
// ============================================================
// Source-grounded Q&A — the user asks a question,
// the AI answers using ONLY the provided sources.
//
// Returns:
// {
//   answer: "...",
//   sourcesUsed: ["Source Title 1", ...],
//   relevantExcerpts: [{ sourceTitle: "...", excerpt: "..." }]
// }
//
// @param {Array<{ title: string, content: string }>} sources
// @param {string} question
// @returns {Promise<Object>}
export const askAcrossSources = async (sources, question) => {
  const formattedSources = formatSourcesForPrompt(sources);

  const systemPrompt =
    'You are PageSense, a source-aware research assistant. You answer questions ONLY from the provided sources. You always respond with valid JSON only. Never include markdown, code blocks, or extra explanation.';

  const userPrompt = `
You have been given ${sources.length} research sources and a question from the user.

SOURCES:
${formattedSources}

USER QUESTION: "${question}"

Answer the question based ONLY on the information in the provided sources.
If the answer is not present in any source, say: "The provided sources do not contain information about this topic."

Respond with ONLY a valid JSON object in exactly this format:

{
  "answer": "A clear, complete answer in 2-4 sentences. Write it as if speaking directly to the user.",
  "sourcesUsed": [
    "Exact title of source that supported this answer",
    "Exact title of another source used (if applicable)"
  ],
  "relevantExcerpts": [
    {
      "sourceTitle": "Exact source title",
      "excerpt": "The specific sentence or phrase from that source that directly supports the answer"
    }
  ]
}

STRICT RULES:
- Answer ONLY from the provided sources. Do not use outside knowledge.
- sourcesUsed must contain exact source title strings from those provided.
- relevantExcerpts should have 1-3 direct quotes from the sources.
- If no source covers the question, set sourcesUsed to [] and explain in answer.
- Respond with ONLY the JSON. No markdown, no code blocks, no extra text.
`;

  const rawText = await callOpenAI(systemPrompt, userPrompt, 0.2);
  return parseJsonResponse(rawText);
};

// ============================================================
// FUNCTION 4: generateFlashcards
// ============================================================
// Generates flashcard pairs from key concepts across all sources.
// Each flashcard = { question, answer, sourceTitle }
//
// Returns:
// {
//   flashcards: [
//     { question: "...", answer: "...", sourceTitle: "..." },
//     ...
//   ]
// }
//
// @param {Array<{ title: string, content: string }>} sources
// @returns {Promise<Object>}
export const generateFlashcards = async (sources) => {
  const formattedSources = formatSourcesForPrompt(sources);

  const systemPrompt =
    'You are PageSense, an educational content creator. You generate flashcards from research content and always respond with valid JSON only. Never include markdown, code blocks, or extra explanation.';

  const userPrompt = `
You have been given ${sources.length} research sources. Generate educational flashcards from the key concepts and important information across ALL the sources.

SOURCES:
${formattedSources}

Generate 8 to 12 flashcards. Mix flashcards from different sources.

Respond with ONLY a valid JSON object in exactly this format:

{
  "flashcards": [
    {
      "question": "A clear question testing understanding of an important concept",
      "answer": "A concise but complete answer in 1-3 sentences",
      "sourceTitle": "Exact title of the source this concept came from"
    }
  ]
}

RULES FOR GOOD FLASHCARDS:
- Questions should test understanding, not just memorization.
  Good: "Why does X cause Y?" Bad: "What is X?"
- Answers should be self-contained — readable without the question.
- Cover the most important concepts across all sources.
- Each flashcard should come from a specific source.
- Vary the question types: definitions, cause-effect, comparisons, applications.
- sourceTitle must match an exact source title from those provided.
- Respond with ONLY the JSON. No markdown, no code blocks, no extra text.
`;

  const rawText = await callOpenAI(systemPrompt, userPrompt, 0.4);
  return parseJsonResponse(rawText);
};

// ============================================================
// FUNCTION 5: generateQuiz
// ============================================================
// Generates a multiple-choice quiz from the research sources.
// Each question has exactly 4 options and one correct answer.
//
// Returns:
// {
//   questions: [
//     {
//       question: "...",
//       options: ["A", "B", "C", "D"],
//       correctAnswer: "...",
//       explanation: "...",
//       sourceTitle: "..."
//     }
//   ]
// }
//
// @param {Array<{ title: string, content: string }>} sources
// @returns {Promise<Object>}
export const generateQuiz = async (sources) => {
  const formattedSources = formatSourcesForPrompt(sources);

  const systemPrompt =
    'You are PageSense, an educational assessment creator. You generate multiple-choice quiz questions from research content and always respond with valid JSON only. Never include markdown, code blocks, or extra explanation.';

  const userPrompt = `
You have been given ${sources.length} research sources. Generate a multiple-choice quiz to test understanding of the key information across ALL sources.

SOURCES:
${formattedSources}

Generate exactly 5 multiple-choice questions. Take questions from different sources.

Respond with ONLY a valid JSON object in exactly this format:

{
  "questions": [
    {
      "question": "A clear question about an important concept from the sources",
      "options": [
        "First option — the correct answer",
        "Second option — a plausible wrong answer",
        "Third option — another plausible wrong answer",
        "Fourth option — another plausible wrong answer"
      ],
      "correctAnswer": "First option — the correct answer",
      "explanation": "A 1-2 sentence explanation of why this answer is correct and why the others are wrong.",
      "sourceTitle": "Exact title of the source this question is based on"
    }
  ]
}

RULES FOR GOOD QUIZ QUESTIONS:
- Questions must be answerable ONLY from the provided sources.
- All 4 options must be plausible — avoid obviously wrong answers.
- The correctAnswer string must EXACTLY match one of the strings in options.
- Shuffle the position of the correct answer — don't always put it first.
- Cover the most important facts and concepts across all sources.
- sourceTitle must match an exact source title from those provided.
- Respond with ONLY the JSON. No markdown, no code blocks, no extra text.
`;

  const rawText = await callOpenAI(systemPrompt, userPrompt, 0.4);
  return parseJsonResponse(rawText);
};
