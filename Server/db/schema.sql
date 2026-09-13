```sql
-- ============================================================
-- AMUDHOOTRU ORGANICS - CORE DATABASE SCHEMA
-- ============================================================
--
-- This file is executed automatically when the server starts.
--
-- Goals:
--   1. Safe to execute repeatedly.
--   2. Compatible with PostgreSQL 9.5+.
--   3. Supports existing/older databases through guarded migrations.
--   4. Creates the Express session store required by connect-pg-simple.
--
-- NOTE:
--   RAG tables are maintained separately in rag-schema.sql.
--
-- NOTE:
--   pg_stat_statements is NOT part of this schema.
--   It is a PostgreSQL/Railway extension and should be enabled separately.
-- ============================================================


-- ============================================================
-- 1. USER INFO
-- ============================================================

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


-- ============================================================
-- 2. PRODUCT DETAILS
-- ============================================================

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


-- ============================================================
-- 3. BACKWARD COMPATIBILITY - USERINFO
-- ============================================================
--
-- Older databases may not contain some of the newer columns.
-- PostgreSQL 9.5 does not support:
--
--     ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--
-- Therefore existence checks are used inside DO blocks.
-- ============================================================

DO $$
BEGIN

    -- name
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'name'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN name VARCHAR(255);
    END IF;


    -- email
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'email'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN email VARCHAR(255);
    END IF;


    -- password
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'password'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN password TEXT;
    END IF;


    -- address
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'address'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN address TEXT;
    END IF;


    -- phone
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'phone'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN phone VARCHAR(20);
    END IF;


    -- deliveryaddress
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'deliveryaddress'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN deliveryaddress TEXT;
    END IF;


    -- profiletype
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'profiletype'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN profiletype INTEGER NOT NULL DEFAULT 0;
    END IF;


    -- profileimage
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'profileimage'
    ) THEN
        ALTER TABLE userinfo
        ADD COLUMN profileimage TEXT;
    END IF;


    -- Migrate old isprivilege column if it exists.
    --
    -- Old:
    --     isprivilege BOOLEAN
    --
    -- New:
    --     profiletype = 2 for privilege customers.
    --
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userinfo'
          AND column_name = 'isprivilege'
    ) THEN

        UPDATE userinfo
        SET profiletype = 2
        WHERE isprivilege = TRUE
          AND profiletype = 0;

        ALTER TABLE userinfo
        DROP COLUMN isprivilege;

    END IF;

END
$$;


-- ============================================================
-- 4. BACKWARD COMPATIBILITY - PRODUCT DETAILS
-- ============================================================

DO $$
BEGIN

    -- name
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'name'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN name VARCHAR(255);
    END IF;


    -- price
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'price'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN price NUMERIC;
    END IF;


    -- description
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN description TEXT;
    END IF;


    -- availablequantity
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'availablequantity'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN availablequantity INTEGER NOT NULL DEFAULT 0;
    END IF;


    -- img_src
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'img_src'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN img_src TEXT;
    END IF;


    -- unit
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'unit'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN unit VARCHAR(20);
    END IF;


    -- offerprice
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'offerprice'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN offerprice NUMERIC;
    END IF;


    -- lowstockthreshold
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'lowstockthreshold'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN lowstockthreshold INTEGER NOT NULL DEFAULT 5;
    END IF;


    -- privilegeofferprice
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productdetails'
          AND column_name = 'privilegeofferprice'
    ) THEN
        ALTER TABLE productdetails
        ADD COLUMN privilegeofferprice INTEGER;
    END IF;

END
$$;


-- ============================================================
-- 5. ENSURE productdetails.code IS UNIQUE
-- ============================================================
--
-- orderdetails.productcode will reference productdetails.code.
--
-- PostgreSQL requires the referenced column to have a PRIMARY KEY
-- or UNIQUE constraint.
--
-- This specifically checks whether CODE itself is already backed
-- by a primary/unique constraint.
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'public.productdetails'::regclass
          AND c.contype IN ('p', 'u')
          AND a.attname = 'code'
    ) THEN

        ALTER TABLE productdetails
        ADD CONSTRAINT productdetails_code_key UNIQUE (code);

    END IF;

END
$$;


-- ============================================================
-- 6. ORDER METADATA
-- ============================================================
--
-- One row per placed order/invoice.
--
-- deliverystatus:
--   0  = Order Placed
--   1  = Order Shipped
--   2  = Out for Delivery
--   3  = Delivered
--  -1  = Reserved for stock-notify requests
-- ============================================================

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


-- ============================================================
-- 7. BACKWARD COMPATIBILITY - ORDER META
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'userid'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN userid INTEGER;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'deliverystatus'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN deliverystatus INTEGER NOT NULL DEFAULT 0;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'deliveryaddress'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN deliveryaddress JSONB;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'dateoforder'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN dateoforder TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'paymentid'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN paymentid VARCHAR(255);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'paymentsignature'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN paymentsignature VARCHAR(255);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ordermeta'
          AND column_name = 'invoiceid'
    ) THEN
        ALTER TABLE ordermeta
        ADD COLUMN invoiceid VARCHAR(50);
    END IF;

END
$$;


-- ============================================================
-- 8. ORDER DETAILS
-- ============================================================
--
-- ordertype:
--   0 = cart item
--   1 = placed order line item
--   2 = notify-me-when-back-in-stock request
--
-- price:
--   Actual unit price paid at order time.
--   NULL for cart rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS orderdetails (
    id SERIAL PRIMARY KEY,
    productcode VARCHAR(50) NOT NULL REFERENCES productdetails(code),
    userid INTEGER NOT NULL REFERENCES userinfo(id),
    quantity INTEGER,
    ordertype INTEGER NOT NULL DEFAULT 0,
    invoiceid VARCHAR(50) REFERENCES ordermeta(invoiceid),
    price INTEGER
);


-- ============================================================
-- 9. BACKWARD COMPATIBILITY - ORDER DETAILS
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'productcode'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN productcode VARCHAR(50);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'userid'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN userid INTEGER;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'quantity'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN quantity INTEGER;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'ordertype'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN ordertype INTEGER NOT NULL DEFAULT 0;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'invoiceid'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN invoiceid VARCHAR(50);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orderdetails'
          AND column_name = 'price'
    ) THEN
        ALTER TABLE orderdetails
        ADD COLUMN price INTEGER;
    END IF;

END
$$;


-- ============================================================
-- 10. EXPRESS SESSION STORE
-- ============================================================
--
-- Used by:
--
--     express-session
--     connect-pg-simple
--
-- This table stores login/session information in PostgreSQL.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_user_sessions_expire
ON user_sessions (expire);


-- ============================================================
-- 11. PRODUCT REVIEWS
-- ============================================================
--
-- One review per:
--
--     user + product + invoice
--
-- rating:
--     1 to 5
-- ============================================================

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


-- ============================================================
-- 12. PRODUCT REVIEW INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_productreviews_productcode
ON productreviews (productcode);


CREATE UNIQUE INDEX IF NOT EXISTS ux_productreviews_user_product_invoice
ON productreviews (userid, productcode, invoiceid);


-- ============================================================
-- 13. BACKWARD COMPATIBILITY - PRODUCT REVIEWS
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productreviews'
          AND column_name = 'reviewtext'
    ) THEN
        ALTER TABLE productreviews
        ADD COLUMN reviewtext TEXT;
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productreviews'
          AND column_name = 'createdat'
    ) THEN
        ALTER TABLE productreviews
        ADD COLUMN createdat TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productreviews'
          AND column_name = 'updatedat'
    ) THEN
        ALTER TABLE productreviews
        ADD COLUMN updatedat TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

END
$$;


-- ============================================================
-- 14. OPTIONAL CLEANUP / VALIDATION
-- ============================================================
--
-- Nothing destructive is performed here.
--
-- This schema intentionally does NOT:
--
--   DROP TABLE
--   DROP DATABASE
--   DELETE user data
--   DELETE orders
--   DELETE products
--
-- ============================================================
```
