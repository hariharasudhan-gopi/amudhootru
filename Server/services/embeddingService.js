const { getRagConfig } = require('./ragConfig');
const { embedTexts: geminiEmbedTexts } = require('./geminiClient');

async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('embedTexts requires a non-empty array');
  }

  const config = getRagConfig();

  const embeddings = await geminiEmbedTexts({
    apiKey: config.embeddingApiKey,
    model: config.embeddingModel,
    texts,
    outputDimensionality: config.embeddingDimensions,
  });

  if (!embeddings.length || !Array.isArray(embeddings[0])) {
    throw new Error('Embedding provider returned an invalid response');
  }

  const firstDim = embeddings[0].length;
  if (firstDim !== config.embeddingDimensions) {
    throw new Error(
      `Embedding dimension mismatch: expected ${config.embeddingDimensions}, got ${firstDim}. Update EMBEDDING_DIMENSIONS or model configuration.`
    );
  }

  return embeddings;
}

async function embedQuery(text) {
  const embeddings = await embedTexts([text]);
  return embeddings[0];
}

module.exports = {
  embedTexts,
  embedQuery,
};
