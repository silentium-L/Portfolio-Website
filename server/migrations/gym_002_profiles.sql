-- Migration gym_002: gym_profiles Tabelle (Gym Tracker — Personaldaten)
-- Ausführen: psql $DATABASE_URL -f migrations/gym_002_profiles.sql
-- Voraussetzung: gym_001_users.sql muss bereits ausgeführt sein.

CREATE TABLE IF NOT EXISTS gym_profiles (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER      NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
  vorname       VARCHAR(100) NOT NULL,
  nachname      VARCHAR(100) NOT NULL,
  telefonnummer VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT gym_profiles_user_id_unique       UNIQUE (user_id),
  CONSTRAINT gym_profiles_telefonnummer_unique UNIQUE (telefonnummer)
);

CREATE INDEX IF NOT EXISTS idx_gym_profiles_user_id       ON gym_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_gym_profiles_telefonnummer ON gym_profiles (telefonnummer);
