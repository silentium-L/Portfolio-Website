-- Migration 004: user_permissions-Tabelle + is_superadmin auf users
-- Ausführen: psql $DATABASE_URL -f migrations/004_create_user_permissions.sql
-- Voraussetzung: Migration 001 (users) und 003 (permissions) müssen gelaufen sein.

-- Superadmin-Flag: Wer TRUE hat, erhält automatisch alle Berechtigungen
-- (auch zukünftig neu angelegte), ohne expliziten Eintrag in user_permissions.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

-- user_permissions: explizite Zuordnung User → Permission für normale User
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,

  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions (user_id);

-- Lorenscheit bekommt Superadmin (case-insensitiv, idempotent)
UPDATE users
  SET is_superadmin = TRUE
  WHERE lower(username) = 'lorenscheit';
