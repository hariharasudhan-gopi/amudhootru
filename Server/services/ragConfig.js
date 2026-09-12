const path = require('path');

const DEFAULTS = {
  llmModel: 'gemini-3.6-flash',
  embeddingModel: 'gemini-embedding-001',
  embeddingDimensions: 1536,
  topK: 5,
  maxMessageChars: 600,
  minSimilarity: 0.25,
  dataDir: path.join(__dirname, '..', 'data'),
};

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toBoundedNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(String(value || ''));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getRagConfig() {
  const llmApiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '';
  const embeddingApiKey = process.env.EMBEDDING_API_KEY || process.env.GEMINI_API_KEY || llmApiKey;

  return {
    llmApiKey,
    llmModel: process.env.LLM_MODEL || DEFAULTS.llmModel,
    embeddingApiKey,
    embeddingModel: process.env.EMBEDDING_MODEL || DEFAULTS.embeddingModel,
    embeddingDimensions: toPositiveInt(process.env.EMBEDDING_DIMENSIONS, DEFAULTS.embeddingDimensions),
    topK: toPositiveInt(process.env.RAG_TOP_K, DEFAULTS.topK),
    maxMessageChars: toPositiveInt(process.env.RAG_MAX_MESSAGE_CHARS, DEFAULTS.maxMessageChars),
    minSimilarity: toBoundedNumber(process.env.RAG_MIN_SIMILARITY, DEFAULTS.minSimilarity, 0, 1),
    dataDir: process.env.RAG_DATA_DIR || DEFAULTS.dataDir,
  };
}

function validateRagConfig(config, options = { requireLlm: true }) {
  const errors = [];

  if (!config.embeddingApiKey) {
    errors.push('Missing EMBEDDING_API_KEY (or GEMINI_API_KEY fallback)');
  }

  if (options.requireLlm && !config.llmApiKey) {
    errors.push('Missing LLM_API_KEY (or GEMINI_API_KEY fallback)');
  }

  if (!config.embeddingModel) {
    errors.push('Missing EMBEDDING_MODEL');
  }

  if (options.requireLlm && !config.llmModel) {
    errors.push('Missing LLM_MODEL');
  }

  if (!config.embeddingDimensions || config.embeddingDimensions <= 0) {
    errors.push('EMBEDDING_DIMENSIONS must be a positive integer');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  getRagConfig,
  validateRagConfig,
};
