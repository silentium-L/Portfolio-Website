-- Migration 005: Berechtigung für Benutzerverwaltung
-- Ausführen: psql $DATABASE_URL -f migrations/005_add_manage_users_permission.sql

INSERT INTO permissions (key, label, description)
VALUES ('manage:users', 'Benutzerverwaltung', 'Kann Benutzer anlegen, löschen und Berechtigungen vergeben')
ON CONFLICT (key) DO NOTHING;
