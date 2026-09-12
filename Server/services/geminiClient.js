const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

async function embedTexts({ apiKey, model, texts, outputDimensionality }) {
  if (!apiKey) {
    throw new Error('Missing API key for Gemini client');
  }

  const requests = texts.map((text) => ({
    model: `models/${model}`,
    content: { parts: [{ text }] },
    ...(outputDimensionality ? { outputDimensionality } : {}),
  }));

  const response = await fetch(
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

  const response = await fetch(
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
    throw new Error(`Gemini generate request failed (${response.status}): ${errorBody}`);
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
