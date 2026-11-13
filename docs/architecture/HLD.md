# Sajani — High-Level Design (Pilot P0)

**Version:** 1.0  
**Date:** 13 November 2026  
**Status:** Draft for review  
**Scope:** Pilot launch — Sambalpur / Western Odisha, ~20–30 SKUs, 5–6 pieces per design

---

## 1. Pilot Scope Summary

**What we're building:**
- Mobile app for customers to browse Sambalpuri sarees, place orders (UPI + COD)
- Admin panel for catalog, inventory, orders, and fulfillment management
- Backend API with atomic inventory reservations and payment verification

**What we're NOT building (pilot):**
- Web storefront, SEO pages
- Multi-vendor/seller marketplace
- AI recommendations, AR try-on
- Microservices, Kafka, Kubernetes
- Nationwide fulfillment
- Wishlist, reviews, personalization, loyalty, push campaigns

**Pilot constraints:**
- ~20–30 designs, ~5–6 pieces each from a single relative-owned manufacturing unit
- Sambalpur and Western Odisha delivery area
- Small catalog = simple search (no Elasticsearch needed)
- Low traffic = single API instance, no read replicas

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Mobile App | React Native + Expo + TypeScript | Cross-platform Android/iOS from one codebase |
| Backend API | NestJS + TypeScript | Modular, typed, OpenAPI generation |
| ORM | Prisma | Type-safe queries, versioned migrations |
| Database | PostgreSQL 16 | ACID for inventory reservations, JSONB for attributes |
| Admin Panel | Next.js + TypeScript | React ecosystem, shared types with API |
| Object Storage | AWS S3 | Product images; signed uploads |
| CDN | CloudFront | Image delivery across India |
| Auth | OTP via SMS (MSG91 / Gupshup) | Phone-based, India standard |
| Payments | Razorpay (or Cashfree) | UPI, webhook verification, refund APIs |
| Shipping | Manual entry (pilot) | Admin enters tracking ID; no courier API integration yet |
| Notifications | WhatsApp Business API | Order confirmations, shipping updates |
| Monorepo | npm workspaces | Shared types across apps |
| CI/CD | GitHub Actions | Lint → test → build → deploy |
| Hosting | Railway / Render / AWS (TBD) | Managed PostgreSQL + container hosting |

---

## 3. Application Components

### 3.1 Mobile App (`apps/mobile`)

| Screen | P0 Features |
|---|---|
| Home | Hero banner, featured collections (Everyday, Signature, Heritage, Celebrations) |
| Explore | Browse by category, search by name/fabric/motif, filter (price, fabric, weave, color), sort (newest, price_asc, price_desc, relevance) |
| Product Detail | Multiple photos, zoom, price (INR paise), stock status, fabric, weave method, dimensions, wash care, origin, blouse-piece info, shipping estimate, COD eligibility |
| Cart | Add/edit/remove items, server-calculated subtotal, shipping, tax, total |
| Checkout | Address capture (name, phone, PIN, city, state, landmark), serviceability check, COD/UPI selection, idempotent order placement |
| Orders | Order list, status tracking, order detail with tracking link, WhatsApp support link |
| Profile | Phone, name, saved addresses |
| Auth | OTP login at checkout or order lookup; guest browsing allowed |

### 3.2 Backend API (`apps/api`)

12 NestJS modules for pilot:

| Module | P0 Scope |
|---|---|
| **Auth** | OTP send/verify, JWT sessions, rate limiting |
| **Users** | Profile, phone verification |
| **Addresses** | CRUD, PIN code, default address |
| **Categories** | List, sort order |
| **Products** | CRUD (admin), public search/filter/sort, paginated catalog |
| **Media** | Signed S3 uploads, thumbnail generation, CDN URLs |
| **Inventory** | on_hand/reserved/available per SKU, atomic reservation with row lock, expiry worker, audit log |
| **Cart** | Server-side cart, price recalculation, variant validation |
| **Checkout** | Quote (totals + shipping + tax), stock reservation → order creation in single transaction |
| **Orders** | State machine (Placed→Confirmed→Packed→Shipped→Delivered + cancellation/return branches), payment status tracking |
| **Payments** | Gateway integration, webhook signature verification, amount validation, idempotent processing, manual refunds |
| **Admin** | RBAC (owner, catalog_editor, fulfillment_operator, support), audit events |

