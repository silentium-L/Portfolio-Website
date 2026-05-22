-- Migration 001: users Tabelle
-- Ausführen: psql $DATABASE_URL -f migrations/001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_username_length CHECK (length(username) >= 3),
  CONSTRAINT users_username_chars  CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Index für Login-Lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
