-- Migration 006: Placeholder-Permissions entfernen, Gym Tracker hinzufügen
-- Entfernt: view:code, view:fitness, view:portfolio
-- Fügt hinzu: view:gymtracker

DELETE FROM user_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE key IN ('view:code', 'view:fitness', 'view:portfolio')
);

DELETE FROM permissions
WHERE key IN ('view:code', 'view:fitness', 'view:portfolio');

INSERT INTO permissions (key, label, description)
VALUES ('view:gymtracker', 'Gym Tracker', 'Zugriff auf den Gym Tracker')
ON CONFLICT (key) DO NOTHING;
