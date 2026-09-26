INSERT INTO permissions (name) VALUES ('workflow.read'), ('workflow.write'), ('financial.calculate') ON CONFLICT (name) DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'exec_admin' AND p.name IN ('workflow.read','workflow.write','financial.calculate') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name IN ('workflow.read','workflow.write','financial.calculate') WHERE r.name = 'project_manager' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'workflow.read' WHERE r.name = 'field_staff' ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bids_org_project ON bids(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_project ON purchase_orders(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_org_schedule ON schedule_items(organization_id, schedule_id);
CREATE INDEX IF NOT EXISTS idx_rfis_org_project ON rfis(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_org_project ON submittals(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_org_project ON change_orders(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_draws_org_project ON draw_applications(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_org_project ON compliance_items(organization_id, project_id);