**Deferred modules (post-pilot):** Shipping API integration, Notifications service, Analytics/reporting engine

### 3.3 Admin Panel (`apps/admin`)

| Section | P0 Scope |
|---|---|
| Dashboard | Today's orders count, pending confirmations, low stock alerts |
| Catalog | Create/edit/archive products, categories, variants, image upload, fabric metadata, preview before publish |
| Inventory | Stock per SKU, manual adjustments with reason + audit trail |
| Orders | Search/filter by status/date/phone, confirm, pack, dispatch (enter tracking ID), cancel, process returns, initiate refunds |
| Customers | Lookup by phone or order ID, support notes |
| Reports | Orders, GMV, COD pending, refunds, stock summary, top products |
| Settings | Admin user management, role assignment |

### 3.4 Shared Package (`packages/shared`)

- TypeScript DTOs and interfaces
- Enums: `OrderStatus`, `PaymentStatus`, `ShipmentStatus`, `UserRole`
- Constants: state machine transitions, validation rules
- Utils: paise ↔ rupee formatting, slug generation

---

## 4. Data Flow

### 4.1 Customer Purchase Flow

```
Customer                       API                          External
────────                       ───                          ────────
Browse (guest)
  ├─ GET /categories
  ├─ GET /products?filters
  └─ GET /products/:slug

Login (at checkout)
  ├─ POST /auth/otp/request ──────────────────────────────> OTP Provider
  └─ POST /auth/otp/verify ───> JWT issued

Cart
  ├─ POST /cart/items ─────────> validate variant + stock
  └─ GET  /cart ───────────────> server-priced items

Checkout
  ├─ POST /checkout/quote ─────> calculate totals + shipping
  │
  ├─ POST /orders ─────────────> BEGIN TX
  │   (idempotency key)           ├─ SELECT inventory FOR UPDATE
  │                                ├─ Reserve stock
  │                                ├─ Create order (PLACED)
  │                                └─ COMMIT
  │
  │ [If UPI prepaid]
  ├─ POST /payments/initiate ──────────────────────────────> Payment Gateway
  │                            <── checkout URL ────────────
  │ [Customer pays]
  │                            <── POST /webhooks/payments ─ Payment Gateway
  │                                ├─ Verify signature
  │                                ├─ Verify amount
  │                                ├─ Update payment = SUCCESS
  │                                └─ Order = CONFIRMED
  │
  │ [If COD]
  │                                └─ Order = PLACED (unpaid)
  │                                    Admin manually confirms
  │
  └─ GET /orders/:id ──────────> order detail + status
```

### 4.2 Inventory Reservation (Atomic)

```
POST /orders
    │
    ▼
BEGIN TRANSACTION
    ├── SELECT inventory WHERE variant_id = ? FOR UPDATE
    ├── available = on_hand - reserved
    ├── available >= qty?
    │     ├─ YES → reserved += qty
    │     │        Create reservation (expires in 30 min for UPI, 24 hours for COD)
    │     │        Create order
    │     │        COMMIT
    │     └─ NO  → ROLLBACK → 409 Conflict
    │
Expiry Worker (every 60s)
    └── Release expired HELD reservations → reserved -= qty
```

### 4.3 Order State Machine

```
PLACED ──> CONFIRMED ──> PACKED ──> SHIPPED ──> DELIVERED
  │            │                                    │
  ▼            ▼                                    ▼
CANCELLED  CANCELLED                         RETURN_REQUESTED
(release    (release                               │
 stock)      stock)                          ┌─────┴─────┐
                                             ▼           ▼
                                      RETURN_APPROVED  RETURN_REJECTED
                                             │
                                             ▼
                                          RETURNED
                                             │
                                             ▼
                                       REFUND_PENDING
                                             │
                                             ▼
                                          REFUNDED
```

