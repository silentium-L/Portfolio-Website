-- Migration gym_003: gym_measurements Tabelle (Körpermaße mit Timestamps)
-- Voraussetzung: gym_001_users.sql muss bereits ausgeführt sein.
-- Ausführen: psql $DATABASE_URL -f migrations/gym_003_measurements.sql

CREATE TABLE IF NOT EXISTS gym_measurements (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  weight_kg   NUMERIC(5,2),
  chest_cm    NUMERIC(5,2),
  waist_cm    NUMERIC(5,2),
  hips_cm     NUMERIC(5,2),
  bicep_cm    NUMERIC(5,2),
  thigh_cm    NUMERIC(5,2),
  notes       TEXT,

  CONSTRAINT gym_measurements_at_least_one_value CHECK (
    weight_kg IS NOT NULL OR chest_cm IS NOT NULL OR waist_cm  IS NOT NULL
    OR hips_cm IS NOT NULL OR bicep_cm IS NOT NULL OR thigh_cm IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_gym_measurements_user_recorded
  ON gym_measurements (user_id, recorded_at DESC);
