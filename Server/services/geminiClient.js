const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, options);

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_RETRIES) {
      return response;
    }

    lastError = response;
    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }

  return lastError;
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

  const response = await fetchWithRetry(
    `${BASE_URL}/models/${model}:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini embedding request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.embeddings || []).map((item) => item.values);
}

async function generateContent({ apiKey, model, systemInstruction, userPrompt, temperature }) {
  if (!apiKey) {
    throw new Error('Missing API key for Gemini client');
  }

  const response = await fetchWithRetry(
    `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`Gemini generate request failed (${response.status}): ${errorBody}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('');
  return text.trim();
}

module.exports = {
  embedTexts,
  generateContent,
};
