# Project-X-Ray-

Master engineering and product specification for Capital X-RAY Construction OS, defining the architecture, workflows, financial systems, safety, procurement, Xena intelligence, functional X-RAY agents, integrations, security, and implementation roadmap.

## Phase 2 workspace foundation

This branch establishes the workspace foundation for the Capital X-RAY operations platform.

### Included

- a valid Next.js App Router shell
- a project dashboard and detail view
- project CRUD and member management API routes
- a shared project data source for UI and API consistency
- RBAC and auth helper scaffolding

### Starting locally

```bash
npm install
npm run dev
```

### Useful scripts

```bash
npm run build
npm run test
npm run lint
```

### Notes

The project currently uses a lightweight in-memory data source to keep the foundation stable while the full database-backed implementation is added.

