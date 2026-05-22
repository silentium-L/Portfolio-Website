-- Migration gym_005: Fitness-Felder für gym_profiles
-- Ausführen: psql $DATABASE_URL -f migrations/gym_005_profiles_fitness_fields.sql
-- Voraussetzung: gym_002_profiles.sql muss bereits ausgeführt sein.
-- Non-destructive: alle neuen Spalten sind nullable.

ALTER TABLE gym_profiles
  ADD COLUMN IF NOT EXISTS geburtsdatum   DATE,
  ADD COLUMN IF NOT EXISTS geschlecht     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS groesse_cm     NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS startgewicht_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS zielgewicht_kg  NUMERIC(5,2);
