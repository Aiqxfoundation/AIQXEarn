-- AIQX Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor to create all required tables and constraints.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    wallet VARCHAR(44) PRIMARY KEY,
    upline1 VARCHAR(44) REFERENCES users(wallet),
    upline2 VARCHAR(44),
    upline3 VARCHAR(44),
    join_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    join_signature VARCHAR(128) NOT NULL UNIQUE,
    is_genesis BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_upline1 ON users(upline1);
CREATE INDEX IF NOT EXISTS idx_users_upline2 ON users(upline2);
CREATE INDEX IF NOT EXISTS idx_users_upline3 ON users(upline3);

-- 2. Earnings Table
CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet VARCHAR(44) NOT NULL,
    source_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
    level SMALLINT NOT NULL CHECK (level IN (0, 1, 2, 3)), -- 0 for system, 1-3 for uplines
    amount NUMERIC(14, 6) NOT NULL,
    transaction_signature VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_wallet ON earnings(wallet);
CREATE INDEX IF NOT EXISTS idx_earnings_source ON earnings(source_wallet);
CREATE INDEX IF NOT EXISTS idx_earnings_tx ON earnings(transaction_signature);

-- 3. System Pool Accounting Table
CREATE TABLE IF NOT EXISTS system_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
    fixed_amount NUMERIC(14, 6) NOT NULL DEFAULT 15,
    l2_reserve_amount NUMERIC(14, 6) NOT NULL DEFAULT 0,
    l3_reserve_amount NUMERIC(14, 6) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 6) NOT NULL,
    transaction_signature VARCHAR(128) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Processed Transactions Table (Idempotency Guard)
CREATE TABLE IF NOT EXISTS processed_transactions (
    signature VARCHAR(128) PRIMARY KEY,
    sender_wallet VARCHAR(44) NOT NULL,
    amount NUMERIC(14, 6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Configuration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified information
CREATE POLICY "Public users can view profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Public users can view earnings" ON earnings FOR SELECT USING (true);
CREATE POLICY "Public users can view system pool" ON system_pool FOR SELECT USING (true);
CREATE POLICY "Public users can view processed tx" ON processed_transactions FOR SELECT USING (true);

-- Insert Seed Genesis Sponsor (Genesis Community Root)
INSERT INTO users (wallet, upline1, upline2, upline3, join_time, join_signature, is_genesis)
VALUES ('AIQXroot11111111111111111111111111111111111', NULL, NULL, NULL, NOW(), 'GENESIS_BOOTSTRAP_SIGNATURE', TRUE)
ON CONFLICT (wallet) DO NOTHING;
