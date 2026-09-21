export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

export async function runQuery<T>(
  _query: string,
  _params: unknown[] = []
): Promise<QueryResult<T>> {
  return { rows: [], rowCount: 0 };
}

export async function withTenant<T>(
  _organizationId: string,
  callback: (client: {
    query: <R = unknown>(sql: string, params?: unknown[]) => Promise<QueryResult<R>>;
  }) => Promise<T>
): Promise<T> {
  const client = {
    query: async <R = unknown>() => ({ rows: [] as R[], rowCount: 0 })
  };

  return callback(client);
}
