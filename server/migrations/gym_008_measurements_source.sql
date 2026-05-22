-- Migration gym_008: gym_measurements um source-Spalte erweitern
-- source zeigt an woher die Messung stammt: 'profile' (manuell im Profil) oder 'workout' (nach Workout)
-- DEFAULT 'profile' stellt sicher dass bestehende Einträge gültig bleiben.
-- Ausführen: psql $DATABASE_URL -f migrations/gym_008_measurements_source.sql

ALTER TABLE gym_measurements
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'profile';

ALTER TABLE gym_measurements
  ADD CONSTRAINT gym_measurements_source_check
  CHECK (source IN ('workout', 'profile'));
