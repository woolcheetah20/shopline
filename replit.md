# Shopline

## Overview

Shopline is a local shop discovery, pickup ordering, and delivery web app for Ghana. Users register as buyers or sellers (switchable), sellers manage shops and products with image uploads, buyers browse and order, and a driver section enables Uber-style delivery.

## Run & Operate

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- Workflows: `artifacts/api-server: API Server`, `artifacts/shopline: web`
- Env vars required: `DATABASE_URL`, `SESSION_SECRET`, `PORT`

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui, Wouter (routing)
- **Backend**: Express 5, Drizzle ORM, PostgreSQL
- **Auth**: JWT tokens, stored in localStorage key `shopline_token`; `isAdmin` embedded in token
- **Image uploads**: multer → `artifacts/api-server/uploads/`, served at `/api/uploads/`
- **API codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)

## Where things live

```
artifacts/shopline/        — React+Vite frontend (/)
artifacts/api-server/      — Express 5 API (/api)
lib/api-spec/openapi.yaml  — OpenAPI source of truth
lib/api-client-react/      — Generated hooks (Orval)
lib/api-zod/               — Generated Zod schemas
lib/db/src/schema/         — Drizzle table definitions
```

## Architecture decisions

- Admin routes (`/api/admin/*`) are NOT in the OpenAPI spec — called with plain fetch from `admin.tsx`
- Image upload route also not in spec (avoids File/Blob codegen issues)
- `POST /api/admin/bootstrap` makes the caller admin if no admin exists yet (first-run only)
- `isAdmin` + `isBanned` added to users table; `isAdmin` included in JWT payload
- Seller orders page passes `role=seller` to `useListMyOrders` to get shop's incoming orders

## Product

### Buyer
- `/` — Browse shops, sorted by distance (browser geolocation), search + category filter
- `/shops/:shopId` — Products, add to cart, call/WhatsApp seller
- `/cart` — Pickup vs delivery, place order
- `/orders` + `/orders/:orderId` — Order tracking + contact seller (call/WhatsApp)

### Seller (activeRole === 'seller')
- `/seller` — Dashboard KPIs
- `/seller/shop` — Shop setup: name, category, photo, Google Maps location (paste link to extract lat/lng), phone/WhatsApp, open/closed toggle
- `/seller/products` — CRUD + image upload
- `/seller/orders` — Incoming orders with buyer name + phone + call/WhatsApp buttons

### Driver
- `/driver` — Register, availability toggle, accept/complete deliveries

### Admin (isAdmin === true)
- `/admin` — Overview stats (users, shops, orders, revenue, banned) + user management (ban/unban, grant/revoke admin)
- Bootstrap: visit `/admin` without admin → "Claim Admin Access" button (only works if no admin exists)

### Shared
- `/login`, `/register`, `/profile` — Auth + role switcher

## User preferences

- No demo/seed data — fresh start, real users only
- Currency: GHS X.XX
- No prepayment — buyers pay in person at shop
- Delivery disclaimer required: "Shopline is not responsible for missing or damaged items during delivery."

## Gotchas

- After claiming admin, the user must log out and back in for `isAdmin` to appear in the JWT
- Admin routes use `requireAdmin` middleware (checks JWT `isAdmin` field)
- Banned users are blocked at login and at `GET /api/auth/me`
- `switch-role` now returns both `user` and `token` — frontend must store new token
