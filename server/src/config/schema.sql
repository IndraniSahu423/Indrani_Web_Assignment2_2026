-- E-Cell IIT Bombay Query Management Portal - RBAC Schema

BEGIN;

-- 1) roles
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 2) domains
CREATE TABLE IF NOT EXISTS domains (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 3) users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  domain_id BIGINT REFERENCES domains(id) ON UPDATE CASCADE ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4) queries
CREATE TABLE IF NOT EXISTS queries (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'needs_info', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  domain_id BIGINT NOT NULL REFERENCES domains(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_by BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  assigned_to BIGINT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  solution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queries_domain_id ON queries(domain_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_by ON queries(created_by);
CREATE INDEX IF NOT EXISTS idx_queries_assigned_to ON queries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);
CREATE INDEX IF NOT EXISTS idx_queries_priority ON queries(priority);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);

-- 5) comments
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  query_id BIGINT NOT NULL REFERENCES queries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_query_id ON comments(query_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 6) attachments
CREATE TABLE IF NOT EXISTS attachments (
  id BIGSERIAL PRIMARY KEY,
  query_id BIGINT NOT NULL REFERENCES queries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_query_id ON attachments(query_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at DESC);

-- Seeds
INSERT INTO roles (name)
VALUES ('superadmin'), ('admin'), ('coordinator'), ('student')
ON CONFLICT (name) DO NOTHING;

INSERT INTO domains (name)
VALUES
  ('Technical Issue'),
  ('Events Related'),
  ('Competitions Related'),
  ('Sponsorship / Partnership'),
  ('Content & Media'),
  ('Finance'),
  ('General / Other')
ON CONFLICT (name) DO NOTHING;

-- Seed superadmin (password: ***REMOVED***)
INSERT INTO users (name, email, password_hash, role_id, domain_id)
SELECT 
  'Superadmin',
  'superadmin@ecell.iitb.ac.in',
  '***REMOVED***',
  (SELECT id FROM roles WHERE name = 'superadmin'),
  NULL
ON CONFLICT (email) DO NOTHING;

COMMIT;
