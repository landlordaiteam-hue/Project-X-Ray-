export type AuditEntry = Record<string, unknown>;

export async function logAudit(entry: AuditEntry) {
  return entry;
}
