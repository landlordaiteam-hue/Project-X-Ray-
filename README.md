# Capital X-RAY

Phase 1 provides the executable foundation only. It does not claim that construction modules, Xena, agents, integrations, payroll, safety, RFIs, submittals, or billing are implemented.

## Setup

Requirements: Node.js 20+, npm, and Docker.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`, `http://localhost:3000/api/health`, and `http://localhost:3000/api/ready`.

## Database

`DATABASE_URL` controls the PostgreSQL connection. Migrations are versioned SQL files in `db/migrations/` and tracked in `schema_migrations`.

```bash
npm run db:migrate
npm run db:reset
npm run db:seed
```

The development seed creates `admin@capitalxray.local` with password `Password123!`. This is development-only data; do not use it in production.

## Development and verification

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Foundation architecture

- `app/` contains the App Router shell and API routes.
- `src/lib/db.ts` owns the PostgreSQL pool and tenant-scoped transactions.
- `src/lib/auth.ts` owns password hashing and signed JWT verification.
- `src/lib/rbac.ts` defines server-side role permissions.
- PostgreSQL row-level security protects projects, project members, and audit logs using the transaction-local `app.current_organization_id` setting.
- `src/lib/audit.ts` writes significant events to `audit_logs`.
- `MASTER_SPEC.md` remains the authoritative product specification; code is the source of truth for current implementation.

No external integrations, AI agents, Xena actions, or advanced construction workflows are simulated by Phase 1.
