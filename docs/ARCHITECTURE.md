# Capital X-RAY Architecture

**Status:** Technical implementation plan; design only

**Authoritative inputs:** `MASTER_SPEC.md` and `docs/IMPLEMENTATION-AUDIT.md`

**Scope:** Define the next-phase architecture without modifying application code. This document preserves the existing project workspace while establishing the foundation required for the complete Capital X-RAY construction operating system.

## 1. Architectural principles

1. **Evidence over appearance.** A screen, type, route, or configuration is not considered functional until its service, persistence, authorization, error handling, and tests exist.
2. **Tenant isolation by default.** Every tenant-owned record carries an organization boundary. Repository methods require tenant context; callers cannot opt out.
3. **Server authority.** API and service layers enforce identity, permissions, workflow transitions, and validation. UI checks are advisory only.
4. **Auditable mutation.** Important writes, approvals, external calls, agent actions, and security events emit immutable audit records.
5. **Explicit integration state.** Providers are either configured and verified or unavailable. The system must never display a fake connected state.
6. **Human-supervised automation.** Agents may recommend and prepare actions, but consequential operations require explicit policy-based authorization or human approval.
7. **Preserve working code.** The existing project list/detail and project/member contracts remain the first vertical slice. New domains are added behind services rather than rewriting the working UI unnecessarily.
8. **Operational failure visibility.** Every asynchronous operation has an observable state, retry policy, idempotency strategy, and escalation path.

## 2. System boundaries and deployment shape

The existing Next.js App Router application remains the web/API boundary. PostgreSQL remains the system of record. Supabase may provide managed PostgreSQL, object storage, and auth only when explicitly configured and verified; it is not assumed merely because the specification names it.

Recommended logical components:

- **Web application:** Next.js pages, server components, route handlers, and server actions.
- **Application services:** domain-oriented TypeScript services for projects, financials, workforce, schedules, procurement, safety, documents, notifications, and approvals.
- **Persistence:** PostgreSQL repositories and migrations with organization-scoped queries and RLS where appropriate.
- **Object storage:** private bucket/object storage for documents and evidence; database stores metadata and immutable references.
- **Worker runtime:** background job process for notifications, imports, scheduled checks, document processing, and eventually agents.
- **Provider adapters:** isolated adapters for configured providers such as email, SMS, weather, storage, payroll, accounting, and Google services.
- **Agent runtime:** future bounded execution service that consumes approved tools and real domain services; not implemented in this phase.

The first implementation phase should remain deployable as a modular monolith. Introduce separate workers before introducing separate network services.

## 3. Cross-cutting data conventions

All tenant-owned tables should include:

- `id` as UUID or another non-guessable identifier
- `organization_id` with a foreign key to `organizations`
- `created_at`, `updated_at`, and where applicable `created_by`, `updated_by`
- lifecycle/status fields represented by constrained values
- unique constraints scoped by organization
- indexes beginning with `organization_id` for tenant queries

Cross-domain references should use foreign keys. Financial values use fixed-precision numeric types, never floating point. Timestamps are stored in UTC. Files are referenced by opaque object keys, not client-provided filesystem paths. State transitions are explicit and validated by services.

Recommended shared entities:

- `organizations`
- `users`
- `organization_memberships`
- `roles`
- `permissions`
- `role_permissions`
- `audit_logs`
- `approval_requests`
- `approval_steps`
- `notifications`
- `integration_connections`
- `outbox_events`
- `idempotency_keys`

## 4. Authentication

### Purpose
Provide verified identity, secure sessions, organization membership, and account lifecycle management. Replace the current header/demo identity mechanism before production use.

### Database entities

- `users`: external subject or internal ID, email, name, status, last login, timestamps.
- `user_identities`: provider, provider subject, verified status, provider metadata.
- `sessions` or provider-managed session records.
- `organization_memberships`: user, organization, membership status, default organization.
- `mfa_factors` and recovery records if MFA is enabled.

### Relationships

