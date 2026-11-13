# Sajani

**Digital-first Sambalpuri fashion brand — Western Odisha to India.**

Sajani is an own-brand, direct-to-consumer (D2C) Sambalpuri fashion e-commerce platform. Local manufacturing and weaving partners supply products; Sajani owns customer experience, merchandising, quality, digital commerce, order support and brand identity.

## Pilot Scope (P0)

- **Catalog**: Browse, search, filter sarees by fabric/weave/price/color
- **Cart & Checkout**: Server-calculated pricing, address capture, serviceability check
- **Payments**: UPI (prepaid) + Cash on Delivery (COD)
- **Inventory**: Atomic stock reservations with row-level locking
- **Orders**: Full lifecycle — placed → confirmed → packed → shipped → delivered + cancellation/returns/refunds
- **Admin**: Catalog CRUD, inventory adjustments, order management, reports, RBAC
- **Audience**: Sambalpur & Western Odisha, ~20–30 designs, 5–6 pieces each

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo + TypeScript |
| Backend API | NestJS + TypeScript (modular monolith) |
| Database | PostgreSQL 16 + Prisma ORM |
| Admin Panel | Next.js + TypeScript |
| Object Storage | AWS S3 + CloudFront CDN |
| Auth | Phone OTP → JWT |
| Payments | Razorpay / Cashfree (UPI + refunds) |
| Shipping | Manual entry (pilot); no courier API |
| Notifications | WhatsApp Business API |
| Monorepo | npm workspaces |
| CI/CD | GitHub Actions |

## Project Structure

```
sajani-app/
├── apps/
│   ├── mobile/              # React Native + Expo (Android/iOS)
│   │   └── src/
│   │       ├── components/
│   │       ├── screens/     # Home, Explore, Cart, Checkout, Orders, Profile
│   │       ├── navigation/  # Tab + stack navigators
│   │       ├── services/    # API client
│   │       ├── hooks/
│   │       ├── store/
│   │       └── theme/       # Sajani brand tokens
│   ├── api/                 # NestJS backend
│   │   ├── src/modules/     # 12 modules (see Architecture below)
│   │   ├── prisma/          # Schema + migrations (18 tables)
│   │   └── test/
│   └── admin/               # Next.js admin panel
│       └── src/
│           ├── app/         # Dashboard, Catalog, Inventory, Orders, Reports
│           ├── components/
│           └── services/
├── packages/
│   └── shared/              # Types, enums, constants, utils
├── docs/
│   ├── architecture/
│   │   ├── HLD.md           # High-Level Design
│   │   ├── LLD.md           # Low-Level Design (modules, DTOs, state machines)
│   │   └── database-design.md  # 18 tables, ER diagram, constraints
│   └── api/
│       └── openapi.yaml     # OpenAPI 3.0 spec (38 endpoints)
├── docker-compose.yml       # Local PostgreSQL + MinIO
├── package.json             # Workspace root
└── tsconfig.base.json
```

## Architecture

### Backend Modules (12)

| Module | Responsibility |
|--------|---------------|
| Auth | OTP send/verify, JWT sessions, rate limiting |
| Users | Customer profiles |
| Addresses | Delivery address CRUD, default management |
| Categories | Product category listing |
| Products | Catalog CRUD (admin), public search/filter/sort |
| Media | S3 signed uploads, thumbnail generation |
| Inventory | Stock tracking, atomic reservations, expiry worker |
| Cart | Server-side cart, live pricing |
| Checkout | Quote calculation, order placement transaction |
| Orders | Order state machine, customer/admin views |
| Payments | Gateway integration, webhook verification, refunds |
| Admin | RBAC, audit logging, reports |

### Database (18 tables)

`users` · `addresses` · `categories` · `products` · `product_variants` · `product_media` · `inventory` · `inventory_reservations` · `cart_items` · `orders` · `order_items` · `payments` · `shipments` · `returns` · `refunds` · `admin_users` · `audit_events` · `webhook_events`

### API (38 endpoints)

Public (catalog, auth) · Customer (cart, checkout, orders, addresses, profile) · Admin (catalog CRUD, inventory, orders, reports, users) · Webhooks (payments)

Full spec: [`docs/api/openapi.yaml`](docs/api/openapi.yaml)

## Design Patterns

