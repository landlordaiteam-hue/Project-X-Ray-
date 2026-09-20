export function tenantMatches(actual: string | null | undefined, expected: string | null | undefined): boolean { return Boolean(actual && expected && actual === expected); }
export function assertTenantAccess(actual: string | null | undefined, expected: string | null | undefined): void { if (!tenantMatches(actual, expected)) throw new Error('Tenant access denied'); }