A user may belong to many organizations through memberships. A membership grants organization roles and project assignments; a request resolves one active organization context.

### API/service responsibilities

- Resolve the authenticated user from a verified session or bearer token.
- Reject missing, expired, revoked, or malformed credentials.
- Resolve the active organization only from an authorized membership, never from an untrusted header alone.
- Provide login, logout, session refresh, invitation, password reset, and membership-management services as the selected auth strategy requires.

### Authorization requirements

Authentication establishes identity only. Organization membership and permissions are separate checks. Support session revocation and deny suspended users.

### Security requirements

Use secure, HTTP-only, same-site cookies or a vetted token strategy; hash passwords with a modern password hash if locally managed; protect CSRF for cookie mutations; never expose secrets or service credentials to client bundles; rate-limit login and recovery endpoints.

### Audit requirements

Record login success/failure, logout, session revocation, invitation, membership changes, MFA changes, and suspicious authentication events without storing raw secrets or tokens.

### Dependencies

Chosen auth provider, secure environment variables, user/membership schema, email provider for invitations/recovery, and request middleware.

### Failure handling

Fail closed on identity-provider errors for protected operations. Return a stable 401/403 response, do not silently fall back to demo headers in production, and expose provider outages to operations telemetry.

### Testing requirements

Test expired/revoked sessions, organization switching, suspended memberships, privilege boundaries, CSRF/session-cookie behavior, rate limits, and no-secret exposure.

## 5. Multi-tenant organization model

### Purpose
Isolate each construction company’s users, projects, financial records, documents, agents, configurations, and audit history.

### Database entities

- `organizations`: legal/display name, status, timezone, locale, configuration.
- `organization_memberships`: user, organization, membership status, default role.
- `project_memberships`: user or employee assignment to a project and scope.
- `organization_settings`: notification, workflow, call-out, language, and integration settings.

Every tenant-owned domain table includes `organization_id` and foreign keys prevent cross-tenant references.

### Relationships

`organizations` owns memberships and all tenant-scoped records. Projects, employees, vendors, financials, documents, notifications, approvals, and agent records belong to one organization. Cross-tenant joins are prohibited by repository contracts.

### API/service responsibilities

Resolve tenant context once per request, validate membership, pass a typed tenant context into every service, and apply organization-scoped filters in repositories. Organization administration manages invitations, roles, settings, and integration connections.

### Authorization requirements

A user must be an active member of the organization. Project-scoped access additionally requires project membership or an organization-level permission. Service-account and agent access must be explicitly scoped.

### Security requirements

Use PostgreSQL RLS as defense in depth, but do not rely on RLS alone. Use transaction-local tenant settings where RLS policies require them. Prohibit client-provided organization IDs unless validated against membership.

### Audit requirements

Log organization creation, membership changes, role changes, settings changes, cross-scope denials, and tenant-context failures.

### Dependencies

Authentication, membership tables, RLS policies, repository conventions, migration tooling, and integration configuration.

### Failure handling

Missing or ambiguous tenant context fails closed. Cross-tenant foreign-key or query failures are treated as security incidents and logged with minimal diagnostic data.

### Testing requirements

Run cross-tenant isolation tests against every repository, RLS tests using separate organization fixtures, project-membership boundary tests, and organization-switching tests.

## 6. Users, roles, RBAC, and permission enforcement

### Purpose
Provide least-privilege, server-side authorization for human users, service accounts, and future agents.

### Database entities

- `roles`, `permissions`, `role_permissions`
- `organization_membership_roles`
- optional `project_role_assignments`
- `agent_permissions` or agent-to-permission bindings in the future
- `approval_policies`

Use stable permission names such as `project.read`, `project.write`, `project_member.manage`, `financial.approve`, `safety.escalate`, and `agent.execute`.

### Relationships

Roles grant permissions within an organization. Project assignments narrow access. A role never grants access outside its organization. Agent permissions are separate from user roles and are explicitly allow-listed.

### API/service responsibilities

