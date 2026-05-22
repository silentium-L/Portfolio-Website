-- Migration gym_001: gym_users Tabelle (Gym Tracker — eigenständige Benutzerverwaltung)
-- Ausführen: psql $DATABASE_URL -f migrations/gym_001_users.sql

CREATE TABLE IF NOT EXISTS gym_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  CONSTRAINT gym_users_username_unique UNIQUE (username),
  CONSTRAINT gym_users_email_unique    UNIQUE (email),
  CONSTRAINT gym_users_username_length CHECK (length(username) >= 3),
  CONSTRAINT gym_users_username_chars  CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT gym_users_email_format    CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_gym_users_username ON gym_users (username);
CREATE INDEX IF NOT EXISTS idx_gym_users_email    ON gym_users (email);
