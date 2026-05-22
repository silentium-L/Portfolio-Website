-- Migration gym_007: Absolvierte Workouts
-- Tabellen: gym_workouts + gym_workout_sets
-- Voraussetzung: gym_001 (gym_users), gym_004 (gym_exercises)
-- Ausführen: psql $DATABASE_URL -f migrations/gym_007_workouts.sql

-- ─── Tabelle: gym_workouts ────────────────────────────────────────────────────
-- Ein abgeschlossenes Workout eines Users mit optionalem Namen und Zeitstempeln.

CREATE TABLE IF NOT EXISTS gym_workouts (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL DEFAULT '',
  started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_workouts_user
  ON gym_workouts (user_id, finished_at DESC);

-- ─── Tabelle: gym_workout_sets ────────────────────────────────────────────────
-- Einzelne Sätze eines Workouts — ein Satz gehört genau einem Workout und einer Übung.

CREATE TABLE IF NOT EXISTS gym_workout_sets (
  id           SERIAL       PRIMARY KEY,
  workout_id   INTEGER      NOT NULL REFERENCES gym_workouts(id) ON DELETE CASCADE,
  exercise_id  INTEGER      NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  set_number   SMALLINT     NOT NULL DEFAULT 1,
  reps         SMALLINT,
  weight_kg    NUMERIC(6,2),
  duration_sec INTEGER,
  notes        TEXT,

  CONSTRAINT gym_workout_sets_has_value CHECK (
    reps IS NOT NULL OR duration_sec IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_gym_workout_sets_workout
  ON gym_workout_sets (workout_id, exercise_id, set_number);
