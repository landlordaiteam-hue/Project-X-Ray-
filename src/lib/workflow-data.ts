import { query, withTenant } from './db';
import { logAudit } from './audit';
import { calculateEstimateLine, calculateEstimateTotal, type EstimateLineInput } from './construction-data';

export { calculateEstimateLine, calculateEstimateTotal };

export function calculatePurchaseOrderTotal(lines: Array<{ quantity: number; unitPrice: number }>) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}

export function calculateDrawPayment(input: { previousCompletedWork: number; currentWork: number; storedMaterials: number; retainagePercent: number; changeOrderAmount?: number }) {
  const gross = input.previousCompletedWork + input.currentWork + input.storedMaterials + (input.changeOrderAmount ?? 0);
  const retainage = gross * (input.retainagePercent / 100);
  return { gross, retainage, currentPaymentDue: Math.max(0, gross - retainage - input.previousCompletedWork) };
}

async function workflowAudit(organizationId: string, actorId: string, entityType: string, entityId: string, action: string, afterState: unknown) {
  await logAudit({ organizationId, actorId, action: `workflow.${action}`, entityType, entityId, after: afterState, source: 'workflow-data' });
}

export async function createBid(organizationId: string, actorId: string, input: { title: string; customerId?: string; projectId?: string; estimateId?: string; scope?: string; bidDate?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => {
    const result = await client.query<{ id: string; status: string }>(`INSERT INTO bids (organization_id, customer_id, project_id, estimate_id, title, scope, bid_date, due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING id::text,status`, [input.customerId ?? null, input.projectId ?? null, input.estimateId ?? null, input.title, input.scope ?? '', input.bidDate ?? null, input.dueDate ?? null]);
    await workflowAudit(organizationId, actorId, 'bid', result.rows[0].id, 'created', input);
    return result.rows[0];
  });
}

export async function createPurchaseOrder(organizationId: string, actorId: string, input: { projectId: string; vendorId: string; poNumber: string; lines: Array<{ materialItemId?: string; costCodeId?: string; description: string; quantity: number; unit: string; unitPrice: number }> }) {
  const total = calculatePurchaseOrderTotal(input.lines);
  return withTenant(organizationId, async (client) => {
    const po = await client.query<{ id: string }>(`INSERT INTO purchase_orders (organization_id, project_id, vendor_id, po_number, total_amount) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4) RETURNING id::text`, [input.projectId, input.vendorId, input.poNumber, total]);
    for (const line of input.lines) await client.query(`INSERT INTO purchase_order_lines (organization_id,purchase_order_id,material_item_id,cost_code_id,description,quantity,unit,unit_price,line_total) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8)`, [po.rows[0].id, line.materialItemId ?? null, line.costCodeId ?? null, line.description, line.quantity, line.unit, line.unitPrice, line.quantity * line.unitPrice]);
    await workflowAudit(organizationId, actorId, 'purchase_order', po.rows[0].id, 'created', { ...input, total });
    return { id: po.rows[0].id, total };
  });
}

export async function createSchedule(organizationId: string, actorId: string, input: { projectId: string; name: string; calloutHoursBeforeStart?: number }) {
  return withTenant(organizationId, async (client) => {
    const result = await client.query<{ id: string }>(`INSERT INTO schedules (organization_id,project_id,name,callout_hours_before_start) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3) RETURNING id::text`, [input.projectId, input.name, input.calloutHoursBeforeStart ?? 4]);
    await workflowAudit(organizationId, actorId, 'schedule', result.rows[0].id, 'created', input);
    return result.rows[0];
  });
}

export async function createRfi(organizationId: string, actorId: string, input: { projectId: string; subject: string; question: string; requesterId?: string; assigneeId?: string; priority?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM rfis WHERE project_id = $1', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO rfis (organization_id,project_id,number,subject,question,requester_id,assignee_id,priority,due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8) RETURNING id::text,number`, [input.projectId, next.rows[0].number, input.subject, input.question, input.requesterId ?? null, input.assigneeId ?? null, input.priority ?? 'normal', input.dueDate ?? null]);
    await workflowAudit(organizationId, actorId, 'rfi', result.rows[0].id, 'created', input);
    return result.rows[0];
  });
}

export async function createSubmittal(organizationId: string, actorId: string, input: { projectId: string; title: string; specificationReference?: string; responsiblePartyId?: string; dueDate?: string }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM submittals WHERE project_id = $1', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO submittals (organization_id,project_id,number,title,specification_reference,responsible_party_id,due_date) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6) RETURNING id::text,number`, [input.projectId, next.rows[0].number, input.title, input.specificationReference ?? null, input.responsiblePartyId ?? null, input.dueDate ?? null]);
    await workflowAudit(organizationId, actorId, 'submittal', result.rows[0].id, 'created', input);
    return result.rows[0];
  });
}

export async function createChangeOrder(organizationId: string, actorId: string, input: { projectId: string; contractId?: string; reason: string; description: string; requestedAmount: number; costImpact?: number; scheduleImpactDays?: number }) {
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(number),0)+1 AS number FROM change_orders WHERE project_id = $1', [input.projectId]);
    const result = await client.query<{ id: string; number: number }>(`INSERT INTO change_orders (organization_id,project_id,contract_id,number,reason,description,requested_amount,cost_impact,schedule_impact_days,status,created_by) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,'draft',$9) RETURNING id::text,number`, [input.projectId, input.contractId ?? null, next.rows[0].number, input.reason, input.description, input.requestedAmount, input.costImpact ?? input.requestedAmount, input.scheduleImpactDays ?? 0, actorId]);
    await workflowAudit(organizationId, actorId, 'change_order', result.rows[0].id, 'created', input);
    return result.rows[0];
  });
}

export async function createDrawApplication(organizationId: string, actorId: string, input: { projectId: string; contractId: string; scheduledValue: number; previousCompletedWork: number; currentWork: number; storedMaterials: number; retainagePercent: number; changeOrderAmount?: number }) {
  const totals = calculateDrawPayment(input);
  return withTenant(organizationId, async (client) => {
    const next = await client.query<{ number: number }>('SELECT COALESCE(MAX(application_number),0)+1 AS number FROM draw_applications WHERE project_id = $1', [input.projectId]);
    const result = await client.query<{ id: string; application_number: number }>(`INSERT INTO draw_applications (organization_id,project_id,contract_id,application_number,scheduled_value,previous_completed_work,current_work,stored_materials,retainage_percent,change_order_amount,current_payment_due) VALUES (current_setting('app.current_organization_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id::text,application_number`, [input.projectId, input.contractId, next.rows[0].number, input.scheduledValue, input.previousCompletedWork, input.currentWork, input.storedMaterials, input.retainagePercent, input.changeOrderAmount ?? 0, totals.currentPaymentDue]);
    await workflowAudit(organizationId, actorId, 'draw_application', result.rows[0].id, 'created', { ...input, totals });
    return { ...result.rows[0], totals };
  });
}
