# CAPITAL X-RAY

## MASTER ENGINEERING & PRODUCT SPECIFICATION

**Project:** Capital X-RAY Construction OS  
**Repository:** Project-X-Ray-Construction-OS  
**Document:** `MASTER_SPEC.md`  
**Status:** Master Source of Truth  
**Priority:** Highest

---

## 1. SOURCE OF TRUTH

This document is the authoritative product and engineering specification for Capital X-RAY.

All development agents, engineers, designers, contractors, and automated systems must treat this document as the primary source of truth for product intent.

The repository code represents the current implementation.

This document represents the intended system.

The development process must continuously compare:

`SPECIFICATION → CURRENT CODE → GAP ANALYSIS → IMPLEMENTATION → TESTING`

Do not assume that something exists simply because it is described here.

Every feature must be classified as:

- IMPLEMENTED
- PARTIALLY IMPLEMENTED
- PLANNED
- MISSING
- BROKEN
- CONFIGURATION REQUIRED

---

## 2. PRODUCT IDENTITY

Capital X-RAY is the permanent product name.

X-RAY represents the ability to see through the layers of a construction company’s operation.

The system is intended to provide one integrated operating environment for construction companies covering:

- estimating
- bidding
- project management
- labor
- payroll
- scheduling
- procurement
- compliance
- documents
- RFIs
- submittals
- safety
- financial controls
- billing
- change orders
- communication
- field operations
- reporting
- automation
- AI-assisted operations

Capital X-RAY is intended to function as a construction operating system rather than merely a project-management application.

---

## 3. PRIMARY DESIGN PRINCIPLES

The system must be:

- operational
- auditable
- secure
- modular
- multi-tenant
- configurable
- automation-first
- human-supervised
- mobile-friendly
- field-friendly
- financially aware
- failure-aware
- integration-ready

The system must not create the illusion of functionality.

If a feature is not actually implemented, it must be identified as such.

---

## 4. TARGET USERS

Primary users include:

- owners
- executives
- general contractors
- project managers
- estimators
- superintendents
- foremen
- field staff
- accounting personnel
- payroll personnel
- safety personnel
- compliance personnel
- subcontractors
- vendors
- administrators

---

## 5. ROLE-BASED ACCESS CONTROL

Initial roles:

### `exec_admin`

Full organizational access.

### `project_manager`

Project-level management and financial/project controls.

### `field_staff`

Field operations, safety, scheduling, communications, and assigned project information.

Additional roles may be added later.

Permissions must be enforced server-side.

UI visibility alone is not sufficient security.

---

## 6. MULTI-TENANT ARCHITECTURE

Capital X-RAY must support multiple construction companies.

Each tenant must have isolated:

- users
- projects
- financial information
- employees
- vendors
- documents
- communications
- agents
- audit logs
- configurations

Tenant isolation must be enforced at the database and application layers.

---

## 7. TARGET TECHNOLOGY STACK

Target architecture:

- Next.js 14+
- App Router
- React 18+
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- server-side actions/APIs
- Netlify deployment where appropriate
- scheduled/background jobs
- secure environment variables
- REST/GraphQL integrations where appropriate

The coding agent must inspect the existing repository before changing the stack.

Do not rewrite working infrastructure unnecessarily.

---

## 8. CORE DATABASE ENTITIES

The system should support entities including:

- organizations
- users
- roles
- permissions
- projects
- project_members
- clients
- contacts
- employees
- subcontractors
- vendors
- bids
- estimates
- contracts
- budgets
- cost_codes
- cost_transactions
- purchase_orders
- invoices
- payments
- payroll_records
- schedules
- shifts
- time_entries
- RFIs
- submittals
- drawings
- documents
- document_versions
- change_orders
- safety_incidents
- inspections
- compliance_items
- notifications
- messages
- agent_definitions
- agent_runs
- agent_actions
- audit_logs

Actual schema must be reconciled with existing code.

---

## 9. SECURITY

Security must include:

- authentication
- authorization
- tenant isolation
- server-side permission checks
- secure secrets
- encrypted connections
- input validation
- output validation
- audit logging
- rate limiting where appropriate
- secure file handling
- safe AI execution
- least-privilege agent permissions

