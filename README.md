# PostgreSQL persistence

The migration runner now discovers and applies every numbered SQL migration in order, records applied migrations, and skips migrations already applied.

```bash
export DATABASE_URL=postgresql://...
export DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000000
npm run db:migrate
npm run build
npm run test
```

The project service retains an in-memory fallback when database configuration is absent. For production, pass the authenticated organization ID into tenant-scoped repository calls and use `withTenant` for every database transaction.
