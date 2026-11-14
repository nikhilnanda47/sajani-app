# Sajani

**Digital-first Sambalpuri fashion brand — Western Odisha to India.**

Sajani is an own-brand, direct-to-consumer (D2C) Sambalpuri fashion e-commerce platform. Local manufacturing and weaving partners supply products; Sajani owns customer experience, merchandising, quality, digital commerce, order support and brand identity.

## Pilot Scope (P0)

- **Catalog**: Browse, search, filter sarees by fabric/weave/price/color
- **Cart & Checkout**: Server-calculated pricing, address capture, serviceability check
- **Payments**: Cash on Delivery (COD); UPI planned for Phase 4
- **Inventory**: Atomic stock reservations with row-level locking, expiry cron
- **Orders**: Full lifecycle — placed → confirmed → packed → shipped → delivered + cancellation
- **Admin**: Catalog CRUD, inventory view, order management with state machine, dashboard
- **Audience**: Sambalpur & Western Odisha, ~20–30 designs, 5–6 pieces each

## Current Status

### Customer App (Mobile) — 18 features working

| # | Feature | Status |
|---|---------|--------|
| 1 | Home screen — hero, collections grid, new arrivals from API | ✅ |
| 2 | Explore catalog — category chips, 2-column product grid | ✅ |
| 3 | Filter products by category | ✅ |
| 4 | Product detail — price, variants, specs, certifications, delivery info | ✅ |
| 5 | Variant selection (color) | ✅ |
| 6 | Login via phone OTP | ✅ |
| 7 | Name capture for new users | ✅ |
| 8 | Add to bag (with login check) | ✅ |
| 9 | Cart — qty stepper, price breakdown, availability warnings | ✅ |
| 10 | Update quantity / remove cart items | ✅ |
| 11 | Checkout — select delivery address | ✅ |
| 12 | Add new address (PIN code validation) | ✅ |
| 13 | Order review — address, items, COD, total | ✅ |
| 14 | Place order (COD) — atomic stock reservation | ✅ |
| 15 | Order success with order number | ✅ |
| 16 | Order history with status badges | ✅ |
| 17 | Order detail with status timeline | ✅ |
| 18 | Cancel order (if placed/confirmed) | ✅ |

### Admin Panel (Web) — 14 features working

| # | Feature | Status |
|---|---------|--------|
| 1 | OTP login | ✅ |
| 2 | Dashboard — live stats (orders, pending, low stock, GMV) | ✅ |
| 3 | Dashboard — recent orders table | ✅ |
| 4 | View all categories | ✅ |
| 5 | Create new category | ✅ |
| 6 | Activate/deactivate category | ✅ |
| 7 | Product catalog — table with price, stock, status | ✅ |
| 8 | Create product with variants and fabric metadata | ✅ |
| 9 | Publish/unpublish products | ✅ |
| 10 | Inventory — all variants with on-hand/reserved/available | ✅ |
| 11 | Orders — filter by status, search by order#/phone | ✅ |
| 12 | Confirm → Pack → Ship → Deliver order status flow | ✅ |
| 13 | Ship with tracking ID and courier name | ✅ |
| 14 | Logout | ✅ |

### Not Yet Built

| Feature | Planned Phase |
|---------|--------------|
| Real product images (using placeholders) | Phase 5 |
| UPI/online payment | Phase 4 |
| Text search | Phase 5 |
| Product edit page (admin) | Phase 5 |
| Manual stock adjustment UI (admin) | Phase 5 |
| Admin order detail page | Phase 5 |
| Customer lookup (admin) | Phase 5 |
| Reports (GMV, top products, stock) | Phase 5 |
| Admin user management / roles | Phase 5 |
| Refund initiation | Phase 4 |
| Wishlist | Post-pilot |
| Push notifications / SMS updates | Phase 5 |
| WhatsApp support integration | Phase 5 |
| Splash screen / onboarding | Phase 5 |
| No internet / force update screens | Phase 5 |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo SDK 52 + TypeScript |
| Backend API | NestJS + TypeScript (modular monolith) |
| Database | PostgreSQL 16 + Prisma ORM |
| Admin Panel | Next.js 14 (App Router) + TypeScript |
| Auth | Phone OTP → JWT (15min access + 7d refresh) |
| Payments | COD (pilot); Razorpay/Cashfree planned |
| Shipping | Manual entry (pilot); no courier API |
| Monorepo | npm workspaces |
| CI/CD | GitHub Actions |

