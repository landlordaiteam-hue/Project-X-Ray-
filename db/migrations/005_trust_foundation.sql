CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) NOT NULL DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locale VARCHAR(20) NOT NULL DEFAULT 'en';
UPDATE organizations SET slug = COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8));
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_key ON organizations(slug);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  name VARCHAR(200) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lower(email))
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS membership_roles (
  membership_id UUID NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (membership_id, role_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user', 'system', 'agent')),
  action VARCHAR(160) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id UUID,
  source VARCHAR(160),
  request_id VARCHAR(160),
  ip_address INET,
  before_state JSONB,
  after_state JSONB,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_created ON audit_logs(organization_id, created_at DESC);

INSERT INTO permissions (name) VALUES
  ('organization.read'), ('organization.write'), ('audit.read'), ('user.manage')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'exec_admin'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name IN ('project.read', 'project.write', 'project_member.manage')
WHERE r.name = 'project_manager'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name IN ('project.read')
WHERE r.name = 'field_staff'
ON CONFLICT DO NOTHING;

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organization_memberships_tenant_policy ON organization_memberships;
CREATE POLICY organization_memberships_tenant_policy ON organization_memberships
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));
DROP POLICY IF EXISTS audit_logs_tenant_policy ON audit_logs;
CREATE POLICY audit_logs_tenant_policy ON audit_logs
  USING (organization_id::text = current_setting('app.current_organization_id', true));
