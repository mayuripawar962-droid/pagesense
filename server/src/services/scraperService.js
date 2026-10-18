// ============================================================
// src/services/scraperService.js — Web Scraper
// ============================================================
// This file is responsible for fetching a webpage and extracting
// its readable text content.
//
// It does two things:
//   1. Fetches the raw HTML of a URL using axios
//   2. Cleans up the HTML using cheerio to extract only the
//      meaningful text (removing nav, footer, ads, scripts, etc.)
//
// WHY CHEERIO?
// A webpage's HTML is full of clutter — menus, cookie banners,
// social media buttons, JavaScript code, CSS styles. We only
// want the actual article or content text. Cheerio lets us
// select and remove those noisy elements before extracting text,
// just like jQuery works in the browser.
//
// EXPORTED FUNCTION:
//   scrapeUrl(url) → { title, text, wordCount }
// ============================================================

import axios from 'axios';
import * as cheerio from 'cheerio';

// ── Constants ─────────────────────────────────────────────────

// How long to wait (in ms) before giving up on a slow webpage.
// 10 seconds is usually enough for normal sites.
const REQUEST_TIMEOUT_MS = 10000;

// The maximum number of characters of text we'll keep.
// This prevents sending enormous pages to the AI (which costs money
// and slows things down). ~15,000 chars is roughly 2,500 words —
// more than enough for a solid summary.
const MAX_TEXT_LENGTH = 15000;

// We tell the website we are a normal browser. Some websites
// block requests that don't have a User-Agent header.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── HTML tags to completely remove before reading any text ────
// These tags never contain meaningful article content.
const TAGS_TO_REMOVE = [
  'script',    // JavaScript code
  'style',     // CSS styles
  'noscript',  // fallback content for when JS is off
  'nav',       // navigation menus
  'header',    // site header / top bar
  'footer',    // site footer
  'aside',     // sidebars
  'form',      // login / search / subscribe forms
  'button',    // buttons
  'figure',    // image captions (often repetitive)
  'svg',       // inline SVG icons
  'iframe',    // embedded third-party content
  'img',       // image tags (we only want text)
  'video',     // video players
  'audio',     // audio players
  'ads',       // generic ad containers
  '[class*="cookie"]',  // cookie banners (class contains "cookie")
  '[class*="banner"]',  // promotional banners
  '[class*="popup"]',   // popup overlays
  '[class*="modal"]',   // modal dialogs
  '[id*="cookie"]',     // cookie banners by id
  '[id*="ad"]',         // ad containers by id
];

// ============================================================
// MAIN FUNCTION: scrapeUrl
// ============================================================
// Accepts a URL string, fetches the page, and returns clean text.
//
// @param {string} url  — The full URL to scrape (e.g. "https://example.com/article")
// @returns {Promise<{ title: string, text: string, wordCount: number }>}
//
// @throws {Error} if the URL is invalid, the page is unreachable,
//                 or no meaningful text could be extracted.
// ============================================================
export const scrapeUrl = async (url) => {
  // ── Step 1: Validate the URL ───────────────────────────────
  // Make sure the URL is a proper http/https address before
  // even attempting a network request.
  validateUrl(url);

  // ── Step 2: Fetch the webpage HTML ────────────────────────
  console.log(`🌐 Fetching: ${url}`);
  const html = await fetchHtml(url);

  // ── Step 3: Parse and clean the HTML ──────────────────────
  // Load the raw HTML into cheerio so we can work with it like
  // a DOM (similar to how a browser parses a webpage).
  const $ = cheerio.load(html);

  // Extract the page title from the <title> tag.
  // .trim() removes any surrounding whitespace.
  const title = $('title').first().text().trim() || 'Untitled Page';

  // Remove all the noisy tags we listed above.
  // This modifies the in-memory DOM — it does NOT affect the
  // original webpage.
  $(TAGS_TO_REMOVE.join(', ')).remove();

  // ── Step 4: Extract readable text ─────────────────────────
  // Try to find the main content area first. Many websites use
  // semantic HTML tags or common class names to mark their main
  // article content. We try these in order of preference.
  const text = extractMainText($);

  // ── Step 5: Validate that we got something useful ─────────
  if (!text || text.length < 100) {
    throw new Error(
      'Could not extract enough readable text from this page. ' +
      'The page might be behind a login, use heavy JavaScript to render content, or be mostly images.'
    );
  }

  // ── Step 6: Truncate if too long ──────────────────────────
  // Slice to our max length. We also try to cut at a sentence
  // boundary ('. ') so the text doesn't end mid-sentence.
  const truncatedText = truncateAtSentence(text, MAX_TEXT_LENGTH);

  const wordCount = truncatedText.split(/\s+/).filter(Boolean).length;

  console.log(`✅ Scraped "${title}" — ${wordCount} words`);

  return {
    title,
    text: truncatedText,
    wordCount,
  };
};

