-- Migration 007: Registrierungs-Status für Benutzerkonten
-- Ausführen: psql $DATABASE_URL -f server/migrations/007_users_registration_status.sql
--
-- Werte: 'pending' = wartet auf Superadmin-Bestätigung
--        'active'  = freigeschaltet (bisheriger Normalzustand)
--        'rejected' = abgelehnt

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'active', 'rejected'));
