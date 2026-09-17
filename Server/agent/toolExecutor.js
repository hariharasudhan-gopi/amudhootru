const { getTool } = require('./toolRegistry');

const AFFIRMATIVE_PATTERN = /^(y|yes|yeah|yep|yup|confirm|confirmed|place it|place the order|go ahead|do it|sure|ok|okay)\b/i;

// Executes a planned tool call. Sensitive tools (requiresConfirmation) can never
// run just because the LLM says confirmed:true — the server independently checks
// that a confirmation was actually proposed on a prior turn AND the user's own
// latest message reads as an explicit "yes".
async function executeTool({ toolName, args, ctx, state, lastUserMessage }) {
    const tool = getTool(toolName);
    if (!tool) {
        return { error: `Unknown tool: ${toolName}` };
    }

    if (tool.requiresConfirmation) {
        const pending = state.pendingConfirmation;
        const userConfirmedNow = Boolean(pending)
            && pending.tool === toolName
            && AFFIRMATIVE_PATTERN.test(String(lastUserMessage || '').trim());

        if (!userConfirmedNow) {
            state.pendingConfirmation = { tool: toolName, args };
            return {
                requiresConfirmation: true,
                message: 'Please explicitly confirm (e.g. reply "yes") before I place this order.',
            };
        }

        state.pendingConfirmation = null;
    }

    try {
        return await tool.execute(args || {}, ctx);
    } catch (error) {
        return { error: error.message || 'Tool execution failed.' };
    }
}

module.exports = {
    executeTool,
};
