const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Temporary conditions (worth a few bounded retries with backoff).
const RATE_LIMIT_MAX_RETRIES = 2;
const OVERLOAD_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 600;
const RETRY_MAX_DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Distinguishes a genuinely temporary 429 (per-minute rate limit) from a 429 that means
// the free-tier daily/project quota is exhausted for the day — retrying the latter can
// never succeed and only wastes time, so it must fail fast instead of being retried.
function classifyGeminiError(status, rawBody) {
  if (status === 503) return 'OVERLOADED';
  if (status !== 429) return 'OTHER';

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (parseError) {
    parsed = null;
  }

  const message = parsed?.error?.message || '';
  const details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
  const quotaFailure = details.find((detail) => typeof detail['@type'] === 'string' && detail['@type'].includes('QuotaFailure'));
  const violationText = (quotaFailure?.violations || [])
    .map((violation) => `${violation.quotaId || ''} ${violation.quotaMetric || ''}`)
    .join(' ');
  const haystack = `${message} ${violationText}`.toLowerCase();

  // Free-tier daily/project quota ids conventionally include "PerDay" (e.g.
  // GenerateRequestsPerDayPerProjectPerModel-FreeTier); per-minute limits don't.
  if (haystack.includes('perday') || haystack.includes('per day') || haystack.includes('daily')) {
    return 'DAILY_QUOTA_EXCEEDED';
  }

  return 'RATE_LIMITED';
}

function buildAgentError(classification, status, rawBody) {
  const codeByClassification = {
    DAILY_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
    RATE_LIMITED: 'AI_RATE_LIMITED',
    OVERLOADED: 'AI_OVERLOADED',
    OTHER: 'AI_REQUEST_FAILED',
  };
  const messageByClassification = {
    DAILY_QUOTA_EXCEEDED: 'AI service daily quota has been exhausted. Please try again later.',
    RATE_LIMITED: 'AI service is rate limited right now. Please try again in a moment.',
    OVERLOADED: 'AI service is temporarily overloaded. Please try again in a moment.',
    OTHER: 'AI request failed.',
  };

  const error = new Error(messageByClassification[classification]);
  error.code = codeByClassification[classification];
  error.status = status;
  error.classification = classification;
  error.rawResponse = rawBody;
  return error;
}

// Single choke point for every outbound Gemini HTTP call: logs each attempt, classifies
// failures, and applies bounded/backed-off retries only where retrying can actually help.
// Returns the parsed JSON body on success; throws a classified Error on failure.
async function fetchGemini(url, options, label) {
  let attempt = 0;

  for (;;) {
    const startedAt = Date.now();
    const response = await fetch(url, options);
    const elapsedMs = Date.now() - startedAt;

    if (response.ok) {
      console.log(`[Gemini] ${label} succeeded (attempt ${attempt + 1}, ${elapsedMs}ms)`);
      return response.json();
    }

    const rawBody = await response.text();
    const classification = classifyGeminiError(response.status, rawBody);

    if (classification === 'DAILY_QUOTA_EXCEEDED') {
      console.error(`[Gemini] ${label} failed: daily quota exceeded, not retrying. Raw: ${rawBody}`);
      throw buildAgentError(classification, response.status, rawBody);
    }

    const maxRetries = classification === 'OVERLOADED' ? OVERLOAD_MAX_RETRIES : RATE_LIMIT_MAX_RETRIES;

    if (classification === 'OTHER' || attempt >= maxRetries) {
      console.error(`[Gemini] ${label} failed permanently (status ${response.status}, attempt ${attempt + 1}). Raw: ${rawBody}`);
      throw buildAgentError(classification, response.status, rawBody);
    }

    const backoff = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
    const jitter = Math.random() * backoff * 0.3;
    console.warn(`[Gemini] ${label} got ${classification} (status ${response.status}), retrying in ~${Math.round(backoff)}ms (attempt ${attempt + 1}/${maxRetries})`);
    await sleep(backoff + jitter);
    attempt += 1;
  }
}

async function embedTexts({ apiKey, model, texts, outputDimensionality }) {
  if (!apiKey) {
    throw new Error('Missing API key for Gemini client');
  }

  const requests = texts.map((text) => ({
    model: `models/${model}`,
    content: { parts: [{ text }] },
    ...(outputDimensionality ? { outputDimensionality } : {}),
  }));

  const data = await fetchGemini(
    `${BASE_URL}/models/${model}:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    },
    `embedTexts(model=${model}, batch=${texts.length})`
  );

  return (data.embeddings || []).map((item) => item.values);
}

async function generateContent({ apiKey, model, systemInstruction, userPrompt, temperature, label }) {
  if (!apiKey) {
    throw new Error('Missing API key for Gemini client');
  }

  const data = await fetchGemini(
    `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature },
      }),
    },
    label || `generateContent(model=${model})`
  );

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('');
  return text.trim();
}

// Used by the AI agent's planning step to force a machine-parsable JSON decision
// instead of free-form text; existing generateContent() callers are unaffected.
async function generateStructuredContent({ apiKey, model, systemInstruction, userPrompt, temperature, label }) {
  if (!apiKey) {
    throw new Error('Missing API key for Gemini client');
  }

  const data = await fetchGemini(
    `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: temperature ?? 0,
          responseMimeType: 'application/json',
        },
      }),
    },
    label || `generateStructuredContent(model=${model})`
  );

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('');

  try {
    return JSON.parse(text);
  } catch (parseError) {
    const error = new Error('Failed to parse structured response from Gemini as JSON');
    error.rawResponse = text;
    throw error;
  }
}

module.exports = {
  embedTexts,
  generateContent,
  generateStructuredContent,
};
