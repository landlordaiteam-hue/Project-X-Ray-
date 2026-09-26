import { query, withTenant } from './db';
import { logAudit } from './audit';
import { calculateEstimateLine, calculateEstimateTotal, type EstimateLineInput } from './construction-data';

export { calculateEstimateLine, calculateEstimateTotal };

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculatePurchaseOrderTotal(lines: Array<{ quantity: number; unitPrice: number }>) {
  return money(lines.reduce((total, line) => total + money(line.quantity * line.unitPrice), 0));
}

export function calculateDrawPayment(input: { previousCompletedWork: number; currentWork: number; storedMaterials: number; retainagePercent: number; changeOrderAmount?: number }) {
  const gross = money(input.previousCompletedWork + input.currentWork + input.storedMaterials + (input.changeOrderAmount ?? 0));
  const retainage = money(gross * (input.retainagePercent / 100));
  return { gross, retainage, currentPaymentDue: money(Math.max(0, gross - retainage - input.previousCompletedWork)) };
}

async function audited<T>(organizationId: string, actorId: string, action: string, entityType: string, entityId: string, after: unknown, work: () => Promise<T>) {
  const result = await work();
  await logAudit({ organizationId, actorId, action: `workflow.${action}`, entityType, entityId, after, source: 'workflow-data' });
  return result;
}

export async function createBid(organizationId: string, actorId: string, input: { title: string; customerId?: string; projectId?: string; estimateId?: string; scope?: string; bidDate?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => audited(organizationId, actorId, 'bid.created', 'bid', (await client.query<{ id: string }>(`INSERT INTO bids (organization_id, customer_id, project_id, estimate_id, title, scope, bid_date, due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING id::text`, [input.customerId ?? null, input.projectId ?? null, input.estimateId ?? null, input.title, input.scope ?? '', input.bidDate ?? null, input.dueDate ?? null])).rows[0].id, input, async () => ({ ok: true })));
  });
}

export async function createPurchaseOrder(organizationId: string, actorId: string, input: { projectId: string; vendorId: string; poNumber: string; lines: Array<{ materialItemId?: string; costCodeId?: string; description: string; quantity: number; unit: string; unitPrice: number }> }) {
  const total = calculatePurchaseOrderTotal(input.lines);
  return withTenant(organizationId, async (client) => {
    const po = await client.query<{ id: string }>(`INSERT INTO purchase_orders (organization_id, project_id, vendor_id, po_number, total_amount) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4) RETURNING id::text`, [input.projectId, input.vendorId, input.poNumber, total]);
    for (const line of input.lines) {
      const lineTotal = money(line.quantity * line.unitPrice);
      await client.query(`INSERT INTO purchase_order_lines (organization_id,purchase_order_id,material_item_id,cost_code_id,description,quantity,unit,unit_price,line_total) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8)`, [po.rows[0].id, line.materialItemId ?? null, line.costCodeId ?? null, line.description, line.quantity, line.unit, line.unitPrice, lineTotal]);
    }
    await logAudit({ organizationId, actorId, action: 'workflow.purchase_order.created', entityType: 'purchase_order', entityId: po.rows[0].id, after: { ...input, total }, source: 'workflow-data' });
    return { id: po.rows[0].id, total };
  });
}

export async function createSchedule(organizationId: string, actorId: string, input: { projectId: string; name: string; calloutHoursBeforeStart?: number }) {
  return withTenant(organizationId, async (client) => {
    const result = await client.query<{ id: string }>(`INSERT INTO schedules (organization_id,project_id,name,callout_hours_before_start) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3) RETURNING id::text`, [input.projectId, input.name, input.calloutHoursBeforeStart ?? 4]);
    await logAudit({ organizationId, actorId, action: 'workflow.schedule.created', entityType: 'schedule', entityId: result.rows[0].id, after: input, source: 'workflow-data' });
    return result.rows[0];
  });
}

