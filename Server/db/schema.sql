-- Core application schema for amudhootru.
-- Single source of truth for all core tables (excluding the optional RAG chatbot
-- tables, which live in rag-schema.sql and are applied by scripts/ingestRag.js).
--
-- This file is executed automatically on server startup (see Server/app.js) and is
-- safe to run repeatedly: every statement uses IF NOT EXISTS / IF EXISTS guards.
-- When the schema needs to change, edit this file rather than adding ad-hoc
-- CREATE/ALTER statements elsewhere in the codebase.

CREATE TABLE IF NOT EXISTS userinfo (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    deliveryaddress TEXT,
    profiletype INTEGER NOT NULL DEFAULT 0,
    profileimage TEXT
);

CREATE TABLE IF NOT EXISTS productdetails (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    availablequantity INTEGER NOT NULL DEFAULT 0,
    img_src TEXT,
    unit VARCHAR(20),
    offerprice NUMERIC
);

-- Order metadata: one row per placed order/invoice.
CREATE TABLE IF NOT EXISTS ordermeta (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES userinfo(id),
    deliverystatus INTEGER NOT NULL DEFAULT 0,
    deliveryaddress JSONB,
    dateoforder TIMESTAMP NOT NULL DEFAULT NOW(),
    paymentid VARCHAR(255),
    paymentsignature VARCHAR(255),
    invoiceid VARCHAR(50) UNIQUE
);

-- Cart items (ordertype = 0) and placed order line items (ordertype = 1).
CREATE TABLE IF NOT EXISTS orderdetails (
    id SERIAL PRIMARY KEY,
    productcode VARCHAR(50) NOT NULL REFERENCES productdetails(code),
    userid INTEGER NOT NULL REFERENCES userinfo(id),
    quantity INTEGER,
    ordertype INTEGER NOT NULL DEFAULT 0,
    invoiceid VARCHAR(50) REFERENCES ordermeta(invoiceid)
);

-- express-session store (connect-pg-simple).
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);

-- Backward-compatible column additions for databases created before a column existed.
ALTER TABLE productdetails ADD COLUMN IF NOT EXISTS offerprice NUMERIC;