## Project Structure

```
sajani-app/
├── apps/
│   ├── mobile/              # React Native + Expo
│   │   └── src/
│   │       ├── screens/     # 12 screens (Home, Explore, ProductDetail, Cart,
│   │       │                #   SelectAddress, AddAddress, OrderReview,
│   │       │                #   OrderSuccess, Orders, OrderDetail, Profile)
│   │       ├── navigation/  # Tab (5 tabs) + Stack navigators
│   │       ├── services/    # API client with token management
│   │       └── theme/       # Stitch design tokens (colors, typography, spacing)
│   ├── api/                 # NestJS backend
│   │   ├── src/modules/     # 10 active modules (see below)
│   │   ├── prisma/          # Schema + migrations (18 tables) + seed data
│   │   └── test/
│   └── admin/               # Next.js admin panel
│       └── src/
│           ├── app/         # Dashboard, Catalog, Categories, Inventory, Orders
│           ├── components/  # Sidebar
│           └── services/    # API client
├── packages/
│   └── shared/              # Enums, constants (state machine), types, utils
├── docs/
│   ├── architecture/
│   │   ├── HLD.md           # High-Level Design (21 mobile screens)
│   │   ├── LLD.md           # Low-Level Design (modules, DTOs, state machines)
│   │   └── database-design.md  # 18 tables, ER diagram, constraints
│   └── api/
│       └── openapi.yaml     # OpenAPI 3.0 spec (38 endpoints)
├── docker-compose.yml       # Local PostgreSQL
├── package.json             # Workspace root
└── tsconfig.base.json
```

## Architecture

### Backend Modules

| Module | Status | Responsibility |
|--------|--------|---------------|
| Auth | ✅ Active | OTP send/verify, JWT sessions, mock OTP provider |
| Users | ✅ Active | Customer profile (GET/PATCH /me) |
| Addresses | ✅ Active | Delivery address CRUD, default management, max 10 |
| Categories | ✅ Active | Product category listing + admin CRUD |
| Products | ✅ Active | Catalog with search/filter/sort + admin CRUD |
| Inventory | ✅ Active | Stock tracking, atomic `SELECT FOR UPDATE` reservations, expiry cron |
| Cart | ✅ Active | Server-side cart, live pricing, availability warnings |
| Checkout | ✅ Active | Quote calculation, atomic order placement transaction |
| Orders | ✅ Active | 12-state machine, customer/admin views, cancellation |
| Media | 🔲 Phase 5 | S3 signed uploads, thumbnail generation |
| Payments | 🔲 Phase 4 | Gateway integration, webhook verification, refunds |
| Admin | 🔲 Phase 5 | Extended RBAC, reports |

### Database (18 tables)

`users` · `addresses` · `categories` · `products` · `product_variants` · `product_media` · `inventory` · `inventory_reservations` · `cart_items` · `orders` · `order_items` · `payments` · `shipments` · `returns` · `refunds` · `admin_users` · `audit_events` · `webhook_events`

### API (38 endpoints)

Public (catalog, auth) · Customer (cart, checkout, orders, addresses, profile) · Admin (catalog CRUD, inventory, orders) · Webhooks (payments)

Full spec: [`docs/api/openapi.yaml`](docs/api/openapi.yaml)

## Design Patterns

- **Modular monolith** — single deployable API with clear module boundaries
- **Thin controllers, fat services** — business logic in services, not controllers
- **DTO validation at boundary** — `class-validator` on every request
- **Integer paise** — all money as integers (100 paise = ₹1), no floats
- **Server authority** — prices, totals, shipping calculated server-side
- **Atomic inventory** — `SELECT FOR UPDATE` + Prisma interactive transactions
- **Snapshot pattern** — order items freeze price/title/address at purchase time
- **Idempotent order placement** — deduplicated by client-generated idempotency key
- **State machine enforcement** — server validates every order status transition
- **Audit trail** — every admin mutation logged with actor + before/after state
- **RBAC guards** — owner bypasses all, role-specific access for others
- **Reservation expiry** — cron releases held stock every minute

