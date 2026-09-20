const crypto = require('crypto');
const { getAgentConfig } = require('./agentConfig');
const { getAgentState, appendHistory } = require('./agentState');
const { decideNextStep } = require('./planning');
const { executeTool } = require('./toolExecutor');
const { getTool } = require('./toolRegistry');

function observationCacheKey(toolName, args) {
    return `${toolName}:${JSON.stringify(args || {})}`;
}

// One user message costs at most one Gemini "decide" call per tool actually needed, plus
// (only when required) one more call to phrase the final answer. Two exceptions avoid a
// wasted extra call: searchRAGKnowledge answers are already natural language (skip the
// wrap-up call), and repeating an identical tool+args call this turn reuses the cached
// result instead of hitting the database/RAG pipeline again.
async function handleMessage({ user, message, session }) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const startedAt = Date.now();
    const config = getAgentConfig();
    const state = getAgentState(session);

    console.log(`[Agent][requestId=${requestId}] User request received`);

    // The LLM never supplies or sees a user id — identity always comes from the authenticated session.
    const ctx = {
        userId: user.userId,
        usermail: user.email,
        isPrivilegeUser: Boolean(user.isPrivilege),
        deliveryAddress: user.deliveryAddress,
    };

    const observations = [];
    const observationCache = new Map();
    let finalResponse = null;
    let geminiCallCount = 0;
    let toolCallCount = 0;

    for (let iteration = 1; iteration <= config.maxToolIterations; iteration += 1) {
        console.log(`[Agent][requestId=${requestId}] iteration: ${iteration}`);

        geminiCallCount += 1;
        console.log(`[Agent][requestId=${requestId}] Gemini call #${geminiCallCount}: tool-selection`);
        const decision = await decideNextStep({
            message,
            history: state.history,
            observations,
        });

        if (decision?.action?.tool) {
            const { tool: toolName, args = {} } = decision.action;
            const cacheKey = observationCacheKey(toolName, args);
            console.log(`[Agent][requestId=${requestId}] Tool selected: ${toolName}`);

            let observation;
            if (observationCache.has(cacheKey)) {
                observation = observationCache.get(cacheKey);
                console.log(`[Agent][requestId=${requestId}] Skipped duplicate tool call (reusing cached result): ${toolName}`);
            } else {
                observation = await executeTool({
                    toolName,
                    args,
                    ctx,
                    state,
                    lastUserMessage: message,
                });
                toolCallCount += 1;
                console.log(`[Agent][requestId=${requestId}] Tool executed: ${toolName}`);

                if (!observation.requiresConfirmation) {
                    observationCache.set(cacheKey, observation);
                }
            }

            if (observation.requiresConfirmation) {
                finalResponse = observation.message;
                break;
            }

            // RAG answers are already phrased natural language by ragAnswerService — asking
            // Gemini again just to repeat it back would be a pure waste of quota.
            if (toolName === 'searchRAGKnowledge' && !observation.error) {
                finalResponse = observation.answer;
                break;
            }

            observations.push({ tool: toolName, result: observation });
            continue;
        }

        finalResponse = decision?.finalResponse || "I'm not sure how to help with that. Could you rephrase?";

        const pendingConfirmation = decision?.pendingConfirmation;
        if (pendingConfirmation?.tool) {
            const tool = getTool(pendingConfirmation.tool);
            if (tool?.requiresConfirmation) {
                state.pendingConfirmation = { tool: pendingConfirmation.tool, args: pendingConfirmation.args || {} };
            }
        }

        break;
    }

    if (!finalResponse) {
        console.warn(`[Agent][requestId=${requestId}] Max iterations (${config.maxToolIterations}) reached without a final response`);
        finalResponse = "I gathered some information but couldn't finish. Could you rephrase your request?";
    }

    appendHistory(state, 'user', message);
    appendHistory(state, 'assistant', finalResponse);

    const durationMs = Date.now() - startedAt;
    console.log(`[Agent][requestId=${requestId}] Final response generated`);
    console.log(`[Agent][requestId=${requestId}] Gemini calls: ${geminiCallCount} | Tools called: ${toolCallCount} | Total duration: ${durationMs}ms`);

    return {
        answer: finalResponse,
        toolCalls: observations.map((observation) => observation.tool),
        requestId,
    };
}

module.exports = {
    handleMessage,
};