---

## 5. Database Schema (Pilot)

18 tables — single PostgreSQL database:

```
users (id UUID PK, phone UNIQUE, name, email, verified_at, status, created_at, updated_at)
addresses (id, user_id FK, label, recipient_name, recipient_phone, line1, line2, landmark, city, district, state, pin_code, is_default, created_at, updated_at)
categories (id, slug UNIQUE, name, description, image_url, sort_order, active, created_at, updated_at)
products (id, slug UNIQUE, title, description, short_description, category_id FK, publish_status, fabric, weave_method, origin, care_instructions, blouse_piece, length, width, weight, occasion[], tags[], created_at, updated_at)
product_variants (id, product_id FK, sku UNIQUE, name, color, attributes JSONB, price_paise INT, compare_at_paise INT?, active, sort_order, created_at, updated_at)
product_media (id, product_id FK, variant_id?, object_key, thumbnail_key, type, mime_type, alt_text, width, height, size_bytes, sort_order, created_at)
inventory (variant_id PK FK, on_hand INT, reserved INT, unavailable INT, version INT, updated_at)
inventory_reservations (id, variant_id FK, order_id?, qty, status, expires_at, created_at, updated_at)
cart_items (id, user_id FK, variant_id FK, quantity, added_at, updated_at)
orders (id, public_number UNIQUE, user_id FK, status, payment_mode, payment_status, subtotal_paise, discount_paise, shipping_paise, tax_paise, total_paise, address_snapshot JSONB, notes, idempotency_key UNIQUE, confirmed_at, packed_at, shipped_at, delivered_at, cancelled_at, cancellation_reason, created_at, updated_at)
order_items (id, order_id FK, variant_id FK, product_title, variant_name, sku, qty, unit_price_paise, tax_paise, total_paise, product_image_url, created_at)
payments (id, order_id FK, gateway, provider_order_id, provider_payment_id, method, amount_paise, currency, status, failure_reason, paid_at, created_at, updated_at)
shipments (id, order_id FK, carrier, tracking_id, tracking_url, status, estimated_delivery, dispatched_at, delivered_at, created_at, updated_at)
returns (id, order_id FK, order_item_id FK, qty, reason, reason_detail, status, admin_notes, requested_at, resolved_at, created_at, updated_at)
refunds (id, order_id FK, return_id? FK, payment_id FK, gateway_refund_id, amount_paise, status, reason, initiated_by FK, created_at, updated_at)
admin_users (id, phone UNIQUE, name, email, role, status, last_login_at, created_at, updated_at)
audit_events (id, actor_type, actor_id, action, entity_type, entity_id, before_state JSONB, after_state JSONB, metadata JSONB, created_at)
webhook_events (id, provider, provider_event_id UNIQUE, event_type, payload JSONB, status, processed_at, error_message, created_at)
```

Key constraints: integer paise for money, UTC timestamps, UUID PKs, indexes on SKU/slug/phone/order status/public_number. See `docs/architecture/database-design.md` for full column details, types, and constraints.

---

