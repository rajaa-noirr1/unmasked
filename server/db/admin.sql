-- Unmasked: the admin side (PostgreSQL 17, plain SQL).
--
-- Who may change the website's content, their sign-ins, the photos they upload for new questions, and a
-- log of every change. It lives in its own schema, "admin", apart from the 31 tables the website reads,
-- so the public side never touches an account or a password.
--
-- Safe to run again (IF NOT EXISTS everywhere): npm run db:reset runs it after schema.sql, and
-- npm run admin:create runs it before adding an account, so an existing database needs no reset.

CREATE SCHEMA IF NOT EXISTS admin;

-- An admin. The password is never stored, only its scrypt hash (with its own random salt).
CREATE TABLE IF NOT EXISTS admin.accounts (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9._-]{3,32}$'),
  password_hash text NOT NULL CHECK (password_hash LIKE 'scrypt$%'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login    timestamptz
);

-- A signed-in browser. The cookie holds a random token; only its SHA-256 is kept here, so someone who
-- reads this table still cannot sign in. Sessions end after eight hours, or at sign-out.
CREATE TABLE IF NOT EXISTS admin.sessions (
  token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  account_id integer NOT NULL REFERENCES admin.accounts ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS sessions_by_account ON admin.sessions (account_id);

-- A photo uploaded from the admin page for a new question, kept in the database itself.
-- The website shows it from /api/photos/<id>.<ext>; a question points at it in questions.photo_file.
CREATE TABLE IF NOT EXISTS admin.photos (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mime        text NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  bytes       bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 6000000),
  uploaded_by integer REFERENCES admin.accounts ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Every change made from the admin page: who, what, when.
CREATE TABLE IF NOT EXISTS admin.changes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id integer REFERENCES admin.accounts ON DELETE SET NULL,
  action     text NOT NULL CHECK (action IN ('add', 'edit', 'delete', 'move')),
  kind       text NOT NULL CHECK (kind IN ('question', 'signal', 'body part', 'scenario', 'prompt', 'photo')),
  target     text NOT NULL,            -- which one, e.g. context / c-cold
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS changes_by_time ON admin.changes (at DESC);
