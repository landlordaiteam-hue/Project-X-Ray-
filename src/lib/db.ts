export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

export function createQueryResult<T>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length };
}

export async function runQuery<T>(
  _query: string,
  _params: unknown[] = []
): Promise<QueryResult<T>> {
  return createQueryResult<T>([]);
}

export async function withTenant<T>(
  _organizationId: string,
  callback: (client: {
    query: <R = unknown>(sql: string, params?: unknown[]) => Promise<QueryResult<R>>;
  }) => Promise<T>
): Promise<T> {
  const client = {
    query: async <R = unknown>(_sql: string, _params?: unknown[]) => createQueryResult<R>([])
  };

  return callback(client);
}
