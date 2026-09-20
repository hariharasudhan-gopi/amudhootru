const { retrieveRelevantChunks } = require('../../services/ragRepository');
const { generateRagAnswer } = require('../../services/ragAnswerService');

module.exports = {
    name: 'searchRAGKnowledge',
    description: 'Answer informational questions using the FAQ and Policy documents (delivery policy, returns/cancellation, general product info). Do NOT use this for cart contents, order status, inventory, or payment questions — those must use the dedicated tools.',
    parameters: {
        type: 'object',
        properties: {
            question: { type: 'string', description: 'The informational question to look up.' },
        },
        required: ['question'],
    },
    async execute(args) {
        const question = String(args?.question || '').trim();
        if (!question) return { error: 'A question is required.' };

        const chunks = await retrieveRelevantChunks(question, {});
        const result = await generateRagAnswer({ question, chunks });
        return { answer: result.answer, sources: result.sources };
    },
};
