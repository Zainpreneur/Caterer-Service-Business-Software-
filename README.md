# Caterly — Caterer Service Business Management Software

A full-stack web application for running a catering business: manage customers, build a
menu, book and plan events, assign staff, track ingredient inventory, and bill clients
with invoices and payments — all from one dashboard.

> **Where this is headed:** [`business-compiler/`](./business-compiler) contains a full
> business-compiler output for the catering category — ontology, data model, workflows,
> KPI dashboards, an AI agent hierarchy, automations, RBAC/ABAC, integrations, simulation,
> and a phased deployment roadmap for everything beyond this MVP.

## Features

- **Authentication** — JWT-based login/register (first registered user becomes admin).
- **Dashboard** — revenue, upcoming events, low-stock alerts, top-selling dishes, event
  status breakdown, all backed by live charts.
- **Customers (CRM)** — searchable customer directory with contact details, notes, and a
  history of their booked events.
- **Menu Management** — organize dishes into categories, set per-head pricing, mark
  vegetarian/vegan items, toggle availability.
- **Events / Bookings** — create events with a customer, date, venue, guest count, and a
  per-head menu selection; track status through inquiry → confirmed → in progress →
  completed/cancelled; automatic subtotal/discount/tax/total calculation.
- **Staff Management** — maintain a staff directory with roles and hourly rates, and
  assign staff members to specific events.
- **Inventory** — track ingredient stock levels, reorder thresholds, supplier info, and
  log restock/usage/adjustment transactions.
- **Invoicing & Payments** — generate an invoice from an event's current menu and totals,
  record multiple payments against it, and track outstanding balances with automatic
  status updates (draft/sent/partially paid/paid/overdue).

## Tech Stack

**Backend**
- Node.js + Express
- Sequelize ORM with SQLite (zero-config, file-based database — swap the dialect for
  Postgres/MySQL in production without changing application code)
- JWT authentication, bcrypt password hashing

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- React Router, Axios, Recharts, react-hot-toast, lucide-react icons

## Project Structure

```
backend/    Express REST API, Sequelize models, JWT auth, seed script
frontend/   React SPA (Vite + Tailwind)
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed     # creates the SQLite DB and loads demo data
npm run dev      # starts the API on http://localhost:5000 (nodemon)
# or: npm start
```

Demo login credentials created by the seed script:

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@caterer.com   | Admin123!   |
| Manager | manager@caterer.com | Manager123! |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # starts the app on http://localhost:5173
```

Open http://localhost:5173 and log in with the demo credentials above.

### Environment variables

**backend/.env**
```
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
DB_STORAGE=./data/caterer.sqlite
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## API Overview

All routes except `/api/auth/register` and `/api/auth/login` require a
`Authorization: Bearer <token>` header.

| Resource   | Endpoints |
|------------|-----------|
| Auth       | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Customers  | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id` |
| Menu       | `GET/POST /api/menu/categories`, `PUT/DELETE /api/menu/categories/:id`, `GET/POST /api/menu/items`, `GET/PUT/DELETE /api/menu/items/:id` |
| Events     | `GET/POST /api/events`, `GET/PUT/DELETE /api/events/:id`, `POST /api/events/:id/staff`, `DELETE /api/events/:id/staff/:staffId` |
| Staff      | `GET/POST /api/staff`, `GET/PUT/DELETE /api/staff/:id` |
| Inventory  | `GET/POST /api/inventory`, `GET/PUT/DELETE /api/inventory/:id`, `POST /api/inventory/:id/transactions` |
| Invoices   | `GET/POST /api/invoices`, `GET/PUT/DELETE /api/invoices/:id`, `POST /api/invoices/:id/payments`, `DELETE /api/invoices/:id/payments/:paymentId` |
| Dashboard  | `GET /api/dashboard/summary` |

## Notes

- The database is SQLite by default so the project runs with zero external
  infrastructure. For production, point Sequelize at Postgres/MySQL by changing
  `backend/src/config/db.js` and installing the relevant driver.
- Run `npm run seed` any time to reset the database back to demo data (this
  **drops and recreates all tables**).
