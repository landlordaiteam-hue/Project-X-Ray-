import { Pool, type PoolClient, type QueryResult } from 'pg';

export const DEFAULT_DATABASE_URL = 'postgresql://capitalxray:capitalxray@localhost:5432/capitalxray';

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export function runQuery<T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTenant<T>(organizationId: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_organization_id', $1, true)", [organizationId]);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function databaseHealthCheck() {
  const startedAt = Date.now();
  const result = await pool.query<{ ok: number }>('SELECT 1 AS ok');
  return { ok: result.rowCount === 1 && result.rows[0].ok === 1, latencyMs: Date.now() - startedAt };
}