export async function createRfi(organizationId: string, actorId: string, input: { projectId: string; subject: string; question: string; requesterId?: string; assigneeId?: string; priority?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM rfis WHERE organization_id = current_setting(\'app.current_organization_id\')::uuid AND project_id = $1 FOR UPDATE', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO rfis (organization_id,project_id,number,subject,question,requester_id,assignee_id,priority,due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8) RETURNING id::text,number`, [input.projectId, next.rows[0].number, input.subject, input.question, input.requesterId ?? null, input.assigneeId ?? null, input.priority ?? 'normal', input.dueDate ?? null]);
    await logAudit({ organizationId, actorId, action: 'workflow.rfi.created', entityType: 'rfi', entityId: result.rows[0].id, after: input, source: 'workflow-data' });
    return result.rows[0];
  });
}

export async function createSubmittal(organizationId: string, actorId: string, input: { projectId: string; title: string; specificationReference?: string; responsiblePartyId?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM submittals WHERE organization_id = current_setting(\'app.current_organization_id\')::uuid AND project_id = $1 FOR UPDATE', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO submittals (organization_id,project_id,number,title,specification_reference,responsible_party_id,due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6) RETURNING id::text,number`, [input.projectId, next.rows[0].number, input.title, input.specificationReference ?? null, input.responsiblePartyId ?? null, input.dueDate ?? null]);
    await logAudit({ organizationId, actorId, action: 'workflow.submittal.created', entityType: 'submittal', entityId: result.rows[0].id, after: input, source: 'workflow-data' });
    return result.rows[0];
  });
}

export async function createChangeOrder(organizationId: string, actorId: string, input: { projectId: string; contractId?: string; reason: string; description: string; requestedAmount: number; costImpact?: number; scheduleImpactDays?: number }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM change_orders WHERE organization_id = current_setting(\'app.current_organization_id\')::uuid AND project_id = $1 FOR UPDATE', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO change_orders (organization_id,project_id,contract_id,number,reason,description,requested_amount,cost_impact,schedule_impact_days,status,created_by) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,'draft',$9) RETURNING id::text,number`, [input.projectId, input.contractId ?? null, next.rows[0].number, input.reason, input.description, input.requestedAmount, input.costImpact ?? input.requestedAmount, input.scheduleImpactDays ?? 0, actorId]);
    await logAudit({ organizationId, actorId, action: 'workflow.change_order.created', entityType: 'change_order', entityId: result.rows[0].id, after: input, source: 'workflow-data' });
    return result.rows[0];
  });
}

export async function createDrawApplication(organizationId: string, actorId: string, input: { projectId: string; contractId: string; scheduledValue: number; previousCompletedWork: number; currentWork: number; storedMaterials: number; retainagePercent: number; changeOrderAmount?: number }) {
  const totals = calculateDrawPayment(input);
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(application_number),0)+1 AS number FROM draw_applications WHERE organization_id = current_setting(\'app.current_organization_id\')::uuid AND project_id = $1 FOR UPDATE', [input.projectId]);
    const result = await client.query<{ id: string; application_number: number }>(`INSERT INTO draw_applications (organization_id,project_id,contract_id,application_number,scheduled_value,previous_completed_work,current_work,stored_materials,retainage_percent,change_order_amount,current_payment_due) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id::text,application_number`, [input.projectId, input.contractId, next.rows[0].number, input.scheduledValue, input.previousCompletedWork, input.currentWork, input.storedMaterials, input.retainagePercent, input.changeOrderAmount ?? 0, totals.currentPaymentDue]);
    await logAudit({ organizationId, actorId, action: 'workflow.draw.created', entityType: 'draw_application', entityId: result.rows[0].id, after: { ...input, totals }, source: 'workflow-data' });
    return { ...result.rows[0], totals };
  });
}

export async function createComplianceItem(organizationId: string, actorId: string, input: { projectId: string; requirement: string; dueDate?: string; responsiblePartyId?: string; evidenceDocumentId?: string }) {
  return withTenant(organizationId, async (client) => {
    const result = await client.query<{ id: string }>(`INSERT INTO compliance_items (organization_id,project_id,requirement,due_date,responsible_party_id,evidence_document_id) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5) RETURNING id::text`, [input.projectId, input.requirement, input.dueDate ?? null, input.responsiblePartyId ?? null, input.evidenceDocumentId ?? null]);
    await logAudit({ organizationId, actorId, action: 'workflow.compliance.created', entityType: 'compliance_item', entityId: result.rows[0].id, after: input, source: 'workflow-data' });
    return result.rows[0];
  });
}
