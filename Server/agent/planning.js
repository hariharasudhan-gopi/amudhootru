const { generateStructuredContent } = require('../services/geminiClient');
const { getAgentConfig } = require('./agentConfig');
const { getToolDefinitions } = require('./toolRegistry');

function buildSystemPrompt() {
    const toolDescriptions = getToolDefinitions()
        .map((tool) => `- ${tool.name}: ${tool.description}\n  parameters (JSON schema): ${JSON.stringify(tool.parameters)}`)
        .join('\n');

    return [
        'You are an AI shopping assistant for an e-commerce site, helping an authenticated, already-identified user via natural language.',
        'You can search products, add products to their cart, check out with Cash on Delivery (COD), and check on their orders, or answer general FAQ-style questions.',
        'You never know the user\'s cart, product stock, order history, or order status yourself — you must call a tool to observe real data before mentioning it. Never invent availability or order status.',
        'For informational questions (delivery policy, returns/cancellation, general product info, FAQs) call searchRAGKnowledge instead of answering from your own knowledge.',
        'Before proposing to place an order, first call validateOrder, then set finalResponse to a clear summary (items, quantities, total, delivery address) and explicitly ask the user to confirm placing the order. Do NOT call createCODOrder yet at that point — set "action" to null and set "pendingConfirmation" to { "tool": "createCODOrder", "args": { "confirmed": true } }.',
        'Only call createCODOrder (with confirmed:true) on a later turn, once the user\'s latest message clearly affirms (e.g. "yes", "confirm", "place the order").',
        'If the user asks to add an item you cannot find via searchProduct, tell them it was not found — never guess a product code.',
        'Every tool call costs real API quota — never call a tool you already have a fresh observation for this turn, and set "finalResponse" as soon as you have enough observations to answer, instead of requesting another tool "just to double check".',
        'Respond with ONLY a single JSON object, no markdown, matching exactly this shape:',
        '{ "thought": string, "action": { "tool": string, "args": object } | null, "finalResponse": string | null, "pendingConfirmation": { "tool": string, "args": object } | null }',
        'Set "action" when you need to call a tool next (leave finalResponse null in that case). Set "finalResponse" (and action: null) once you are ready to answer the user for this turn.',
        'Available tools:',
        toolDescriptions,
    ].join('\n');
}

function buildUserPrompt({ message, history, observations }) {
    const historyBlock = (history || [])
        .map((turn) => `${turn.role}: ${turn.text}`)
        .join('\n');
    const observationsBlock = (observations || [])
        .map((obs, index) => `Observation ${index + 1} (tool: ${obs.tool}): ${JSON.stringify(obs.result)}`)
        .join('\n');

    return [
        historyBlock ? `Conversation so far:\n${historyBlock}` : '',
        `Latest user message: ${message}`,
        observationsBlock ? `Tool observations gathered so far this turn:\n${observationsBlock}` : '',
        'Decide the next step now.',
    ].filter(Boolean).join('\n\n');
}

async function decideNextStep({ message, history, observations }) {
    const config = getAgentConfig();
    if (!config.llmApiKey) {
        throw new Error('Agent LLM is not configured (missing API key).');
    }

    return generateStructuredContent({
        apiKey: config.llmApiKey,
        model: config.llmModel,
        systemInstruction: buildSystemPrompt(),
        userPrompt: buildUserPrompt({ message, history, observations }),
        temperature: 0,
        label: 'agent-tool-selection',
    });
}

module.exports = {
    decideNextStep,
};