Never expose secrets to the client.

---

## 10. EXECUTIVE DASHBOARD

The executive dashboard should provide visibility into:

- active projects
- project profitability
- revenue
- expenses
- cash flow
- labor costs
- outstanding invoices
- change orders
- schedule status
- safety
- compliance
- procurement
- project risks
- agent alerts
- critical exceptions

The dashboard should surface exceptions rather than simply displaying large quantities of data.

---

## 11. PROJECT MANAGEMENT

Each project should provide a central operational workspace.

Project information includes:

- project identity
- client
- contract
- budget
- schedule
- workforce
- vendors
- documents
- drawings
- RFIs
- submittals
- change orders
- safety
- financial activity
- communications
- procurement
- reports

---

## 12. BIDDING AND ESTIMATING

The system must support:

- bid creation
- estimate creation
- scope breakdown
- cost codes
- labor estimates
- material estimates
- subcontractor estimates
- markup
- overhead
- contingency
- profit
- proposal generation
- bid revisions
- bid history

Workflow:

`OPPORTUNITY → BID → ESTIMATE → APPROVAL → CONTRACT → PROJECT`

---

## 13. LABOR MANAGEMENT

Labor management should include:

- employees
- classifications
- wage rates
- overtime
- labor budgets
- labor assignments
- time tracking
- productivity
- project allocation
- labor forecasting

Labor should connect directly to project financials.

---

## 14. PAYROLL

Payroll functionality should support integration with payroll systems and/or internal payroll workflows.

Potential capabilities:

- employee hours
- regular time
- overtime
- project allocation
- cost codes
- pay rates
- deductions
- payroll exports
- payroll reporting
- payroll reconciliation

Never fabricate payroll transactions.

---

## 15. SCHEDULING

Scheduling must connect:

`PROJECT → WORK → LABOR → CREW → SHIFT → FIELD EXECUTION`

Support:

- tasks
- milestones
- dependencies
- crews
- employees
- shifts
- equipment
- deadlines
- weather considerations
- project constraints

---

## 16. WORKFORCE CALL-OUTS

Default workforce call-out deadline:

**4 hours before scheduled shift start.**

The system should support:

- employee call-outs
- absence reporting
- replacement requests
- supervisor notifications
- schedule adjustments
- replacement workforce searches
- audit records

Exceptions may be configured by organization.

---

## 17. WEATHER

Weather information should integrate into operational planning.

Weather can affect:

- scheduling
- concrete work
- roofing
- excavation
- outdoor work
- safety
- workforce planning
- material delivery

Weather should be associated with project locations.

---

## 18. G702/G703 DRAW DESK

The system must support construction billing workflows based on standard payment application concepts.

Capabilities should include:

- schedule of values
- previous applications
- current work
- stored materials
- retainage
- change orders
- current payment due
- supporting documentation
- approval workflow
- audit history

---

## 19. COMPLIANCE GATE

Compliance Gate should monitor project requirements.

Examples:

- insurance
- licenses
- certifications
- permits
- subcontractor documentation
- safety requirements
- contractual requirements
- expiration dates

Expired or missing items should generate alerts.

---

## 20. BLUEPRINT / DRAWING MANAGEMENT

Support:

- drawing uploads
- drawing sets
- revisions
- sheet numbers
- disciplines
- version history
- annotations
- search
- permissions
- links to RFIs
- links to submittals
- links to field issues

---

## 21. RFIs

RFI workflow:

`CREATE → ASSIGN → REVIEW → RESPOND → APPROVE/CLOSE`

Support:

- RFI numbering
- subject
- question
- project
- drawing reference
- responsible party
- due date
- response
- attachments
- status
- audit history

---

## 22. SUBMITTALS

Submittal workflow:

`CREATE → SUBMIT → REVIEW → RETURN → REVISE → APPROVE`

Support:

- submittal packages
- materials
- vendors
- responsible parties
- dates
- approvals
- revisions
- attachments
- status tracking

---

