// Agent state lives in req.session.agentState (the existing Postgres-backed
// express-session store) — no new storage, and it's cleared with the session
// on logout. Only short-lived conversational context is kept here; nothing
// sensitive (passwords, payment details, etc.) is ever written to it.
const MAX_HISTORY_TURNS = 10;

function getAgentState(session) {
    if (!session.agentState) {
        session.agentState = {
            history: [],
            pendingConfirmation: null,
        };
    }
    return session.agentState;
}

function appendHistory(state, role, text) {
    state.history.push({ role, text });
    if (state.history.length > MAX_HISTORY_TURNS) {
        state.history = state.history.slice(-MAX_HISTORY_TURNS);
    }
}

module.exports = {
    getAgentState,
    appendHistory,
};