Provide `authorize(subject, action, resource)` at the service boundary, not only in route handlers. Centralize role/permission evaluation, resource ownership checks, and approval-policy checks. Return consistent forbidden responses.

### Authorization requirements

Enforce permissions for reads that expose sensitive data and all mutations. Do not infer elevated permissions from UI state, headers, or role labels. Destructive, financial, payroll, external-communication, and safety actions require explicit permissions and often approval.

### Security requirements

Deny by default, normalize permission names, prevent privilege escalation through editable role data, and require reauthorization for sensitive operations where appropriate.

### Audit requirements

Record role and permission changes, authorization denials for sensitive resources, approval decisions, and actor identity for each mutation.

### Dependencies

Authentication, organization membership, resource repositories, approval workflow, and audit logging.

### Failure handling

If permission data cannot be resolved, deny the operation. If a policy is missing for a consequential action, require manual administrative configuration rather than guessing.

### Testing requirements

Matrix-test each role against each protected endpoint and service method; test project scoping, wildcard removal/handling, denied-by-default behavior, and agent least privilege.

## 7. PostgreSQL/Supabase data architecture

### Purpose
Make PostgreSQL the authoritative transactional store and provide a migration-safe foundation for all master-spec domains.

### Database entities

Start with the shared entities above, then add domain schemas for clients/contacts, projects, estimates/bids, employees/time, schedules, vendors/procurement, costs/billing, documents, RFIs/submittals, safety/compliance, messaging/notifications, approvals, and agents.

### Relationships

Use explicit foreign keys from every domain record to its organization and parent project where applicable. Financial records reference cost codes and source documents. Documents and audit entries reference source objects polymorphically only where a constrained relation table is not practical.

### API/service responsibilities

- Versioned migrations with an applied-migration ledger.
- Repository methods with typed inputs/outputs.
- Transactions for multi-record mutations.
- Outbox events for asynchronous work.
- Idempotency for external callbacks and retried commands.
- Read models/materialized views for dashboards only after transactional correctness exists.

### Authorization requirements

Repositories accept tenant context and never expose unrestricted generic query functions to request code. Administrative maintenance paths require explicit elevated access.

### Security requirements

TLS connections, least-privilege database users, private network access where possible, encrypted backups, parameterized queries, constrained values, RLS defense in depth, and no direct database credentials in client code.

### Audit requirements

Migration application, schema-reset operations, data imports, and privileged maintenance actions are logged. Domain mutations use the shared audit service.

### Dependencies

PostgreSQL/Supabase project, migration runner, connection pooling, secrets, backup/restore policy, and observability.

### Failure handling

Transactions roll back atomically. Connection failures produce retryable errors only for idempotent operations. Migration failure stops deployment and preserves the failed migration for operator investigation.

### Testing requirements

Migration-up/down or reset tests where supported, schema constraint tests, RLS tests, repository contract tests, transaction rollback tests, and backup/restore drills.

## 8. Audit logging

### Purpose
Provide durable evidence of important human, system, integration, and future agent actions.

### Database entities

`audit_logs`: organization, actor type/user/agent, action, resource type/id, timestamp, source, request/correlation ID, IP/device metadata where appropriate, previous state, new state, related approval, related agent run, and retention/legal-hold fields.

### Relationships

Audit rows belong to an organization and may reference a user, agent run, approval request, project, document, or domain object. Audit records are append-only from application code.

### API/service responsibilities

Expose a narrow audit writer used by services and workers. Redact secrets and sensitive fields, serialize stable event schemas, and support authorized read/search with tenant filtering.

### Authorization requirements

Any authenticated service may emit audit events; only authorized administrators/compliance users may read broad audit history. No normal user may delete or rewrite records.

### Security requirements

Append-only database privileges, tamper-evident retention where required, redaction, restricted access, and correlation IDs across request/worker/provider boundaries.

### Audit requirements

The subsystem audits itself for write failures and retention actions. Audit write failure must not silently disappear for consequential operations.