## 6. REST API Contract (Pilot)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /health | Public | Health check |
| POST | /api/v1/auth/otp/request | Public (rate-limited) | Send OTP |
| POST | /api/v1/auth/otp/verify | Public | Verify OTP, get JWT |
| POST | /api/v1/auth/refresh | Public | Refresh access token |
| GET | /api/v1/me | Customer | Get profile |
| PATCH | /api/v1/me | Customer | Update profile |
| GET | /api/v1/me/addresses | Customer | List addresses |
| POST | /api/v1/me/addresses | Customer | Create address |
| PATCH | /api/v1/me/addresses/:id | Customer | Update address |
| DELETE | /api/v1/me/addresses/:id | Customer | Delete address |
| GET | /api/v1/categories | Public | Category list |
| GET | /api/v1/products | Public | Paginated catalog with filters/sort |
| GET | /api/v1/products/:slug | Public | Product detail |
| GET | /api/v1/cart | Customer | Get cart (server-priced) |
| POST | /api/v1/cart/items | Customer | Add to cart |
| PATCH | /api/v1/cart/items/:id | Customer | Update cart item quantity |
| DELETE | /api/v1/cart/items/:id | Customer | Remove from cart |
| POST | /api/v1/checkout/quote | Customer | Server-calculated totals |
| POST | /api/v1/orders | Customer | Place order (idempotent) |
| GET | /api/v1/orders | Customer | Order history |
| GET | /api/v1/orders/:id | Customer (owner) | Order detail |
| POST | /api/v1/orders/:id/cancel | Customer | Cancel order |
| POST | /api/v1/orders/:id/return | Customer | Request return |
| POST | /api/v1/payments/:orderId/initiate | Customer | Start UPI payment |
| POST | /api/v1/webhooks/payments | Webhook (signed) | Payment callback |
| POST | /api/v1/admin/categories | Admin | Create category |
| PATCH | /api/v1/admin/categories/:id | Admin | Update category |
| GET | /api/v1/admin/products | Admin | List all products (incl. drafts) |
| POST | /api/v1/admin/products | Admin | Create product with variants |
| PATCH | /api/v1/admin/products/:id | Admin | Update product |
| POST | /api/v1/admin/products/:id/variants | Admin | Add variant |
| PATCH | /api/v1/admin/products/:id/variants/:variantId | Admin | Update variant |
| POST | /api/v1/admin/media/upload-url | Admin | Request signed upload URL |
| POST | /api/v1/admin/media/confirm | Admin | Confirm upload + thumbnails |
| DELETE | /api/v1/admin/media/:id | Admin | Delete media |
| GET | /api/v1/admin/inventory | Admin | List stock levels |
| POST | /api/v1/admin/inventory/adjustments | Admin | Adjust stock (audited) |
| GET | /api/v1/admin/orders | Admin | Search/filter orders |
| GET | /api/v1/admin/orders/:id | Admin | Order detail (admin view) |
| PATCH | /api/v1/admin/orders/:id/status | Admin | Update order status |
| POST | /api/v1/admin/orders/:id/refund | Admin | Initiate refund |
| GET | /api/v1/admin/reports/orders | Admin | Orders & revenue report |
| GET | /api/v1/admin/reports/stock | Admin | Stock summary |
| GET | /api/v1/admin/reports/top-products | Admin | Top selling products |
| GET | /api/v1/admin/users | Admin (owner) | List admin users |
| POST | /api/v1/admin/users | Admin (owner) | Create admin user |

**38 endpoints total.** Errors: `{success, error: {code, message, details?}, requestId}` with 400/401/403/404/409/429 statuses. See `docs/api/openapi.yaml` for full request/response schemas.

---

## 7. External Integrations (Pilot)

| Service | Integration | Pilot Approach |
|---|---|---|
| **OTP** | API call to send/verify | Managed provider (MSG91/Gupshup), rate-limited per phone+IP |
| **Payments** | Server SDK + webhook | Razorpay/Cashfree sandbox → production; verify signature + amount |
| **Media Storage** | S3 signed uploads | Admin uploads images; generate thumbnails on upload via Sharp |
| **CDN** | CloudFront in front of S3 | Cache product images with long TTL |
| **WhatsApp** | API for notifications | Order confirmation + shipping updates (via aggregator) |
| **Shipping** | Manual (no API) | Admin enters carrier name + tracking ID; no automated serviceability |

---

## 8. Deployment (Pilot)

### Environments

| Env | DB | Payments | Purpose |
|---|---|---|---|
| Local | Docker Compose PostgreSQL | Mock | Development |
| Staging | Managed PostgreSQL | Sandbox | Testing with team |
| Production | Managed PostgreSQL (daily backups) | Live | Real orders |

