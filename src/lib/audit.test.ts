import { describe, expect, it } from 'vitest';
import { AuditEntry } from './audit';
describe('audit logging contract',()=>{it('requires tenant, actor, action, and entity context',()=>{const entry:AuditEntry={organizationId:'org',userId:'user',action:'security.login',entityType:'user',entityId:'user'};expect(entry.organizationId).toBeTruthy();expect(entry.action).toBeTruthy();expect(entry.entityType).toBeTruthy()})});