### Dependencies

Database, request context, service layer, worker/outbox, and retention policy.

### Failure handling

For critical mutations, fail the mutation if the required audit event cannot be durably written. For non-critical telemetry, queue and retry while exposing degraded audit health.

### Testing requirements

Verify audit records for create/update/delete/approve/deny/external-call paths, redaction, tenant visibility, append-only behavior, and audit-outage behavior.

## 9. Project data model

### Purpose
Preserve the existing project workspace while expanding it into the central operational aggregate for the construction lifecycle.

### Database entities

Core: `projects`, `project_members`, `clients`, `contacts`, `contracts`, `budgets`, `cost_codes`, `project_locations`, `project_status_history`, and project links to documents, estimates, schedules, vendors, RFIs, submittals, safety, change orders, and communications.

### Relationships

A project belongs to one organization and may have one client/contract, many members, locations, documents, work items, financial records, and workflow records. Project IDs are stable; display codes are organization-unique and immutable or change-controlled.

### API/service responsibilities

Retain existing list/detail/create/update/delete/member behavior as the first vertical slice. Add repositories and services for lifecycle state, project membership, client/contract linkage, summary views, and related-domain navigation. Do not make UI mock cards stand in for related functionality.

### Authorization requirements

Read access requires organization/project scope. Writes require project-management permission. Deletion should be soft-delete or explicit archival after dependencies exist; destructive deletion requires approval.

### Security requirements

Validate project identifiers, enforce tenant and membership scope, protect financial and document relationships, and avoid returning fields a role cannot see.

### Audit requirements

Audit project creation, status changes, membership changes, code/name changes, archival, and linked financial/contract changes.

### Dependencies

Tenant/RBAC foundation, client and contract domains, documents, financials, workforce, scheduling, and approval workflow.

### Failure handling

Use transactions for project-plus-related mutations. Reject inconsistent status transitions and preserve history when related records prevent deletion.

### Testing requirements

Contract tests for current project APIs, tenant isolation, duplicate constraints, member boundaries, lifecycle transitions, and regression tests proving existing project functionality remains intact.

## 10. API and service architecture

### Purpose
Separate transport concerns from domain logic and create stable integration points for future agents and mobile clients.

### Database entities

`idempotency_keys`, `outbox_events`, `integration_requests`, and `api_keys` where machine clients are required. Domain entities remain in their bounded contexts.

### Relationships

Route handlers authenticate and validate, then call application services. Services authorize and coordinate repositories. Repositories transact with PostgreSQL. Outbox events trigger workers and notifications.

### API/service responsibilities

Use versioned routes such as `/api/v1`. Define Zod request and response schemas, consistent error codes, pagination, filtering, correlation IDs, and idempotency for retried writes. Keep business rules out of page components and route handlers.

### Authorization requirements

Every protected route authenticates, resolves organization context, authorizes action/resource, validates input, and filters output. Internal worker calls use service identity and scoped credentials.

### Security requirements

Rate-limit sensitive endpoints, parameterize SQL, validate uploads, enforce content-size limits, protect webhooks with signatures, and never trust client-supplied role or organization fields.

### Audit requirements

Log significant commands, authorization denials, external calls, and workflow transitions; avoid logging credentials and sensitive payloads.

### Dependencies

Auth, RBAC, repositories, schema validation, observability, migration system, and worker/outbox.

### Failure handling

Return stable 4xx errors for caller faults and traceable 5xx errors for server faults. Use retries only in workers/provider adapters; make mutation retries idempotent.

### Testing requirements

OpenAPI/contract tests, request validation, authorization matrix, error-shape, rate-limit, idempotency, webhook signature, and integration tests.

## 11. Document storage architecture

### Purpose
Store project documents, drawings, evidence, invoices, plans, safety records, and versions without putting binary content in PostgreSQL.

### Database entities

