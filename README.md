# Production persistence

When `DATABASE_URL` and `DEFAULT_ORGANIZATION_ID` are configured, project and member operations use PostgreSQL with organization-scoped row-level security. Without those variables, local development uses the deterministic in-memory seed data.

```bash
export DATABASE_URL=postgresql://...
export DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000000
npm run db:migrate
npm run build
npm run test
```