## 23. MESSAGING

Provide project-based communication.

Support:

- direct messages
- project channels
- announcements
- notifications
- attachments
- mentions
- message history
- auditability where required

---

## 24. DOCUMENT MANAGEMENT

Documents must support:

- upload
- storage
- metadata
- categories
- project association
- versioning
- permissions
- search
- previews
- audit history

AI document ingestion may be used where appropriate.

---

## 25. VENDOR MANAGEMENT

Vendor records should include:

- company
- contacts
- categories
- products
- pricing information
- contracts
- insurance
- compliance
- purchasing history
- performance information

---

## 26. PURCHASING / VENDOR LINKS

Capital X-RAY must support links and integrations to purchasing sources.

Examples may include:

- Home Depot
- material suppliers
- equipment suppliers
- specialty vendors
- other construction purchasing platforms

The system should allow authorized users to:

- identify needed materials
- locate vendors
- create purchase requests
- create purchase orders
- track purchases
- attach receipts
- connect purchases to projects

---

## 27. XENA

Xena is the operational AI assistant for Capital X-RAY.

Xena must eventually be capable of assisting with:

- project questions
- document search
- scheduling
- procurement
- reporting
- notifications
- workflow execution
- agent coordination
- financial analysis
- safety information
- operational recommendations

Xena must not perform destructive or financially consequential actions without appropriate authorization.

---

## 28. X-RAY AGENT ARCHITECTURE

Agents are a core architectural component.

Agents must be real functional software components.

Agents are **not**:

- decorative cards
- fake dashboards
- placeholder labels
- static descriptions
- pretend automation

Each agent must have:

- unique identity
- responsibility
- trigger
- inputs
- outputs
- permissions
- execution logic
- audit log
- failure handling
- retry behavior
- escalation behavior
- human approval rules

---

## 29. INITIAL AGENT CATEGORIES

Potential initial agents include:

### Financial Agent

Monitors budgets, costs, invoices, and financial exceptions.

### Schedule Agent

Monitors project schedules and conflicts.

### Labor Agent

Monitors staffing, hours, productivity, and shortages.

### Procurement Agent

Monitors purchasing requirements and vendor workflows.

### Compliance Agent

Monitors certifications, insurance, permits, and deadlines.

### Safety Agent

Monitors safety reports, incidents, inspections, and urgent hazards.

### Document Agent

Processes and organizes project documents.

### RFI Agent

Monitors RFI deadlines and responses.

### Submittal Agent

Monitors submittal status and deadlines.

### Weather Agent

Monitors weather conditions relevant to projects.

### Watchdog Agent

Looks for system-wide anomalies, missing information, and operational risks.

Agents may be expanded as development progresses.

---

## 30. EMERGENCY / SAFETY WORKFLOW

Safety emergencies must receive priority treatment.

A field user must be able to report:

- injury
- imminent hazard
- fire
- electrical danger
- structural danger
- chemical exposure
- equipment incident
- environmental danger
- other emergency conditions

The workflow must capture:

- project
- location
- reporter
- timestamp
- incident type
- description
- severity
- photographs
- attachments
- involved personnel
- immediate actions
- escalation status

---

## 31. EMERGENCY DIGESTS

The system is intended to send two emergency/safety report digests per day through the configured notification service.

The planned notification path includes Twilio/SMS, subject to final configuration.

Immediate-danger events must **not** wait for the digest.

They must trigger the configured urgent workflow immediately.

---

## 32. OSHA SAFETY MODULE

The safety system should support:

- OSHA-related safety workflows
- inspections
- incident reports
- corrective actions
- training
- safety meetings
- hazard reporting
- PPE tracking
- documentation
- deadlines
- compliance records

The system must not claim legal compliance merely because a workflow exists.

---

## 33. NOTIFICATIONS

Support:

- in-app notifications
- email
- SMS
- push notifications where available

Notification priorities:

1. Emergency
2. Critical
3. High
4. Normal
5. Informational

Users should be able to configure appropriate notification preferences.

---

## 34. TRANSLATION / MULTI-LANGUAGE

The platform should support a 30-language translation architecture.

