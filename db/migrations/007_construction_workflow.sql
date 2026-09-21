CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE estimates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL;
ALTER TABLE labor_records ADD COLUMN IF NOT EXISTS estimate_line_item_id UUID REFERENCES estimate_line_items(id) ON DELETE SET NULL;
ALTER TABLE project_material_requirements ADD COLUMN IF NOT EXISTS estimate_line_item_id UUID REFERENCES estimate_line_items(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL, title VARCHAR(200) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','won','lost','converted','withdrawn')),
  scope TEXT NOT NULL DEFAULT '', bid_date DATE, due_date DATE, submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bid_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE, document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (bid_id, document_id)
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','converted','cancelled')),
  approval_state VARCHAR(24) NOT NULL DEFAULT 'not_required' CHECK (approval_state IN ('not_required','pending','approved','rejected')),
  notes TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL, po_number VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','ordered','partially_received','received','cancelled')),
  approval_state VARCHAR(24) NOT NULL DEFAULT 'not_required' CHECK (approval_state IN ('not_required','pending','approved','rejected')),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0), ordered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (organization_id, po_number)
);
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE, material_item_id UUID REFERENCES material_items(id) ON DELETE RESTRICT,
  cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL, description VARCHAR(240) NOT NULL,
  quantity NUMERIC(14,4) NOT NULL CHECK (quantity >= 0), unit VARCHAR(40) NOT NULL,
  unit_price NUMERIC(14,4) NOT NULL CHECK (unit_price >= 0), line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),
  received_quantity NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name VARCHAR(200) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','complete','archived')),
  callout_hours_before_start NUMERIC(6,2) NOT NULL DEFAULT 4 CHECK (callout_hours_before_start >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL, start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','complete','blocked','cancelled')), notes TEXT NOT NULL DEFAULT '', CHECK (end_at >= start_at), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS schedule_dependencies (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, predecessor_id UUID NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE, PRIMARY KEY (predecessor_id, successor_id), CHECK (predecessor_id <> successor_id)
);

CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, number INTEGER NOT NULL, subject VARCHAR(240) NOT NULL, question TEXT NOT NULL,
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL, assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','under_review','responded','closed')), priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  due_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(project_id, number)
);
CREATE TABLE IF NOT EXISTS rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE, responder_id UUID REFERENCES users(id) ON DELETE SET NULL, response TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rfi_documents (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT, PRIMARY KEY (rfi_id, document_id)
);

CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, number INTEGER NOT NULL, title VARCHAR(240) NOT NULL, specification_reference VARCHAR(160),
  responsible_party_id UUID REFERENCES users(id) ON DELETE SET NULL, status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','returned','revised','approved','rejected')),
  due_date DATE, review TEXT, response TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(project_id, number)
);
CREATE TABLE IF NOT EXISTS submittal_documents (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT, PRIMARY KEY (submittal_id, document_id)
);

CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, contract_id UUID REFERENCES contracts(id) ON DELETE RESTRICT, number INTEGER NOT NULL,
  reason VARCHAR(240) NOT NULL, description TEXT NOT NULL, requested_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (requested_amount >= 0), approved_amount NUMERIC(14,2), cost_impact NUMERIC(14,2) NOT NULL DEFAULT 0,
  schedule_impact_days INTEGER NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','rejected','voided')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, approved_by UUID REFERENCES users(id) ON DELETE SET NULL, approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(project_id, number)
);

CREATE TABLE IF NOT EXISTS draw_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT, application_number INTEGER NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','paid')),
  scheduled_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (scheduled_value >= 0), previous_completed_work NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (previous_completed_work >= 0),
  current_work NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_work >= 0), stored_materials NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (stored_materials >= 0), retainage_percent NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (retainage_percent BETWEEN 0 AND 100),
  change_order_amount NUMERIC(14,2) NOT NULL DEFAULT 0, current_payment_due NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_payment_due >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(project_id, application_number)
);
CREATE TABLE IF NOT EXISTS draw_documents (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, draw_application_id UUID NOT NULL REFERENCES draw_applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT, PRIMARY KEY(draw_application_id, document_id)
);

CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, requirement VARCHAR(240) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','pending','submitted','approved','rejected','expired')),
  due_date DATE, responsible_party_id UUID REFERENCES users(id) ON DELETE SET NULL, evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL, review_notes TEXT, reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(80) NOT NULL, entity_id UUID NOT NULL, action VARCHAR(120) NOT NULL, before_state JSONB, after_state JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['bids','bid_documents','purchase_requests','purchase_orders','purchase_order_lines','schedules','schedule_items','schedule_dependencies','rfis','rfi_responses','rfi_documents','submittals','submittal_documents','change_orders','draw_applications','draw_documents','compliance_items','workflow_audit_events'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON %I', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_tenant_policy ON %I USING (organization_id::text = current_setting(''app.current_organization_id'', true)) WITH CHECK (organization_id::text = current_setting(''app.current_organization_id'', true))', table_name, table_name);
  END LOOP;
END $$;
