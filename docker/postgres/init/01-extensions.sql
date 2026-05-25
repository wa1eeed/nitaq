-- ─── Naqla Postgres Extensions ─────────────────────────────────
-- Run automatically on first container init
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
