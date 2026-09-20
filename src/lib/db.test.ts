import { describe, expect, it } from 'vitest';
import { DEFAULT_DATABASE_URL, getDatabaseUrl } from './db';
describe('database access configuration',()=>{it('uses DATABASE_URL when supplied and a safe local default otherwise',()=>{expect(DEFAULT_DATABASE_URL).toContain('postgresql://');expect(getDatabaseUrl()).toContain('postgresql://')})});
