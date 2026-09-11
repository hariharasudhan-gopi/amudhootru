CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('FAQ', 'Policy')),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rag_source_hash UNIQUE (source, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_source_chunk
  ON rag_documents (source, chunk_index);

CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
  ON rag_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE OR REPLACE FUNCTION set_rag_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_rag_documents_updated_at ON rag_documents;

CREATE TRIGGER trg_set_rag_documents_updated_at
BEFORE UPDATE ON rag_documents
FOR EACH ROW
EXECUTE FUNCTION set_rag_documents_updated_at();
