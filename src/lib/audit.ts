import { runQuery } from './db';

export type AuditEntry = { organizationId: string; userId?: string | null; action: string; entityType: string; entityId?: string | null; details?: Record<string, unknown>; source?: string };
export async function logAudit(entry: AuditEntry): Promise<void> {
  await runQuery(`INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details, source) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [entry.organizationId, entry.userId ?? null, entry.action, entry.entityType, entry.entityId ?? null, JSON.stringify(entry.details ?? {}), entry.source ?? 'system']);
}
