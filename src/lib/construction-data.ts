import { query, withTenant } from './db';
import { logAudit } from './audit';

export type EstimateLineInput = {
  costCodeId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  laborCost?: number;
  materialCost?: number;
  subcontractorCost?: number;
};

export function calculateEstimateLine(input: EstimateLineInput) {
  const quantity = input.quantity;
  const unitCost = input.unitCost ?? 0;
  const laborCost = input.laborCost ?? quantity * unitCost;
  const materialCost = input.materialCost ?? 0;
  const subcontractorCost = input.subcontractorCost ?? 0;
  return { ...input, laborCost, materialCost, subcontractorCost, lineTotal: laborCost + materialCost + subcontractorCost };
}

export function calculateEstimateTotal(lines: EstimateLineInput[], markupPercent = 0, overheadAmount = 0, contingencyAmount = 0) {
  const subtotal = lines.reduce((sum, line) => sum + calculateEstimateLine(line).lineTotal, 0);
  const markup = subtotal * (markupPercent / 100);
  return { subtotal, markup, overheadAmount, contingencyAmount, total: subtotal + markup + overheadAmount + contingencyAmount };
}

export async function createCustomer(organizationId: string, actorId: string, input: { name: string; email?: string; phone?: string; addressLine1?: string; city?: string; state?: string; postalCode?: string }) {
  return withTenant(organizationId, async (client) => {
    const result = await client.query<{ id: string; name: string }>(`INSERT INTO customers (organization_id, name, email, phone, address_line1, city, state, postal_code) VALUES (current_setting('app.current_organization_id')::uuid, $1,$2,$3,$4,$5,$6,$7) RETURNING id::text, name`, [input.name, input.email ?? null, input.phone ?? null, input.addressLine1 ?? null, input.city ?? null, input.state ?? null, input.postalCode ?? null]);
    const customer = result.rows[0];
    await logAudit({ organizationId, actorId, action: 'customer.created', entityType: 'customer', entityId: customer.id, after: input, source: 'construction-data' });
    return customer;
  });
}

export async function createEstimate(organizationId: string, actorId: string, projectId: string | null, input: { name: string; lines: EstimateLineInput[]; markupPercent?: number; overheadAmount?: number; contingencyAmount?: number }) {
  const totals = calculateEstimateTotal(input.lines, input.markupPercent, input.overheadAmount, input.contingencyAmount);
  return withTenant(organizationId, async (client) => {
    const estimate = await client.query<{ id: string }>('INSERT INTO estimates (organization_id, project_id, name) VALUES (current_setting(\'app.current_organization_id\')::uuid, $1, $2) RETURNING id::text', [projectId, input.name]);
    const version = await client.query<{ id: string }>('INSERT INTO estimate_versions (organization_id, estimate_id, version_number, markup_percent, overhead_amount, contingency_amount, total_amount) VALUES (current_setting(\'app.current_organization_id\')::uuid, $1, 1, $2, $3, $4, $5) RETURNING id::text', [estimate.rows[0].id, input.markupPercent ?? 0, input.overheadAmount ?? 0, input.contingencyAmount ?? 0, totals.total]);
    for (const line of input.lines.map(calculateEstimateLine)) await client.query('INSERT INTO estimate_line_items (organization_id, estimate_version_id, cost_code_id, description, quantity, unit, unit_cost, labor_cost, material_cost, subcontractor_cost, line_total) VALUES (current_setting(\'app.current_organization_id\')::uuid, $1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [version.rows[0].id, line.costCodeId ?? null, line.description, line.quantity, line.unit, line.unitCost ?? 0, line.laborCost, line.materialCost, line.subcontractorCost, line.lineTotal]);
    await logAudit({ organizationId, actorId, action: 'estimate.created', entityType: 'estimate', entityId: estimate.rows[0].id, after: { ...input, totals }, source: 'construction-data' });
    return { id: estimate.rows[0].id, versionId: version.rows[0].id, totals };
  });
}

export async function listCustomers(organizationId: string) {
  return query('SELECT id::text, name, email, phone, address_line1, city, state, postal_code, status FROM customers WHERE organization_id = $1 ORDER BY name', [organizationId]);
}

export async function listVendors(organizationId: string) {
  return query('SELECT id::text, name, category, status, email, phone FROM vendors WHERE organization_id = $1 ORDER BY name', [organizationId]);
}
