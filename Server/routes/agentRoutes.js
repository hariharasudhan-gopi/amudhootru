const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getAgentConfig } = require('../agent/agentConfig');
const { handleMessage } = require('../agent/agentService');

const router = express.Router();

router.use(express.json());

router.post('/api/agent/chat', requireAuth, async function(req, res) {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const config = getAgentConfig();

    if (!config.llmApiKey) {
        return res.status(500).json({ error: 'AI assistant is not configured.' });
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
        const result = await handleMessage({ user: req.user, message, session: req.session });
        return res.status(200).json({ answer: result.answer });
    } catch (error) {
        console.error('AI agent error:', error?.message || error, error?.rawResponse ? `| raw: ${error.rawResponse}` : '');

        if (error?.code === 'AI_QUOTA_EXCEEDED') {
            return res.status(503).json({
                success: false,
                code: 'AI_QUOTA_EXCEEDED',
                error: 'AI service quota has been exhausted. Please try again later.',
            });
        }

        if (error?.code === 'AI_RATE_LIMITED' || error?.code === 'AI_OVERLOADED' || error?.status === 503 || error?.status === 429) {
            return res.status(503).json({
                success: false,
                code: error?.code || 'AI_TEMPORARILY_UNAVAILABLE',
                error: 'The assistant is temporarily busy. Please try again in a moment.',
            });
        }

        return res.status(500).json({
            success: false,
            code: 'AI_REQUEST_FAILED',
            error: 'Unable to process your request right now. Please try again.',
        });
    }
});

module.exports = router;