- `documents`: organization, project, category, title, current version, access policy, metadata.
- `document_versions`: immutable object key, size, checksum, MIME type, uploader, extracted metadata, created time.
- `document_links`: links to RFIs, submittals, incidents, contracts, invoices, and other records.
- `document_processing_jobs`: ingestion/OCR/indexing state.

### Relationships

A document belongs to an organization and may be associated with a project. Each version points to a private object-storage key. Links are permission-checked through both document and parent resource scope.

### API/service responsibilities

Issue short-lived upload/download URLs after authorization, verify checksums and MIME type, create metadata records transactionally, support versioning, and enqueue optional extraction/indexing. Preserve originals.

### Authorization requirements

Object URLs are never public by default. Downloads require resource permission. Document shares are explicit, time-bound, and auditable.

### Security requirements

Private buckets, malware/content scanning where available, size/type limits, encryption, signed URLs, path traversal prevention, retention rules, and safe preview generation.

### Audit requirements

Log upload, version creation, download/share, metadata changes, deletion/archive, processing, and access denials.

### Dependencies

Configured object storage provider, database, virus scanning/preview service, and search/indexing when introduced.

### Failure handling

Orphan cleanup reconciles uploaded objects and metadata. Processing failures remain visible and retryable; original files remain available even if extraction fails.

### Testing requirements

Upload authorization, tenant isolation, checksum/type rejection, signed URL expiry, version ordering, failed processing, orphan reconciliation, and large-file behavior.

## 12. Approval workflow architecture

### Purpose
Provide explicit human authorization for purchases, payments, payroll changes, contract/change-order changes, destructive actions, external communications, and configured safety escalations.

### Database entities

- `approval_policies`: organization, action/resource type, thresholds, required roles.
- `approval_requests`: resource, requested action, requester, current state, expiration.
- `approval_steps`: ordered reviewer, decision, reason, timestamps.
- `approval_events`: immutable decision history.

### Relationships

A domain service asks the approval service whether an action requires approval. The request references the domain object and, when approved, returns a capability/decision consumed once by the initiating service.

### API/service responsibilities

Create requests, assign reviewers, notify, approve/reject/expire, enforce ordering and separation of duties, and execute the original mutation only after valid approval. Approvals must not be generic client flags.

### Authorization requirements

Only eligible reviewers can decide. Requesters cannot approve their own consequential action unless policy explicitly permits it. Decisions are scoped to organization and resource.

### Security requirements

Immutable decisions, no client-side approval bypass, replay protection, expiration, explicit version of the approved payload, and reapproval when the payload changes.

### Audit requirements

Record request, policy evaluation, reviewer identity, decision, reason, approved payload hash, execution result, and related notification.

### Dependencies

RBAC, audit logging, notifications, domain services, and idempotency.

### Failure handling

Expired or changed requests require reapproval. Notification failure does not silently approve. Execution failure after approval is visible and retryable without duplicating the mutation.

### Testing requirements

Threshold/policy matrix, separation of duties, approval expiry, payload tampering, duplicate approval, rejected/failed execution, and audit completeness.

## 13. Notification architecture

### Purpose
Deliver in-app, email, SMS, and future push notifications with priority, preferences, digest, and escalation behavior.

### Database entities

- `notifications`: organization, recipient, category, priority, payload/template, status, related resource.
- `notification_preferences`
- `notification_deliveries`: provider, attempt, status, provider ID, error.
- `notification_digests`
- `notification_templates`

### Relationships

Domain events create notification intents through the outbox. A dispatcher resolves user preferences and configured providers. Emergency events bypass normal digest delay while still participating in digest history.

### API/service responsibilities

Create intents, render localized templates, dispatch through configured adapters, deduplicate, retry, record delivery, and expose read/unread state. Emergency/safety digests are scheduled jobs, not UI-only lists.

### Authorization requirements

Only authorized services create high-priority notifications. Users control permitted preferences, but cannot suppress mandatory emergency or compliance notices without policy authority.

### Security requirements

Provider secrets stay server-side, templates are sanitized, links are signed/authorized, phone/email destinations are verified, and sensitive content is minimized.

