# Sajani

Digital-first Sambalpuri fashion brand — Western Odisha to India.

Sajani is an own-brand, direct-to-consumer (D2C) Sambalpuri fashion e-commerce platform. Local manufacturing and weaving partners supply products; Sajani owns customer experience, merchandising, quality, digital commerce, order support and brand identity.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo + TypeScript |
| Backend API | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Admin Panel | React / Next.js |
| Storage | Object storage + CDN |
| Integrations | OTP auth, UPI payment gateway, courier/shipping |

## Project Structure

```
sajani-app/
├── apps/
│   ├── mobile/          # React Native + Expo app
│   ├── api/             # NestJS backend
│   └── admin/           # Next.js admin panel
├── packages/
│   └── shared/          # Shared types, constants, utilities
└── docs/                # Architecture decisions, API specs
```

## Pilot Scope (P0)

- Product catalog browsing (home, categories, search, filters)
- Product details with real imagery and fabric metadata
- Cart and checkout with server-calculated pricing
- UPI prepaid payments and Cash on Delivery (COD)
- Atomic inventory reservations to prevent overselling
- Order lifecycle management
- Admin: catalog CRUD, inventory, orders, shipping, reports

## Phased Roadmap

| Phase | Scope |
|-------|-------|
| 0 | Decisions & design |
| 1 | Foundations — monorepo, CI, Expo nav, NestJS skeleton, DB migrations |
| 2 | Catalog — admin upload, image storage, public APIs, app screens |
| 3 | Cart & checkout — reservations, COD, order placement |
| 4 | Prepaid payments — gateway, webhooks, reconciliation, refunds |
| 5 | Fulfillment & pilot — admin ops, tracking, notifications, UAT |
| 6 | Scale — web SEO, broader suppliers, analytics |

## Getting Started

```bash
# Prerequisites: Node.js LTS, PostgreSQL, Expo CLI

# Install dependencies
npm install

# Start development
npm run dev
```

## Guiding Principles

> Trust before novelty. Accurate inventory before growth. Real product evidence before marketing claims. Server authority over client inputs. Explicit policy over invented behavior. Measured customer demand before expensive infrastructure.

## License

Proprietary — All rights reserved.
