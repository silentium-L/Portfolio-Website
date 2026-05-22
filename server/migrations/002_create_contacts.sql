-- Migration 002: contacts Tabelle (Kontaktstamm)
-- Ausführen: psql $DATABASE_URL -f migrations/002_create_contacts.sql

CREATE TABLE IF NOT EXISTS contacts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vorname        VARCHAR(100) NOT NULL,
  nachname       VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  profession     VARCHAR(100),
  grund_besuchs  TEXT,
  telefonnummer  VARCHAR(50),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT contacts_user_id_unique UNIQUE (user_id),
  CONSTRAINT contacts_email_format   CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email   ON contacts (email);
