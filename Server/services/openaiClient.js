const OpenAI = require('openai');

const clients = new Map();

function getOpenAIClient(apiKey) {
  if (!apiKey) {
    throw new Error('Missing API key for OpenAI client');
  }

  if (!clients.has(apiKey)) {
    clients.set(apiKey, new OpenAI({ apiKey }));
  }

  return clients.get(apiKey);
}

module.exports = {
  getOpenAIClient,
};