- **Modular monolith** — single deployable API with clear module boundaries
- **Thin controllers, fat services** — business logic in services, not controllers
- **DTO validation at boundary** — `class-validator` on every request
- **Integer paise** — all money as integers (100 paise = ₹1), no floats
- **Server authority** — prices, totals, shipping calculated server-side
- **Atomic inventory** — `SELECT FOR UPDATE` + Prisma transactions
- **Snapshot pattern** — order items freeze price/title/address at purchase time
- **Idempotent operations** — order placement + webhooks deduplicated by unique keys
- **State machine enforcement** — server validates every status transition
- **Audit trail** — every admin mutation logged with actor + before/after state
- **RBAC guards** — owner, catalog_editor, fulfillment_operator, support

## Development Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 — Design | HLD, DB design, LLD, OpenAPI spec | ✅ Complete |
| 1 — Foundations | Monorepo, NestJS skeleton, Prisma schema, Expo shell, CI | ✅ Complete |
| 2 — Catalog | Auth, categories, products, media, admin + mobile screens | 🔲 |
| 3 — Cart & Checkout | Addresses, inventory, cart, checkout, orders | 🔲 |
| 4 — Payments | Gateway integration, webhooks, refunds, UPI flow | 🔲 |
| 5 — Launch Prep | Reports, notifications, seed data, UAT, deploy | 🔲 |

## Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 22.x | `brew install node@22` |
| PostgreSQL | 16.x | `brew install postgresql@16 && brew services start postgresql@16` |
| Docker (optional) | Latest | `brew install --cask docker` |
| Expo Go (optional) | Latest | Install from App Store / Play Store |

### 1. Clone the repo

```bash
git clone git@github.com:nikhilnanda47/sajani-app.git
cd sajani-app
```

### 2. Set up the database

**Option A — Local PostgreSQL (recommended for dev):**

```bash
# Create database user and database
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
# Install root workspace (API, admin, shared package)
npm install

# Install mobile app separately (Expo requires isolated node_modules)
cd apps/mobile && npm install && cd ../..
```

### 4. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env if needed (defaults work for local dev)
```

Default `.env` connects to:
```
DATABASE_URL=postgresql://sajani:sajani_dev_password@localhost:5432/sajani_dev
```

### 5. Run database migrations

```bash
# Generate Prisma client
cd apps/api && npx prisma generate

# Run migrations (creates all 18 tables)
npx prisma migrate dev

# Go back to root
cd ../..
```

### 6. Build the shared package

```bash
cd packages/shared && npx tsc && cd ../..
```

### 7. Start development servers

**API (NestJS):**
```bash
cd apps/api && npx nest build && node dist/main.js
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
# Health: http://localhost:3000/health
```

**Admin Panel (Next.js):**
```bash
cd apps/admin && npm run dev
# Admin: http://localhost:3001
```

**Mobile App (Expo):**
```bash
cd apps/mobile && npx expo start --web
# Web preview: http://localhost:8081
# Or scan QR with Expo Go for phone preview
```

### 8. Verify everything works

```bash
# Health check (API must be running)
curl http://localhost:3000/health

# Expected response:
# {"success":true,"data":{"status":"ok","database":"connected",...}}
```

### Useful commands

| Command | Description |
|---------|-------------|
| `npx prisma studio` | Visual database browser at localhost:5555 |
| `npx prisma migrate dev --name <name>` | Create a new migration |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `psql postgresql://sajani:sajani_dev_password@localhost:5432/sajani_dev` | Connect to database CLI |
| `npx expo start --web --clear` | Start mobile app with cleared cache |

### Project ports

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
| [HLD](docs/architecture/HLD.md) | System architecture, tech stack, deployment, security |
| [Database Design](docs/architecture/database-design.md) | 18 tables, ER diagram, constraints, indexes |
| [LLD](docs/architecture/LLD.md) | Module designs, DTOs, services, state machines, error codes |
| [OpenAPI Spec](docs/api/openapi.yaml) | 38 REST endpoints with full request/response schemas |
| [UI/UX Designs](https://drive.google.com/drive/folders/1VGF8a_wP-hkXg4s66_ixaiOxPvS10jpX?usp=sharing) | Mobile app screens and design assets |

## Guiding Principles

> Trust before novelty. Accurate inventory before growth. Real product evidence before marketing claims. Server authority over client inputs. Explicit policy over invented behavior. Measured customer demand before expensive infrastructure.

## License

Proprietary — All rights reserved.
