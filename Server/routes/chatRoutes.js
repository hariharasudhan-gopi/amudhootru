const express = require('express');
const { getRagConfig, validateRagConfig } = require('../services/ragConfig');
const { retrieveRelevantChunks } = require('../services/ragRepository');
const { generateRagAnswer } = require('../services/ragAnswerService');

const router = express.Router();

router.post('/api/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const config = getRagConfig();
  const configValidation = validateRagConfig(config, { requireLlm: true });

  if (!configValidation.isValid) {
    return res.status(500).json({
      error: 'Chat service configuration is incomplete.',
      details: configValidation.errors,
    });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (message.length > config.maxMessageChars) {
    return res.status(400).json({
      error: `Message exceeds ${config.maxMessageChars} characters limit.`,
    });
  }

  try {
    const chunks = await retrieveRelevantChunks(message, {
      topK: config.topK,
      minSimilarity: config.minSimilarity,
    });

    const result = await generateRagAnswer({
      question: message,
      chunks,
    });

    const uniqueSources = [];
    const sourceSet = new Set();

    for (const source of result.sources || []) {
      const key = `${source.source}:${source.chunkIndex}`;
      if (!sourceSet.has(key)) {
        sourceSet.add(key);
        uniqueSources.push(source);
      }
    }

    return res.status(200).json({
      answer: result.answer,
      sources: uniqueSources,
    });
  } catch (error) {
    console.error('RAG chat error:', error?.message || error);
    return res.status(500).json({
      error: 'Unable to process chat request right now. Please try again.',
    });
  }
});

module.exports = router;
