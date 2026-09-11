require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db/pool');
const { splitIntoTokenAwareChunks } = require('../services/chunkingService');
const { embedTexts } = require('../services/embeddingService');
const { getRagConfig, validateRagConfig } = require('../services/ragConfig');

function createHash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toVectorLiteral(vector) {
  return `[${vector.join(',')}]`;
}

async function loadSchema() {
  const schemaPath = path.join(__dirname, '..', 'db', 'rag-schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

async function readKnowledgeFiles(dataDir) {
  const files = [
    { source: 'FAQ', fileName: 'FAQ.txt' },
    { source: 'Policy', fileName: 'Policy.txt' },
  ];

  const docs = [];
  for (const file of files) {
    const fullPath = path.join(dataDir, file.fileName);
    const content = await fs.readFile(fullPath, 'utf8');
    docs.push({ ...file, content, fullPath });
  }

  return docs;
}

async function ingestDocument(client, doc, config) {
  const chunks = splitIntoTokenAwareChunks(doc.content, {
    chunkSize: 800,
    overlap: 100,
  });

  if (!chunks.length) {
    return { inserted: 0, source: doc.source, hashes: [] };
  }

  const embeddings = await embedTexts(chunks);
  const hashes = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const content = chunks[i];
    const embedding = embeddings[i];
    const contentHash = createHash(`${doc.source}:${content}`);
    const metadata = {
      source: doc.source,
      chunkIndex: i,
      fileName: doc.fileName,
      contentHash,
    };

    hashes.push(contentHash);

    await client.query(
      `INSERT INTO rag_documents (source, chunk_index, content, content_hash, metadata, embedding)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
       ON CONFLICT (source, content_hash)
       DO UPDATE SET
         chunk_index = EXCLUDED.chunk_index,
         content = EXCLUDED.content,
         metadata = EXCLUDED.metadata,
         embedding = EXCLUDED.embedding,
         updated_at = NOW()`,
      [doc.source, i, content, contentHash, JSON.stringify(metadata), toVectorLiteral(embedding)]
    );
  }

  await client.query(
    'DELETE FROM rag_documents WHERE source = $1 AND NOT (content_hash = ANY($2::text[]))',
    [doc.source, hashes]
  );

  return { inserted: chunks.length, source: doc.source, hashes };
}

async function run() {
  const config = getRagConfig();
  const validation = validateRagConfig(config, { requireLlm: false });

  if (!validation.isValid) {
    throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
  }

  await loadSchema();
  const docs = await readKnowledgeFiles(config.dataDir);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalChunks = 0;
    for (const doc of docs) {
      const result = await ingestDocument(client, doc, config);
      totalChunks += result.inserted;
      console.log(`Ingested ${result.inserted} chunks from ${doc.fileName}`);
    }

    await client.query('COMMIT');
    console.log(`RAG ingestion completed. Total chunks: ${totalChunks}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('RAG ingestion failed:', error?.message || error);
  process.exit(1);
});