## Development Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 — Design | HLD, DB design, LLD, OpenAPI spec | ✅ Complete |
| 1 — Foundations | Monorepo, NestJS skeleton, Prisma schema, Expo shell, CI | ✅ Complete |
| 2 — Catalog | Auth, categories, products, admin + mobile screens | ✅ Complete |
| 3 — Cart & Checkout | Addresses, inventory, cart, checkout, orders, mobile + admin UI | ✅ Complete |
| 4 — Payments | Gateway integration, webhooks, refunds, UPI flow | 🔲 Next |
| 5 — Launch Prep | Images, reports, notifications, real data, deploy | 🔲 Planned |

## Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 22.x | `brew install node@22` |
| PostgreSQL | 16.x | `brew install postgresql@16 && brew services start postgresql@16` |
| Docker (optional) | Latest | `brew install --cask docker` |

### 1. Clone the repo

```bash
git clone git@github.com:nikhilnanda47/sajani-app.git
cd sajani-app
```

### 2. Set up the database

**Option A — Local PostgreSQL (recommended):**

```bash
psql postgres -c "CREATE USER sajani WITH PASSWORD 'sajani_dev_password' CREATEDB;"
psql postgres -c "CREATE DATABASE sajani_dev OWNER sajani;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE sajani_dev TO sajani;"
```

**Option B — Docker:**

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
# Root workspace (API, admin, shared)
npm install

# Mobile app (separate — Expo requires isolated node_modules)
cd apps/mobile && npm install && cd ../..
```

### 4. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Defaults work for local dev
```

### 5. Run database migrations + seed

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts    # Seeds 4 categories, 8 products, 11 variants, 1 admin
cd ../..
```

### 6. Build the shared package

```bash
cd packages/shared && npx tsc && cd ../..
```

### 7. Start development servers

Open 3 terminals:

```bash
# Terminal 1 — API (localhost:3000)
npm run dev -w @sajani/api

# Terminal 2 — Admin Panel (localhost:3001)
cd apps/admin && npm run dev

# Terminal 3 — Mobile App (localhost:8081)
cd apps/mobile && npx expo start --web
```

### 8. Test login

- **Mobile**: Profile tab → `+919876543210` → OTP `123456`
- **Admin**: `localhost:3001` → same phone/OTP
- Dev mode always accepts OTP `123456`

### Useful commands

| Command | Description |
|---------|-------------|
| `npx prisma studio` | Visual database browser (localhost:5555) |
| `npx prisma migrate dev --name <name>` | Create new migration |
| `npx prisma generate` | Regenerate Prisma client |
| `psql -U sajani -d sajani_dev` | Connect to database CLI |
| `npx expo start --web --clear` | Mobile with cleared cache |

### Service ports

| Service | Port | URL |
|---------|------|-----|
| API | 3000 | http://localhost:3000 |
| Swagger Docs | 3000 | http://localhost:3000/api/docs |
| Prisma Studio | 5555 | http://localhost:5555 |
| Admin Panel | 3001 | http://localhost:3001 |
| Mobile (Web) | 8081 | http://localhost:8081 |
| PostgreSQL | 5432 | — |

## Documentation

| Document | Description |
|----------|-------------|
| [HLD](docs/architecture/HLD.md) | System architecture, 21 mobile screens, tech decisions |
| [Database Design](docs/architecture/database-design.md) | 18 tables, ER diagram, constraints, indexes |
| [LLD](docs/architecture/LLD.md) | Module designs, DTOs, state machines, navigation tree |
| [OpenAPI Spec](docs/api/openapi.yaml) | 38 REST endpoints with full schemas |
| [UI/UX Designs](https://drive.google.com/drive/folders/1VGF8a_wP-hkXg4s66_ixaiOxPvS10jpX?usp=sharing) | Mobile app screen designs |

## Guiding Principles

> Trust before novelty. Accurate inventory before growth. Real product evidence before marketing claims. Server authority over client inputs. Explicit policy over invented behavior. Measured customer demand before expensive infrastructure.

## License

Proprietary — All rights reserved.