// ============================================================
// HELPER: validateUrl
// ============================================================
// Throws a descriptive error if the URL isn't valid http/https.
// We use the built-in URL constructor — if it throws, the URL
// is malformed.
// ============================================================
const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('A URL is required.');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`"${url}" is not a valid URL. Make sure it starts with https:// or http://`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are supported.');
  }
};

// ============================================================
// HELPER: fetchHtml
// ============================================================
// Fetches the raw HTML string for a URL using axios.
// Handles common network error types and returns friendly messages.
// ============================================================
const fetchHtml = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': USER_AGENT,
        // Accept HTML content
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        // Ask for uncompressed response so cheerio can read it directly
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Follow redirects automatically (e.g. http → https)
      maxRedirects: 5,
      // We want the raw text, not parsed JSON
      responseType: 'text',
    });

    // Check that the response is actually HTML.
    // Some URLs return images, PDFs, or JSON — we can't scrape those.
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(
        `This URL returned "${contentType}" content. PageSense can only read HTML webpages.`
      );
    }

    return response.data;

  } catch (error) {
    // axios wraps network errors — we translate them into
    // user-friendly messages here.
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      throw new Error(`Could not reach "${url}". Check the URL and your internet connection.`);
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error(`The page at "${url}" took too long to respond (over ${REQUEST_TIMEOUT_MS / 1000}s).`);
    }
    if (error.response) {
      // The server responded but with an error status (404, 403, etc.)
      const status = error.response.status;
      if (status === 404) throw new Error(`Page not found (404): "${url}"`);
      if (status === 403) throw new Error(`Access denied (403): This page requires a login or blocks automated access.`);
      if (status === 429) throw new Error(`Rate limited (429): The website is blocking too many requests. Try again later.`);
      throw new Error(`The page returned an error (HTTP ${status}).`);
    }
    // Re-throw our own custom errors unchanged
    throw error;
  }
};

// ============================================================
// HELPER: extractMainText
// ============================================================
// Tries several strategies to find the main article text.
// Returns a clean string of readable text.
// ============================================================
const extractMainText = ($) => {
  // Strategy 1: Look for semantic HTML5 / common content selectors.
  // These are the most reliable indicators of main article content.
  const contentSelectors = [
    'article',           // <article> — the standard semantic tag for content
    '[role="main"]',     // ARIA role
    'main',              // <main> HTML5 tag
    '.post-content',     // common WordPress class
    '.article-body',     // common news site class
    '.entry-content',    // common blog class
    '.content-body',
    '#content',
    '#main-content',
    '.main-content',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      // Only use this element if it has a meaningful amount of text
      if (text.length > 200) {
        return text;
      }
    }
  }

  // Strategy 2: Fall back to the full <body> text.
  // At this point we've already removed nav, footer, scripts etc.
  // so what's left in body should be mostly content.
  const bodyText = cleanText($('body').text());
  if (bodyText.length > 100) {
    return bodyText;
  }

  // Strategy 3: Last resort — grab all paragraph text.
  // Collect text from every <p> tag on the page.
  const paragraphs = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 40) {  // Skip very short "paragraphs" (captions, labels)
      paragraphs.push(text);
    }
  });

  return paragraphs.join('\n\n');
};

// ============================================================
// HELPER: cleanText
// ============================================================
// Takes a raw text string from cheerio and makes it readable:
//   - Collapses multiple blank lines into one
//   - Collapses multiple spaces into one
//   - Trims leading/trailing whitespace
// ============================================================
const cleanText = (rawText) => {
  return rawText
    .replace(/\t/g, ' ')           // Replace tabs with spaces
    .replace(/[ ]{2,}/g, ' ')      // Collapse multiple spaces into one
    .replace(/\n{3,}/g, '\n\n')    // Collapse 3+ newlines into 2
    .trim();
};

// ============================================================
// HELPER: truncateAtSentence
// ============================================================
// Cuts text to `maxLength` characters, but tries to end at a
// complete sentence ('. ') rather than cutting mid-word.
// ============================================================
const truncateAtSentence = (text, maxLength) => {
  if (text.length <= maxLength) return text;

  // Cut at maxLength first
  let truncated = text.slice(0, maxLength);

  // Find the last sentence-ending punctuation before the cut point
  const lastPeriod = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
  );

  // If we found a sentence boundary in the last 500 chars, cut there
  if (lastPeriod > maxLength - 500) {
    truncated = truncated.slice(0, lastPeriod + 1);
  }

  return truncated.trim();
};