Translation must be designed so that:

- UI strings are centralized
- language files are version controlled
- user language preferences are stored
- notifications can be translated
- AI outputs can be translated
- translation does not corrupt financial/legal values

English remains the initial canonical language unless otherwise configured.

---

## 35. SEARCH

Global search should eventually cover:

- projects
- people
- documents
- RFIs
- submittals
- messages
- vendors
- financial records
- safety records
- purchase orders
- agent logs

Search must respect permissions and tenant boundaries.

---

## 36. AUDIT LOGGING

Important actions must create audit records.

Audit information should include:

- user
- organization
- action
- object
- timestamp
- previous state where appropriate
- new state where appropriate
- source
- IP/device metadata where appropriate
- related agent run

Audit logs should not be casually deletable.

---

## 37. AGENT RUN LOGGING

Every agent execution should produce a record containing:

- agent
- trigger
- timestamp
- inputs
- outputs
- actions
- status
- errors
- retries
- approvals
- resulting changes

---

## 38. AGENT FAILURE HANDLING

Agents must fail safely.

Failure states must be visible.

The system should support:

- retries
- backoff
- error logging
- human escalation
- manual retry
- disabled-agent state
- partial failure handling

An agent must never silently fail.

---

## 39. HUMAN APPROVAL MODEL

Actions involving significant consequences should support approval.

Examples:

- purchasing
- payments
- payroll changes
- contract changes
- destructive data operations
- external communications
- safety escalation where appropriate

Authorization must be explicit.

---

## 40. INTEGRATIONS

Architecture should support integrations including:

- accounting
- payroll
- Google services where configured
- Microsoft services where configured
- Twilio
- weather providers
- mapping
- vendor systems
- payment systems
- storage providers
- construction software migrations

Integrations must be real.

Do not create fake connected states.

---

## 41. API ARCHITECTURE

APIs should:

- authenticate
- authorize
- validate input
- validate output
- enforce tenant isolation
- log significant actions
- handle errors
- use versioning where appropriate

---

## 42. UI / DESIGN SYSTEM

Target visual language:

### Executive Matrix

Characteristics:

- professional
- high information density
- construction/operations oriented
- dark-mode capable
- strong hierarchy
- clear status indicators
- responsive
- field usable

Do not sacrifice usability for visual effects.

---

## 43. MOBILE / FIELD

Field workers should be able to use the system from mobile devices.

Important mobile capabilities include:

- schedule
- time
- safety reporting
- photos
- documents
- messaging
- RFIs
- notifications
- project information

Critical safety workflows must remain simple.

---

## 44. PROJECT WORKFLOW

Primary operational flow:

`LEAD → BID → ESTIMATE → CONTRACT → PROJECT → LABOR → SCHEDULE → FIELD → PROCUREMENT → BILLING → CLOSEOUT`

The system should maintain relationships between each stage.

---

## 45. CHANGE ORDERS

Support:

- change-order creation
- scope
- reason
- pricing
- labor
- materials
- markup
- approval
- client approval
- schedule impact
- contract value impact
- audit history

---

## 46. COST CONTROL

Cost control must connect:

`BUDGET → COMMITTED COST → ACTUAL COST → FORECAST → PROFITABILITY`

The system should identify:

- overruns
- unusual costs
- margin erosion
- unpaid invoices
- missing commitments
- budget risks

---

## 47. CLOSEOUT

Closeout should support:

- punch lists
- final documents
- warranties
- inspections
- final billing
- retainage
- client handoff
- project archive
- lessons learned

---

## 48. ADMINISTRATION

Admin controls should include:

- organizations
- users
- roles
- permissions
- integrations
- notification settings
- agent settings
- system settings
- language settings
- audit logs

---

## 49. AGENT CONTROL CENTER

Administrators should eventually be able to see:

- all agents
- status
- enabled/disabled state
- recent runs
- failures
- pending approvals
- execution history
- permissions
- configuration
- performance

---

## 50. XENA + AGENTS

Xena should serve as the human-facing intelligence layer.

Xena can:

- query agents
- coordinate agents
- summarize agent results
- request approval
- initiate approved workflows
- explain failures
- surface exceptions

Agents perform defined operational responsibilities.

Xena coordinates and communicates with humans.

---

## 51. AI SAFETY / DATA INTEGRITY

AI systems must not:

- invent transactions
- fabricate approvals
- fabricate integrations
- fabricate records
- claim successful execution without evidence
- bypass permissions
- silently modify critical records

AI outputs must be treated as untrusted until validated where necessary.

---

## 52. FILE / DOCUMENT INGESTION

Documents may include:

- contracts
- plans
- specifications
- invoices
- receipts
- schedules
- safety documents
- insurance certificates
- permits

The system should extract useful metadata while preserving the original file.

---

## 53. DATA IMPORT / MIGRATION

Migration should support importing data from legacy construction systems.

Possible sources include:

- spreadsheets
- accounting platforms
- project-management platforms
- payroll systems
- document systems
- other construction applications

Imported data must be validated before becoming authoritative.

---

## 54. REPLACEMENT / COMPETITIVE PURPOSE

Capital X-RAY is intended to provide an integrated alternative to fragmented construction software stacks.

The conceptual target includes functionality commonly spread across tools such as:

- Procore
- Autodesk Construction Cloud / Build
- ClockShark
- accounting/payroll systems
- procurement platforms
- communication tools

The system should focus on operational integration rather than simply copying competitors.

---

## 55. CONFIGURATION OVER HARD-CODING

Where appropriate, organizations should be able to configure:

- roles
- permissions
- workflows
- approval thresholds
- notification rules
- labor rules
- cost codes
- safety rules
- agent behavior
- integrations

Do not hard-code business rules unnecessarily.

---

## 56. TESTING

Testing should include:

- unit tests
- integration tests
- API tests
- permission tests
- tenant-isolation tests
- agent tests
- workflow tests
- mobile/responsive tests
- failure tests
- security tests

Critical financial and safety workflows require particularly strong testing.

---

## 57. OBSERVABILITY

The system should provide:

- application logs
- error monitoring
- agent logs
- integration logs
- performance metrics
- job status
- database monitoring
- alerting

---

## 58. DEPLOYMENT

Deployment must distinguish:

- development
- staging
- production

Production secrets must never be committed to Git.

Deployments should be reproducible.

---

## 59. ENVIRONMENT VARIABLES

Sensitive configuration should use environment variables.

Examples:

- database credentials
- Supabase keys
- API keys
- Twilio credentials
- weather API keys
- vendor credentials
- AI provider credentials

Never commit production secrets.

---

## 60. DEMO / SEED DATA

The system may include development seed data.

Seed data must be clearly identified as non-production.

Never confuse demonstration data with real transactions.

---

## 61. IMPLEMENTATION STRATEGY

Development should proceed incrementally.

Recommended order:

1. inspect existing code
2. establish architecture
3. establish database
4. authentication/RBAC
5. tenant isolation
6. projects
7. financial foundation
8. bidding/estimating
9. labor
10. scheduling
11. procurement
12. documents
13. RFIs/submittals
14. safety
15. notifications
16. agents
17. Xena
18. integrations
19. reporting
20. production hardening

The actual order may change based on existing code.

---

## 62. DEFINITION OF DONE

A feature is not done because:

- a button exists
- a page renders
- a card says “active”
- a database table exists
- an agent has a name
- an integration has a logo

A feature is done when:

- the workflow works
- permissions work
- data persists
- errors are handled
- audit records exist where required
- tests exist
- the feature can be demonstrated honestly

---

## 63. NO PLACEHOLDER AGENTS

Capital X-RAY agents must never be represented as functional when they are not.

If an agent is planned but not implemented, label it:

`PLANNED`

If partially implemented:

`PARTIALLY IMPLEMENTED`

If functional:

`IMPLEMENTED`

---

## 64. NO FAKE INTEGRATIONS

Do not display an integration as connected unless the system can actually communicate with it.

If credentials are missing:

`CONFIGURATION REQUIRED`

If integration code does not exist:

`MISSING`

---