### Audit requirements

Log notification intent, preference changes, dispatch attempts, provider responses, emergency escalation, and digest generation.

### Dependencies

Outbox/worker, provider adapters, user preferences, scheduling, localization, and verified provider credentials. Twilio/email/push are configuration-dependent and must not be represented as connected without credentials and health checks.

### Failure handling

Retry transient provider errors with backoff, dead-letter permanent failures, expose delivery state, and escalate undelivered emergency notifications through configured fallback policy.

### Testing requirements

Priority ordering, preference behavior, digest timing, emergency bypass, provider mocks, retry/dead-letter behavior, template rendering, and no-recipient scenarios.

## 14. Agent runtime architecture — design only, not implementation

### Purpose
Provide a future bounded runtime for X-RAY agents to inspect real project, financial, workforce, schedule, safety, procurement, document, and compliance data without bypassing application services or authorization.

Agents are explicitly **not implemented in this phase**.

### Database entities

- `agent_definitions`: stable identity, version, responsibility, enabled state, configuration.
- `agent_permissions`: allow-listed service capabilities and resource scope.
- `agent_triggers`: schedule/event/manual trigger definitions.
- `agent_runs`: trigger, inputs reference, status, timestamps, attempt count, outputs reference, error state.
- `agent_actions`: proposed/executed action, permission evaluation, approval request, result.
- `agent_run_events`: state transitions, retries, escalation, and diagnostics.

### Relationships

An organization enables a versioned agent definition. A trigger creates one run. A run may produce observations and proposed actions. Actions call approved application-service tools, may create approval requests, and emit audit events. Agent records are organization-scoped.

### API/service responsibilities

The future runtime will validate trigger payloads, load a versioned agent definition, create a run, provide read-only or explicitly allow-listed tools, persist state, enforce budgets/timeouts, request approval, and publish outcomes. Xena will be a human-facing coordinator, not a direct database operator.

### Authorization requirements

Each agent has explicit permissions narrower than an administrator. Tool calls use the initiating organization and resource scope. Consequential actions require approval policies. Agents may not invent records, fabricate integrations, bypass RBAC, or claim execution without a successful service result.

### Security requirements

Sandbox execution, secret isolation, tool allow-lists, input/output validation, prompt and data boundary controls, timeout/resource limits, immutable run history, and redaction of sensitive inputs/outputs.

### Audit requirements

Every run and action records agent identity/version, trigger, inputs/outputs references, permissions, tool calls, approvals, retries, errors, and resulting changes. The ordinary audit log links back to the run.

### Dependencies

Stable domain services and repositories, RBAC, approval workflows, audit logging, outbox/worker runtime, observability, and explicit model/provider configuration. No agent should be enabled until those dependencies exist.

### Failure handling

Use visible states such as queued, running, waiting_for_approval, succeeded, failed, partially_succeeded, cancelled, and disabled. Implement bounded retries with backoff, idempotent tools, dead-letter handling, human escalation, manual retry, and safe cancellation. A failed agent must never silently mutate partial state.

### Testing requirements

Tool authorization tests, tenant isolation, deterministic fixtures, timeout/retry behavior, approval gates, partial failure recovery, replay/idempotency, prompt/output validation, audit completeness, and disabled-agent behavior.

## 15. Domain expansion required for the complete master specification

The architecture above is intentionally foundational. The following bounded contexts should be added behind the same tenant, service, audit, document, notification, and approval conventions:

- **Estimating/bidding:** opportunities, bids, revisions, estimate lines, cost codes, markup, overhead, contingency, proposals, and conversion to contract/project.
- **Workforce/payroll:** employees, classifications, wage rates, crews, time entries, call-outs with the four-hour default, allocations, exports, and reconciliation. No fabricated payroll transactions.
- **Scheduling:** tasks, milestones, dependencies, shifts, equipment, calendars, constraints, and weather associations.
- **Procurement/vendors:** vendors, products, insurance, compliance, requests, purchase orders, receipts, commitments, receiving, and provider adapters. Home Depot and other vendors remain unavailable until real APIs/credentials are verified.
- **Financials/draws:** budgets, committed/actual costs, forecasts, invoices, payments, schedule of values, retainage, G702/G703 workflow, change-order impact, and approval/audit history.
- **Safety/compliance:** incidents, hazards, inspections, corrective actions, training, PPE, permits, certifications, insurance, expiration alerts, emergency escalation, and OSHA-oriented records without claiming legal compliance automatically.
- **RFIs/submittals/drawings:** explicit state machines, deadlines, attachments, revisions, response/approval history, and document links.
- **Messaging/search:** project channels, direct messages, notifications, permission-aware indexing across approved domains, and tenant-safe search.
- **Closeout:** punch lists, warranties, final documents, retainage, handoff, archive, and lessons learned.

Each context requires its own schema, service, authorization matrix, audit events, failure policy, and tests before being exposed to Xena or agents.

## 16. Recommended implementation sequence

### Phase 1 — Trust and persistence foundation

1. Reconcile the current branch and preserve the working project vertical slice.
2. Select and configure the real authentication strategy; remove production reliance on demo headers.
3. Implement organizations, users, memberships, roles, permissions, and tenant context.
4. Complete PostgreSQL migration tracking, RLS defense in depth, repository conventions, and backup/restore documentation.
5. Add audit logs, correlation IDs, idempotency keys, and outbox events.
6. Add authorization and tenant-isolation test matrices.

### Phase 2 — Project operating core

1. Move project/member persistence behind tenant-aware repositories while preserving current API contracts.
2. Add clients, contacts, contracts, project locations, budgets, cost codes, and project status history.
3. Add document metadata/versioning and private object storage.
4. Add approval requests and notifications as reusable infrastructure.

### Phase 3 — Workforce, schedule, safety, and compliance

1. Implement employees, crews, time entries, call-outs, and labor allocation.
2. Implement schedules, tasks, dependencies, shifts, equipment, and project constraints.
3. Implement safety incidents, emergency reporting, inspections, corrective actions, and compliance records.
4. Add configured weather ingestion only after a real provider is selected and tested.
5. Add mobile field workflows for time, schedule, safety, documents, RFIs, and notifications.

### Phase 4 — Commercial and financial operations

1. Implement bids, estimates, cost breakdowns, pricing, revisions, and approval.
2. Implement vendors, procurement requests, purchase orders, receiving, receipts, and commitments.
3. Implement budgets, actuals, forecasts, invoices, payments, change orders, and profitability.
4. Implement G702/G703 Draw Desk with schedule of values, retainage, supporting documentation, approval, and audit history.
5. Add payroll integration only when a real provider or internal payroll scope is defined.

### Phase 5 — Collaboration and workflow completeness

1. Implement RFIs, submittals, drawings, messaging, global permission-aware search, and closeout.
2. Add configured Google, accounting, payroll, Twilio, storage, and vendor adapters one at a time with health checks and integration tests.
3. Add localization architecture and user language preferences.

### Phase 6 — Agent foundation and Xena

1. Stabilize domain-service APIs and read models; agents must never call raw tables.
2. Implement agent definitions, permissions, triggers, runs, actions, audit links, retries, escalation, and approval gates.
3. Implement one read-only monitoring agent as a controlled pilot.
4. Add Xena as a human-facing coordinator with explicit approval boundaries.
5. Add Project Watchdog and additional specialist agents only after the pilot meets safety, audit, and failure-handling criteria.

### Phase 7 — Operational hardening

1. Expand unit, integration, contract, security, migration, mobile, and provider tests.
2. Run tenant-isolation, restore, disaster-recovery, load, rate-limit, and failure-injection tests.
3. Establish observability dashboards and runbooks for database, workers, notifications, integrations, approvals, and agents.
4. Validate every claimed capability against the master specification and prohibit UI-only or fake-connected states.
