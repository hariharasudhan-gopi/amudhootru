function getAgentConfig() {
    const llmApiKey = process.env.AGENT_LLM_API_KEY || process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '';

    return {
        llmApiKey,
        llmModel: process.env.AGENT_LLM_MODEL || process.env.LLM_MODEL || 'gemini-3.6-flash',
        maxMessageChars: 500,
        maxToolIterations: 4,
    };
}

module.exports = {
    getAgentConfig,
};
