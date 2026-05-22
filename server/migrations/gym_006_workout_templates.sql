-- Migration gym_006: Workout-Vorlagen
-- Tabellen: gym_workout_templates + gym_workout_template_exercises (3NF)
-- Voraussetzung: gym_001 (gym_users), gym_004 (gym_exercises)
-- Ausführen: psql $DATABASE_URL -f migrations/gym_006_workout_templates.sql

-- ─── Tabelle: gym_workout_templates ─────────────────────────────────────────
-- Eine Vorlage gehört genau einem User und hat einen frei wählbaren Namen.

CREATE TABLE IF NOT EXISTS gym_workout_templates (
  id         SERIAL       PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT gym_workout_templates_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_gym_workout_templates_user
  ON gym_workout_templates (user_id, created_at DESC);

-- ─── Tabelle: gym_workout_template_exercises ─────────────────────────────────
-- Welche Übungen (aus gym_exercises) sind in einer Vorlage — in welcher Reihenfolge.
-- sort_order ermöglicht beliebige Sortierung ohne Timestamp-Abhängigkeit.

CREATE TABLE IF NOT EXISTS gym_workout_template_exercises (
  id          SERIAL   PRIMARY KEY,
  template_id INTEGER  NOT NULL REFERENCES gym_workout_templates(id) ON DELETE CASCADE,
  exercise_id INTEGER  NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  sort_order  SMALLINT NOT NULL DEFAULT 0,

  CONSTRAINT gym_workout_template_exercises_unique UNIQUE (template_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_template_exercises_template
  ON gym_workout_template_exercises (template_id, sort_order);
