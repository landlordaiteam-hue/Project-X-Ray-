# Project-X-Ray-

Master engineering and product specification for Capital X-RAY Construction OS, defining the architecture, workflows, financial systems, safety, procurement, Xena intelligence, functional X-RAY agents, integrations, security, and implementation roadmap.

## Phase 2 workspace foundation

This branch establishes a stable workspace foundation for the Capital X-RAY operations platform.

### Included

- valid Next.js App Router shell
- shared project data layer backed by a lightweight persistent store
- project dashboard and project detail views
- project CRUD and member management API routes
- RBAC/auth helper scaffolding and data validation hooks

### Getting started

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

### Data model note

The workspace currently uses a lightweight persistent JSON store under `.data/projects.json` to keep the foundation stable while the production DB-backed implementation is added.