## 65. AUDITABILITY

Important system actions must be traceable.

The system must be able to answer:

- Who did it?
- What happened?
- When?
- Why?
- What changed?
- Which agent acted?
- Which approval authorized it?
- Did the external system confirm success?

---

## 66. FAILURE-FIRST DESIGN

Every important workflow must define what happens when:

- API fails
- database fails
- network fails
- user loses connection
- integration fails
- agent fails
- notification fails
- duplicate request occurs
- authorization fails

Failure handling is part of the feature.

---

## 67. EMERGENCY PRIORITY

Emergency safety events override ordinary workflow timing.

Immediate danger must trigger immediate escalation.

Emergency reports must not wait for scheduled digests.

---

## 68. BUSINESS CONTINUITY

The system should minimize operational disruption caused by:

- service outages
- integration failures
- network problems
- database issues
- agent failures

Important operations should have fallback/manual workflows.

---

## 69. FUTURE EXPANSION

Architecture should allow future support for:

- equipment management
- fleet
- GPS
- advanced analytics
- AI forecasting
- automated estimating
- computer vision
- drone data
- BIM integrations
- advanced vendor networks
- customer portals
- subcontractor portals
- mobile applications
- additional AI agents

---

## 70. DEVELOPMENT RULE

Do not build isolated features without understanding how they connect to the operational workflow.

Every major feature should answer:

**What does it connect to?**

---

## 71. CURRENT PROJECT STATUS

The coding agent must determine the actual current status by inspecting the repository.

Do not assume the system is empty.

Do not assume the system is complete.

Do not assume previous descriptions equal implementation.

Create a factual implementation inventory.

---

## 72. FIRST CODING-AGENT TASK

Before making major changes, the coding agent must:

1. Inspect the entire repository.
2. Identify the framework.
3. Identify the database.
4. Identify authentication.
5. Identify existing modules.
6. Identify existing APIs.
7. Identify integrations.
8. Identify agent-related code.
9. Identify deployment configuration.
10. Identify incomplete or broken functionality.
11. Compare the implementation against this document.
12. Produce a gap analysis.

Classify each major requirement as:

- IMPLEMENTED
- PARTIALLY IMPLEMENTED
- PLANNED
- MISSING
- BROKEN
- CONFIGURATION REQUIRED

Do not immediately rewrite the project.

---

## 73. FIRST AGENT RESPONSE FORMAT

The coding agent’s first response should contain:

### Repository Assessment

What exists.

### Architecture

What technologies and patterns are currently being used.

### Implemented

What actually works.

### Partial

What exists but is incomplete.

### Missing

What does not exist.

### Broken

What exists but does not work correctly.

### Configuration Required

What requires credentials, external services, or environment configuration.

### Highest-Priority Gaps

The most important missing pieces based on this specification.

### Recommended Build Sequence

The proposed implementation order.

No major implementation should begin until this assessment is complete unless the user explicitly instructs otherwise.

---

## 74. FINAL PRODUCT VISION

Capital X-RAY should become a unified construction operating system in which:

A bid can become a project.

A project can become a budget.

A budget can become labor and procurement requirements.

Labor can become a schedule.

The schedule can drive field operations.

Field operations can generate time, safety, documentation, and cost data.

Procurement can connect vendors and materials.

RFIs and submittals can connect directly to project documentation.

Change orders can update financial and schedule information.

Billing can connect to actual project progress.

Safety incidents can trigger immediate escalation.

Compliance can be continuously monitored.

Agents can monitor operations.

Xena can coordinate intelligence and assist authorized users.

Executives can see the entire organization through a unified operational view.

---

## 75. MASTER ENGINEERING RULE

> **BUILD THE SYSTEM, NOT THE ILLUSION OF THE SYSTEM.**

Every feature must be real.

Every workflow must be traceable.

Every important action must be auditable.

Every agent must actually execute its responsibility.

Every integration must actually connect.

Every failure must be handled.

Every permission must be enforced.

Every critical operation must have an honest status.

Capital X-RAY must never pretend to be more complete than it is.

The objective is a real construction operating system.
