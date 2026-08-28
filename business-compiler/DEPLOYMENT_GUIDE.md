# Catering Business Compiler — Deployment Guide

This guide turns [`catering-business-compiler.yaml`](./catering-business-compiler.yaml) into an
actual build plan for Caterly. Phase 1 is already live in this repo (`/backend`, `/frontend`).
Phases 2–10 are scoped to build on top of it without breaking what exists — each phase adds new
Sequelize models, routes, and screens; none require rewriting the current data model.

Each phase lists: **goal**, **new entities**, **backend work**, **frontend work**, and a rough
**effort estimate** (solo full-stack dev, focused work).

---

## Phase 1 — Foundation ✅ (done)

CRM (Customers), Menu (Categories/Items), Events with per-head menu selection and staff
assignment, Inventory with stock transactions, Invoices with Payments, JWT auth, dashboard
analytics. This is the software already in this repository.

---

## Phase 2 — Sales Pipeline

**Goal:** capture demand before it becomes an Event, and formalize the quote → contract → deposit
flow so nothing is booked without a paper trail.

- **New entities:** `Lead`, `Quote` (+ `QuoteLineItem` or a JSON line-items column), `Contract`, `Package`
- **Backend:** `leadController`/`leadRoutes`, `quoteController`/`quoteRoutes` (create quote from
  Lead + Package + custom MenuItems, compute totals reusing the existing Event totals logic),
  `contractController` (mark signed, link to Event creation — converting a won Quote creates the
  Event + Customer if new)
- **Frontend:** Lead intake form, Quote builder (package picker + live total, mirrors the
  Events menu-selection UI already built), Contract review screen
- **Effort:** ~1.5–2 weeks

---

## Phase 3 — Procurement & Assets

**Goal:** connect menu selections to actual ingredient consumption, and stop guessing at
reorder timing.

- **New entities:** `Recipe` (BOM: MenuItem → InventoryItem × quantity per head), `Supplier`,
  `PurchaseOrder`, `PurchaseOrderLine`, `Equipment`, `EquipmentBooking`
- **Backend:** Recipe CRUD nested under MenuItem; a "shopping list" endpoint that explodes
  Recipes × guestCount across all upcoming Events into a per-supplier quantity list; PurchaseOrder
  lifecycle endpoints (draft → submitted → received, feeding the existing
  `InventoryTransaction(type=restock)` on receipt)
- **Frontend:** Recipe editor on the MenuItem modal, Supplier directory, PurchaseOrder screen,
  Equipment inventory + per-event booking panel
- **Effort:** ~2 weeks

---

## Phase 4 — Workforce Ops

**Goal:** replace manual staff assignment with a real scheduler and timesheet trail.

- **New entities:** `Shift` (extends `EventStaff` with start/end time and clock-in/out),
  role-to-guest-count ratio config
- **Backend:** shift generation from guestCount + service style, shift status lifecycle
  (open → assigned → confirmed → clocked_in → clocked_out → no_show), payroll export endpoint
- **Frontend:** calendar-based shift scheduler, staff-facing clock-in/out (mobile-friendly),
  timesheet report
- **Effort:** ~1.5 weeks

---

## Phase 5 — Financial Ops & Payments

**Goal:** real margin visibility per event, and stop chasing payments manually.

- **New entities:** `Expense` (actuals per event)
- **Backend:** margin calculation (`Invoice.totalAmount - sum(Recipe cost × guestCount) -
  sum(Shift hours × Staff.hourlyRate) - Expense`), Stripe/Square payment intent + webhook to
  auto-record `Payment`, scheduled job for the Collections workflow (reminder cadence from the
  compiler spec)
- **Frontend:** per-event profitability panel, "Pay Now" client-facing link, expense entry form
- **Effort:** ~2 weeks (1 extra week if building the Stripe integration from scratch)

---

## Phase 6 — AI Agent Layer

**Goal:** turn the manual T-minus checklist into agents that act on the data already flowing
through the system.

- **Backend:** implement the seven agents from `agentHierarchy` as scheduled jobs / LLM-backed
  workers reading the models above:
  1. Sales & Quoting Agent — draft-quote generation, cold-lead follow-up
  2. Kitchen Planning Agent — shopping-list generation (built on Phase 3's Recipe explosion)
  3. Inventory Forecasting Agent — reorder-point suggestions from event calendar + usage history
  4. Staffing Agent — shift posting + no-show backfill (built on Phase 4)
  5. Billing & Collections Agent — invoice generation + reminder cadence (built on Phase 5)
  6. Customer Success Agent — feedback requests, re-engagement campaigns
  7. Compliance Agent — permit/insurance expiry gate on Event confirmation
  Orchestrator = a daily digest job that summarizes sub-agent output and flags conflicts.
- **Frontend:** an "Agent Activity" feed on the dashboard (what each agent did today)
- **Effort:** ~3–4 weeks (this is the highest-variance phase — start with Kitchen Planning +
  Billing & Collections, since they have the clearest ROI and least ambiguity)

---

## Phase 7 — Analytics & Forecasting

**Goal:** the KPI dashboards and simulators from the compiler spec.

- **Backend:** extend `dashboardController` with the financial/operations/sales/customer KPIs
  marked `implemented: false` in the spec; build the simulation endpoints (quote profitability,
  ingredient price sensitivity, staffing cost/quality, seasonal demand, cash flow)
- **Frontend:** KPI dashboard v2 (new chart panels), a "what-if" simulator screen for quoting
- **Effort:** ~2 weeks

---

## Phase 8 — Mobile / Local-First

**Goal:** event-day reliability with no venue wifi.

- **Approach:** a lightweight mobile-friendly view (or React Native/Capacitor shell) scoped to
  "today's assigned events" per the `localFirstSync` spec — local storage mirror, background
  sync, last-write-wins for checklist state, append-only merge for incident/timesheet logs
- **Effort:** ~3 weeks

---

## Phase 9 — Security Hardening

**Goal:** the full role set and ABAC rules from the compiler spec, plus a client portal.

- **Backend:** extend `User.role` enum (`coordinator`, `chef`, `server_staff`, `accountant`,
  `client`), add the ABAC scoping rules to `middleware/auth.js` (event-assignment scoping for
  server_staff, customerId scoping for client, cost-field redaction for chef)
- **Frontend:** client-facing portal (read-only Quote/Contract/Invoice/Event + feedback
  submission), role-aware UI (hide financial data from chef/server views)
- **Effort:** ~2 weeks

---

## Phase 10 — External Integrations

**Goal:** stop re-typing data into other tools.

- QuickBooks/Xero export, Google Calendar sync, Twilio SMS, SendGrid email, Google Maps delivery
  routing, review-platform links — each is an independent integration and can be built in any
  order based on which manual process hurts most.
- **Effort:** ~1 week per integration

---

## Suggested sequencing

If building solo, the highest-leverage order is:

**2 (Sales pipeline) → 3 (Procurement) → 5 (Payments) → 4 (Workforce) → 7 (Analytics) → 6 (Agents) → 9 (Security) → 10 (Integrations) → 8 (Mobile)**

Sales pipeline first because it's upstream of everything (no Event without a won Quote).
Payments before full workforce ops because cash flow visibility compounds sooner than scheduling
polish. Agents are sequenced after their data dependencies exist, not before — an agent with no
Recipe/Shift data to act on has nothing to do.
