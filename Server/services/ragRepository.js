const pool = require('../db/pool');
const { embedQuery } = require('./embeddingService');

function toVectorLiteral(vector) {
  return `[${vector.join(',')}]`;
}

function normalizeTopK(topK, fallback = 5) {
  const parsed = Number.parseInt(String(topK || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 10);
}

async function retrieveRelevantChunks(question, options = {}) {
  const topK = normalizeTopK(options.topK, 5);
  const minSimilarity = typeof options.minSimilarity === 'number' ? options.minSimilarity : 0.25;

  const queryEmbedding = await embedQuery(question);
  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const result = await pool.query(
    `SELECT
      source,
      chunk_index AS "chunkIndex",
      content,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM rag_documents
    ORDER BY embedding <=> $1::vector
    LIMIT $2`,
    [vectorLiteral, topK]
  );

  return result.rows.filter((row) => Number(row.similarity) >= minSimilarity);
}

module.exports = {
  retrieveRelevantChunks,
};
