-- =============================================================================
-- CDNetworks Platform — PostgreSQL bootstrap (Control Plane).
-- Multi-tenant với RLS để cô lập dữ liệu giữa khách hàng.
-- =============================================================================

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  plan         TEXT NOT NULL DEFAULT 'trial', -- trial | pro | enterprise
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Control Plane)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member', -- owner | admin | member | readonly
  mfa_secret    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id);

-- API Keys (M2M)
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  key_preview   TEXT NOT NULL,
  scopes        TEXT[] NOT NULL DEFAULT '{}',
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS api_keys_tenant_idx ON api_keys(tenant_id);

-- Hostnames / domains thuộc tenant
CREATE TABLE IF NOT EXISTS hostnames (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname    TEXT NOT NULL,
  origin_url  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | active | suspended
  cache_ttl   INTEGER NOT NULL DEFAULT 3600,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, hostname)
);
CREATE INDEX IF NOT EXISTS hostnames_tenant_idx ON hostnames(tenant_id);
CREATE INDEX IF NOT EXISTS hostnames_hostname_idx ON hostnames(hostname);

-- SSL certificates (lưu trong DB; Edge load qua Redis cache)
CREATE TABLE IF NOT EXISTS ssl_certificates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname      TEXT NOT NULL,
  cert_pem      TEXT NOT NULL,
  key_pem       TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  issuer        TEXT,
  source        TEXT NOT NULL DEFAULT 'lets-encrypt', -- lets-encrypt | uploaded
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, hostname)
);

-- Audit log (compliance / SOC2)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID,
  actor_id    UUID,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  changes     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_tenant_time_idx ON audit_logs(tenant_id, created_at DESC);

-- Cấu hình Edge (WAF rules, rate-limit, custom Lua) per tenant
CREATE TABLE IF NOT EXISTS edge_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname_id UUID REFERENCES hostnames(id) ON DELETE CASCADE,
  config      JSONB NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extensions cần dùng
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================ ROW LEVEL SECURITY =============================
-- Bật RLS để chặn cross-tenant data leak. App phải SET LOCAL app.tenant_id = '...'
-- ở đầu mỗi transaction (qua middleware đọc từ JWT).
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostnames       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_configs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_keys ON api_keys
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_hosts ON hostnames
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_ssl ON ssl_certificates
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_cfg ON edge_configs
  USING (tenant_id::text = current_setting('app.tenant_id', true));

-- ============================ BOOTSTRAP DATA =================================
INSERT INTO tenants (id, slug, display_name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'root', 'Root Tenant', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
