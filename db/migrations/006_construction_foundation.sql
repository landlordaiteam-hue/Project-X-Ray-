CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Phase 2 construction data foundation. All records are organization-scoped.
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(240),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  email VARCHAR(320),
  phone VARCHAR(80),
  website VARCHAR(255),
  address_line1 VARCHAR(200),
  address_line2 VARCHAR(200),
  city VARCHAR(120),
  state VARCHAR(80),
  postal_code VARCHAR(30),
  country VARCHAR(80) DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);
CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  title VARCHAR(120),
  email VARCHAR(320),
  phone VARCHAR(80),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase VARCHAR(40) NOT NULL DEFAULT 'planning';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city VARCHAR(120);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state VARCHAR(80);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS country VARCHAR(80) DEFAULT 'US';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_organization_project_number_key ON projects(organization_id, project_number) WHERE project_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  contract_number VARCHAR(80),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'complete', 'terminated')),
  contract_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (contract_amount >= 0),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, contract_number)
);

CREATE TABLE IF NOT EXISTS cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'superseded')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS estimate_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  markup_percent NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (markup_percent >= 0),
  overhead_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (overhead_amount >= 0),
  contingency_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (contingency_amount >= 0),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estimate_id, version_number)
);
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_version_id UUID NOT NULL REFERENCES estimate_versions(id) ON DELETE CASCADE,
  cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
  description VARCHAR(240) NOT NULL,
  quantity NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(40) NOT NULL,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  labor_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  material_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (material_cost >= 0),
  subcontractor_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subcontractor_cost >= 0),
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(320),
  role VARCHAR(120),
  hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS labor_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  hours NUMERIC(8,2) NOT NULL CHECK (hours >= 0),
  hourly_rate NUMERIC(12,2) NOT NULL CHECK (hourly_rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  email VARCHAR(320), phone VARCHAR(80), website VARCHAR(255),
  address_line1 VARCHAR(200), city VARCHAR(120), state VARCHAR(80), postal_code VARCHAR(30), country VARCHAR(80) DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE, name VARCHAR(200) NOT NULL, title VARCHAR(120), email VARCHAR(320), phone VARCHAR(80), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS material_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL, cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
  sku VARCHAR(100), name VARCHAR(200) NOT NULL, description TEXT, unit VARCHAR(40) NOT NULL, unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS project_material_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, material_item_id UUID NOT NULL REFERENCES material_items(id) ON DELETE RESTRICT, quantity NUMERIC(14,4) NOT NULL CHECK (quantity >= 0), required_by DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL, estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL, vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  title VARCHAR(240) NOT NULL, category VARCHAR(80) NOT NULL DEFAULT 'general', storage_key TEXT, status VARCHAR(20) NOT NULL DEFAULT 'metadata_only' CHECK (status IN ('metadata_only', 'stored', 'archived')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE, version_number INTEGER NOT NULL, storage_key TEXT, checksum VARCHAR(128), mime_type VARCHAR(120), byte_size BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project ON estimates(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_labor_project ON labor_records(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_material_requirements_project ON project_material_requirements(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['customers','customer_contacts','contracts','cost_codes','estimates','estimate_versions','estimate_line_items','employees','labor_records','vendors','vendor_contacts','material_items','project_material_requirements','documents','document_versions'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON %I', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_tenant_policy ON %I USING (organization_id::text = current_setting(''app.current_organization_id'', true)) WITH CHECK (organization_id::text = current_setting(''app.current_organization_id'', true))', table_name, table_name);
  END LOOP;
END $$;
