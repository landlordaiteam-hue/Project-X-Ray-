import { query, withTenant } from './db';

export type AuditActorType = 'user' | 'system' | 'agent';
export type AuditEntry = {
  organizationId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorType?: AuditActorType;
  source?: string;
  requestId?: string | null;
  ipAddress?: string | null;
  before?: unknown;
  after?: unknown;
  details?: unknown;
};

function safeJson(value: unknown) {
  return value === undefined ? null : JSON.stringify(value);
}

export async function logAudit(entry: AuditEntry) {
  return withTenant(entry.organizationId, async (client) => {
    const result = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO audit_logs
        (organization_id, actor_id, actor_type, action, entity_type, entity_id, source,
         request_id, ip_address, before_state, after_state, details)
       VALUES (current_setting('app.current_organization_id')::uuid, $1, $2, $3, $4, $5, $6,
               $7, $8, $9::jsonb, $10::jsonb, $11::jsonb)
       RETURNING id::text, created_at::text`,
      [entry.actorId ?? null, entry.actorType ?? 'system', entry.action, entry.entityType,
       entry.entityId ?? null, entry.source ?? null, entry.requestId ?? null,
       entry.ipAddress ?? null, safeJson(entry.before), safeJson(entry.after), safeJson(entry.details)]
    );
    return result.rows[0];
  });
}

export async function logAuditBestEffort(entry: AuditEntry) {
  try {
    return await logAudit(entry);
  } catch (error) {
    console.error('Audit write failed', { action: entry.action, entityType: entry.entityType, error });
    return null;
  }
}

export async function listAuditLogs(organizationId: string, limit = 100) {
  return query(`SELECT id::text, actor_id::text, actor_type, action, entity_type, entity_id::text,
    source, request_id, created_at, before_state, after_state, details
    FROM audit_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2`, [organizationId, Math.min(Math.max(limit, 1), 500)]);
}
