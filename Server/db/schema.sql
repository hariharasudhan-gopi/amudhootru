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
    -- profiletype: 0 = normal customer, 1 = admin, 2 = privilege customer.
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
    offerprice NUMERIC,
    lowstockthreshold INTEGER NOT NULL DEFAULT 5,
    privilegeofferprice INTEGER
);

-- Order metadata: one row per placed order/invoice.
-- deliverystatus: 0 = Order Placed, 1 = Order Shipped, 2 = Out for Delivery, 3 = Delivered,
--                 -1 = reserved for stock-notify requests (see orderdetails.ordertype below), not a real order.
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

-- ordertype: 0 = cart item, 1 = placed order line item, 2 = "notify me when back in stock" request.
-- price: unit price actually paid at order time (after offer/privilege discount); NULL for cart rows.
CREATE TABLE IF NOT EXISTS orderdetails (
    id SERIAL PRIMARY KEY,
    productcode VARCHAR(50) NOT NULL REFERENCES productdetails(code),
    userid INTEGER NOT NULL REFERENCES userinfo(id),
    quantity INTEGER,
    ordertype INTEGER NOT NULL DEFAULT 0,
    invoiceid VARCHAR(50) REFERENCES ordermeta(invoiceid),
    price INTEGER
);

-- express-session store (connect-pg-simple).
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);

-- One review per user per product per order; rating 1-5 with optional free text.
CREATE TABLE IF NOT EXISTS productreviews (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES userinfo(id),
    productcode VARCHAR(50) NOT NULL REFERENCES productdetails(code),
    invoiceid VARCHAR(50) NOT NULL REFERENCES ordermeta(invoiceid),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    reviewtext TEXT,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productreviews_productcode ON productreviews (productcode);
-- Separate statement (not an inline UNIQUE column constraint) so it also gets
-- applied to tables created before this constraint existed, since
-- CREATE TABLE IF NOT EXISTS skips re-creating an already-existing table.
CREATE UNIQUE INDEX IF NOT EXISTS ux_productreviews_user_product_invoice
    ON productreviews (userid, productcode, invoiceid);

-- Backward-compatible column additions for databases created before a column existed.
-- Postgres 9.5 (local dev) doesn't support `ADD COLUMN IF NOT EXISTS` (added in 9.6),
-- and since this whole file runs as one implicit transaction, that syntax error would
-- roll back every statement above it — use an existence check instead.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'productdetails' AND column_name = 'offerprice'
    ) THEN
        ALTER TABLE productdetails ADD COLUMN offerprice NUMERIC;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'productdetails' AND column_name = 'lowstockthreshold'
    ) THEN
        ALTER TABLE productdetails ADD COLUMN lowstockthreshold INTEGER NOT NULL DEFAULT 5;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'productdetails' AND column_name = 'privilegeofferprice'
    ) THEN
        ALTER TABLE productdetails ADD COLUMN privilegeofferprice INTEGER;
    END IF;

    -- Migrate the older isprivilege boolean column (if present) into profiletype = 2,
    -- then drop it now that profiletype is the single source of truth for user role/tier.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'userinfo' AND column_name = 'isprivilege'
    ) THEN
        UPDATE userinfo SET profiletype = 2 WHERE isprivilege = TRUE AND profiletype = 0;
        ALTER TABLE userinfo DROP COLUMN isprivilege;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orderdetails' AND column_name = 'price'
    ) THEN
        ALTER TABLE orderdetails ADD COLUMN price INTEGER;
    END IF;
END$$;

