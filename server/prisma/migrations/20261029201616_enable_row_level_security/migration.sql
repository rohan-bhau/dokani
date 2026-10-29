-- Enable Row Level Security on tenant tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;

-- Create isolation policy for users
DROP POLICY IF EXISTS tenant_isolation_users ON "users";
CREATE POLICY tenant_isolation_users ON "users"
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );

-- Create isolation policy for roles (system roles with NULL tenant_id are readable by all tenants)
DROP POLICY IF EXISTS tenant_isolation_roles ON "roles";
CREATE POLICY tenant_isolation_roles ON "roles"
    FOR ALL
    USING (
        tenant_id IS NULL
        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    );