### Infrastructure (Minimal for Pilot)

```
┌─────────────┐  ┌──────────────┐
│ Mobile App  │  │ Admin Panel  │
│ Expo (RN)   │  │ Next.js      │
│ Android+iOS │  │ (Vercel)     │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬───────┘
                │ HTTPS
       ┌────────▼────────┐
       │  NestJS API     │
       │  (Single        │
       │   Container)    │
       │  Railway/Render  │
       └──┬──────┬───────┘
          │      │
   ┌──────▼──┐  ┌▼──────────┐
   │PostgreSQL│  │ S3 + CDN  │
   │(Managed) │  │ (Images)  │
   └─────────┘  └───────────┘
```

- **No load balancer** — single container sufficient for pilot traffic
- **No read replicas** — small dataset, low query volume
- **No message broker** — background workers run in-process (cron-style)
- **No Kubernetes** — managed container platform (Railway/Render) or single EC2

### CI/CD

```
Push → Lint + Typecheck + Test (parallel) → Build → Deploy Staging (auto) → Deploy Prod (manual)
```

---

## 9. Security (Pilot)

| Area | Approach |
|---|---|
| Auth | Phone OTP → JWT (15min access + 7d refresh) |
| Admin auth | Same OTP flow, role checked via DB; admin endpoints behind RBAC guard |
| Payments | Never store card/UPI creds; hosted gateway SDK; verify webhook signatures |
| Inputs | class-validator DTOs on every endpoint; sanitize strings |
| Uploads | Signed URLs with content-type restriction; max 10MB images, 50MB video |
| Secrets | Environment variables only; .env in .gitignore |
| HTTPS | TLS enforced; platform handles certs |
| Rate limiting | OTP: 3/phone/10min, 10/IP/hour, 5 verify attempts per OTP; API: 100 req/min/user; Public: 30 req/min/IP |
| Audit | All admin mutations logged in audit_events table |

---

## 10. Monorepo Structure

```
sajani-app/
├── apps/
│   ├── mobile/              # React Native + Expo
│   │   └── src/
│   │       ├── components/
│   │       ├── screens/
│   │       ├── navigation/
│   │       ├── services/    # API client
│   │       ├── hooks/
│   │       ├── store/
│   │       └── theme/       # Sajani brand colors/typography
│   ├── api/                 # NestJS
│   │   ├── src/modules/     # auth, users, addresses, categories,
│   │   │                    # products, media, inventory, cart,
│   │   │                    # checkout, orders, payments, admin
│   │   ├── prisma/          # schema + migrations
│   │   └── test/
│   └── admin/               # Next.js
│       └── src/
│           ├── app/
│           ├── components/
│           └── services/
├── packages/
│   └── shared/              # Types, enums, constants, utils
├── docs/architecture/
├── docker-compose.yml       # Local PostgreSQL
├── package.json             # Workspace root
└── tsconfig.base.json
```

---

## 11. Open Decisions (Must Resolve Before Build)

| # | Decision | Default Proposal | Owner |
|---|---|---|---|
| 1 | Payment gateway | Razorpay (wider UPI support) | Finance |
| 2 | OTP provider | MSG91 (cost-effective for India) | Tech |
| 3 | Hosting platform | Railway (simple, managed Postgres included) | Tech |
| 4 | Shipping areas | Sambalpur + 5 nearby districts | Ops |
| 5 | COD surcharge | None for pilot | Business |
| 6 | Return window | 7 days, unworn, tags attached | Business |
| 7 | Tax treatment | Inclusive GST shown in product price | Finance |
| 8 | Initial SKU count | ~20–30 designs from factory audit | Merchandising |
| 9 | WhatsApp provider | Gupshup / Wati | Tech |
| 10 | Stock ownership | Reserved allocation to Sajani (not shared) | Ops |
