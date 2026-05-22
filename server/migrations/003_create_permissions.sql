-- Migration 003: permissions-Tabelle + initiale Kachel-Berechtigungen
-- Ausführen: psql $DATABASE_URL -f migrations/003_create_permissions.sql

CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) NOT NULL,
  label       VARCHAR(200) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT permissions_key_unique UNIQUE (key),
  CONSTRAINT permissions_key_format CHECK (key ~ '^[a-z0-9_:]+$')
);

CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions (key);

-- Initiale Kachel-Berechtigungen (ON CONFLICT: idempotent)
INSERT INTO permissions (key, label, description) VALUES
  ('view:personal',  'Über mich',    'Zugriff auf die persönliche Vorstellungsseite'),
  ('view:terminal',  'Terminal',     'Zugriff auf das AI-Terminal'),
  ('view:gapped',    'Get Gapped',   'Zugriff auf das Get Gapped / League-Tool'),
  ('view:code',      'Code Forge',   'Zugriff auf Code Forge'),
  ('view:fitness',   'Fitness Log',  'Zugriff auf den Fitness-Log'),
  ('view:portfolio', 'Portfolio',    'Zugriff auf die Portfolio-Seite')
ON CONFLICT (key) DO NOTHING;
