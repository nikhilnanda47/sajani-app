# Sajani — Database Design (Pilot P0)

**Version:** 1.0  
**Date:** 13 November 2026  
**Database:** PostgreSQL 16  
**ORM:** Prisma  

---

## 1. Design Principles

| Principle | Implementation |
|---|---|
| Money in integer paise | All amounts stored as `INT` (1 INR = 100 paise). No floats. |
| UTC timestamps | All `timestamp` columns use `timestamptz`. App converts for display. |
| UUID primary keys | `UUID v4` — non-sequential, safe for public URLs and APIs. |
| Human-readable order numbers | `SAJ-YYYYMMDD-XXXX` format. Separate from UUID PK. |
| Immutable order history | Order items snapshot product title, SKU, and price at time of purchase. Address is snapshot as JSONB. Source data may change later. |
| Soft deletes for catalog | Products and categories use `publish_status` / `active` flags. Never hard-delete — preserves order history references. |
| Audit everything | All admin/system mutations logged in `audit_events` with actor, action, before/after state. |
| Row-level locking for inventory | `SELECT ... FOR UPDATE` on inventory rows during checkout to prevent overselling. |

---

## 2. Entity Summary

| # | Entity | Purpose | Estimated Pilot Rows |
|---|---|---|---|
| 1 | users | Customer accounts (phone-based) | ~100–500 |
| 2 | addresses | Delivery addresses per user | ~200–1000 |
| 3 | categories | Product categories (Everyday, Signature, Heritage, Celebrations) | ~5–10 |
| 4 | products | Saree/textile listings | ~20–30 |
| 5 | product_variants | Purchasable SKUs (color/size/weave variations) | ~40–80 |
| 6 | product_media | Product images and optional video | ~100–200 |
| 7 | inventory | Stock levels per variant | ~40–80 |
| 8 | inventory_reservations | Temporary stock holds during checkout | ~10–50 active |
| 9 | cart_items | Customer shopping cart | ~50–200 |
| 10 | orders | Customer orders | ~50–200 |
| 11 | order_items | Line items per order | ~50–300 |
| 12 | payments | Payment attempts and confirmations | ~50–200 |
| 13 | shipments | Shipping/tracking info per order | ~50–200 |
| 14 | returns | Return requests | ~5–20 |
| 15 | refunds | Refund records tied to returns | ~5–20 |
| 16 | admin_users | Admin/staff accounts with roles | ~3–5 |
| 17 | audit_events | All admin and system mutations | Growing |
| 18 | webhook_events | Inbound webhook payloads (payments, shipping) | Growing |

---

## 3. Detailed Table Definitions

### 3.1 users

Customer accounts identified by phone number.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | E.164 format (+91XXXXXXXXXX) |
| name | VARCHAR(100) | NULL | Set after first order or profile update |
| email | VARCHAR(255) | NULL, UNIQUE | Optional, for receipts |
| verified_at | TIMESTAMPTZ | NULL | Set when OTP verified |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active, suspended |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `phone` (unique), `status`

---

### 3.2 addresses

Delivery addresses. Each user can have multiple; one marked default.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| label | VARCHAR(50) | NULL | "Home", "Office", etc. |
| recipient_name | VARCHAR(100) | NOT NULL | May differ from user name |
| recipient_phone | VARCHAR(15) | NOT NULL | Delivery contact |
| line1 | VARCHAR(255) | NOT NULL | Street / house / flat |
| line2 | VARCHAR(255) | NULL | Area / locality |
| landmark | VARCHAR(255) | NULL | Near / behind |
| city | VARCHAR(100) | NOT NULL | |
| district | VARCHAR(100) | NOT NULL | Important for Odisha delivery |
| state | VARCHAR(100) | NOT NULL, DEFAULT 'Odisha' | |
| pin_code | VARCHAR(6) | NOT NULL | Indian PIN code |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `user_id`, `pin_code`  
**Constraint:** Application-level — only one `is_default = true` per user

---

### 3.3 categories

Product categories for catalog organization.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe: "everyday", "heritage" |
| name | VARCHAR(100) | NOT NULL | Display name |
| description | TEXT | NULL | |
| image_url | VARCHAR(500) | NULL | Category banner image |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display ordering |
| active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `slug` (unique), `active + sort_order`

---

### 3.4 products

Main product listing. One product can have multiple variants and media.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-safe, auto-generated from title |
| title | VARCHAR(255) | NOT NULL | "Sambalpuri Ikat Silk Saree – Maroon & Gold" |
| description | TEXT | NULL | Rich product description |
| short_description | VARCHAR(500) | NULL | For product cards |
| category_id | UUID | FK → categories.id, NOT NULL | |
| publish_status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | draft, published, archived |
| fabric | VARCHAR(100) | NULL | "Pure Silk", "Cotton", "Silk-Cotton Blend" |
| weave_method | VARCHAR(100) | NULL | "Handloom Ikat", "Powerloom" — honest labeling |
| origin | VARCHAR(200) | NULL | "Sonepur, Subarnapur District, Odisha" |
| care_instructions | TEXT | NULL | Wash care details |
| blouse_piece | VARCHAR(100) | NULL | "Included – 0.8m unstitched" or "Not included" |
| length | VARCHAR(50) | NULL | "5.5 meters" / "6.3 meters with blouse" |
| width | VARCHAR(50) | NULL | "46 inches" |
| weight | VARCHAR(50) | NULL | "450 grams" |
| occasion | VARCHAR(100)[] | NULL | Array: ["Daily Wear", "Festive", "Wedding"] |
| tags | VARCHAR(100)[] | NULL | Searchable tags |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `slug` (unique), `category_id`, `publish_status`, `fabric`, `weave_method`  
**Full-text search:** `title`, `description`, `tags` (for pilot, `ILIKE` is sufficient; no need for tsvector)

---

### 3.5 product_variants

Purchasable SKU. Each product has at least one variant.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| product_id | UUID | FK → products.id, NOT NULL | ON DELETE CASCADE |
| sku | VARCHAR(50) | UNIQUE, NOT NULL | "SAJ-IKT-MRN-001" |
| name | VARCHAR(100) | NULL | Variant label: "Maroon with Gold Border" |
| color | VARCHAR(50) | NULL | Primary color for filtering |
| attributes | JSONB | NULL | Flexible: {"border": "gold zari", "pallu": "contrast"} |
| price_paise | INT | NOT NULL | Price in paise (e.g., 350000 = ₹3,500) |
| compare_at_paise | INT | NULL | Original/MRP for showing discount; NULL = no discount |
| active | BOOLEAN | NOT NULL, DEFAULT true | |
| sort_order | INT | NOT NULL, DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `sku` (unique), `product_id`, `active`, `price_paise`, `color`  
**Constraint:** `price_paise > 0`, `compare_at_paise IS NULL OR compare_at_paise > price_paise`

---

### 3.6 product_media

Images and optional video for products/variants.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| product_id | UUID | FK → products.id, NOT NULL | ON DELETE CASCADE |
| variant_id | UUID | FK → product_variants.id, NULL | NULL = applies to all variants |
| object_key | VARCHAR(500) | NOT NULL | S3 key: "products/{product_id}/{uuid}.jpg" |
| thumbnail_key | VARCHAR(500) | NULL | S3 key for generated thumbnail |
| type | VARCHAR(20) | NOT NULL | "image", "video" |
| mime_type | VARCHAR(50) | NOT NULL | "image/jpeg", "image/webp", "video/mp4" |
| alt_text | VARCHAR(255) | NULL | Accessibility description |
| width | INT | NULL | Pixel width |
| height | INT | NULL | Pixel height |
| size_bytes | INT | NULL | File size |
| sort_order | INT | NOT NULL, DEFAULT 0 | First image = primary |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `product_id + sort_order`, `variant_id`

---

### 3.7 inventory

One row per variant. Source of truth for stock levels.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| variant_id | UUID | PK, FK → product_variants.id | One-to-one |
| on_hand | INT | NOT NULL, DEFAULT 0 | Physical stock count |
| reserved | INT | NOT NULL, DEFAULT 0 | Held for pending orders |
| unavailable | INT | NOT NULL, DEFAULT 0 | Damaged / QC hold |
| version | INT | NOT NULL, DEFAULT 1 | Optimistic locking |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Computed (app-level):** `available = on_hand - reserved - unavailable`  
**Constraints:** `on_hand >= 0`, `reserved >= 0`, `unavailable >= 0`, `reserved + unavailable <= on_hand`

---

### 3.8 inventory_reservations

Temporary stock holds created at checkout, released on expiry or cancellation.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| variant_id | UUID | FK → product_variants.id, NOT NULL | |
| order_id | UUID | FK → orders.id, NULL | Set when order is created |
| qty | INT | NOT NULL | Quantity reserved |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'held' | held, committed, released, expired |
| expires_at | TIMESTAMPTZ | NOT NULL | 30 min for UPI; longer for COD |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `variant_id`, `order_id`, `status + expires_at` (for expiry worker)  
**Constraint:** `qty > 0`

---

### 3.9 cart_items

Server-side cart. Prices are NOT stored — recalculated from variant on every read.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| variant_id | UUID | FK → product_variants.id, NOT NULL | |
| quantity | INT | NOT NULL, DEFAULT 1 | |
| added_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `user_id`, UNIQUE(`user_id`, `variant_id`)  
**Constraint:** `quantity > 0`  
**Note:** No price column — server joins with product_variants.price_paise at read time to prevent stale prices.

---

### 3.10 orders

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| public_number | VARCHAR(20) | UNIQUE, NOT NULL | "SAJ-20261115-0001" |
| user_id | UUID | FK → users.id, NOT NULL | |
| status | VARCHAR(30) | NOT NULL, DEFAULT 'placed' | See state machine |
| payment_mode | VARCHAR(20) | NOT NULL | "upi", "cod" |
| payment_status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, initiated, success, failed, refund_pending, refunded |
| subtotal_paise | INT | NOT NULL | Sum of line items |
| discount_paise | INT | NOT NULL, DEFAULT 0 | Coupon/promo (future) |
| shipping_paise | INT | NOT NULL | Shipping charge |
| tax_paise | INT | NOT NULL | GST or tax amount |
| total_paise | INT | NOT NULL | Final payable |
| address_snapshot | JSONB | NOT NULL | Frozen copy of delivery address |
| notes | TEXT | NULL | Customer delivery instructions |
| idempotency_key | VARCHAR(100) | UNIQUE, NOT NULL | Prevents duplicate orders |
| confirmed_at | TIMESTAMPTZ | NULL | |
| packed_at | TIMESTAMPTZ | NULL | |
| shipped_at | TIMESTAMPTZ | NULL | |
| delivered_at | TIMESTAMPTZ | NULL | |
| cancelled_at | TIMESTAMPTZ | NULL | |
| cancellation_reason | VARCHAR(255) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `public_number` (unique), `user_id`, `status`, `payment_status`, `created_at`, `idempotency_key` (unique)  
**Constraints:** All paise fields `>= 0`, `total_paise = subtotal_paise - discount_paise + shipping_paise + tax_paise`

**Order statuses:** `placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `return_requested`, `return_approved`, `return_rejected`, `returned`, `refund_pending`, `refunded`

---

### 3.11 order_items

Snapshot of what was ordered. Prices frozen at time of purchase.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | ON DELETE CASCADE |
| variant_id | UUID | FK → product_variants.id, NOT NULL | Reference (may change later) |
| product_title | VARCHAR(255) | NOT NULL | Snapshot |
| variant_name | VARCHAR(100) | NULL | Snapshot |
| sku | VARCHAR(50) | NOT NULL | Snapshot |
| qty | INT | NOT NULL | |
| unit_price_paise | INT | NOT NULL | Price per unit at time of order |
| tax_paise | INT | NOT NULL, DEFAULT 0 | Tax per unit |
| total_paise | INT | NOT NULL | qty × (unit_price_paise + tax_paise) |
| product_image_url | VARCHAR(500) | NULL | Thumbnail snapshot for order history |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `order_id`, `variant_id`  
**Constraints:** `qty > 0`, `unit_price_paise > 0`

---

### 3.12 payments

Payment attempts and results. One order may have multiple attempts (retry after failure).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | |
| gateway | VARCHAR(50) | NOT NULL | "razorpay", "cashfree" |
| provider_order_id | VARCHAR(100) | NULL | Gateway's order ID |
| provider_payment_id | VARCHAR(100) | NULL | Gateway's payment ID |
| method | VARCHAR(30) | NULL | "upi", "cod" |
| amount_paise | INT | NOT NULL | |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'INR' | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, initiated, success, failed, expired |
| failure_reason | VARCHAR(255) | NULL | Gateway error message |
| paid_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `order_id`, `provider_order_id`, `provider_payment_id`, `status`  
**Constraint:** `amount_paise > 0`

---

### 3.13 shipments

Tracking info. Pilot: admin manually enters carrier + tracking ID.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | |
| carrier | VARCHAR(100) | NULL | "India Post", "DTDC", "Delhivery" |
| tracking_id | VARCHAR(100) | NULL | Carrier tracking number |
| tracking_url | VARCHAR(500) | NULL | Full tracking URL |
| status | VARCHAR(30) | NOT NULL, DEFAULT 'pending' | pending, dispatched, in_transit, out_for_delivery, delivered, rto |
| estimated_delivery | DATE | NULL | |
| dispatched_at | TIMESTAMPTZ | NULL | |
| delivered_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `order_id`, `tracking_id`, `status`

---

### 3.14 returns

Return requests linked to orders.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | |
| order_item_id | UUID | FK → order_items.id, NOT NULL | Which item is being returned |
| qty | INT | NOT NULL | Quantity being returned |
| reason | VARCHAR(255) | NOT NULL | "Damaged", "Wrong product", "Not as described", "Other" |
| reason_detail | TEXT | NULL | Customer's description |
| status | VARCHAR(30) | NOT NULL, DEFAULT 'requested' | requested, approved, rejected, received, completed |
| admin_notes | TEXT | NULL | Internal notes |
| requested_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| resolved_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `order_id`, `status`  
**Constraint:** `qty > 0`

---

### 3.15 refunds

Refund records tied to returns or cancellations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | |
| return_id | UUID | FK → returns.id, NULL | NULL for cancellation refunds |
| payment_id | UUID | FK → payments.id, NOT NULL | Original payment being refunded |
| gateway_refund_id | VARCHAR(100) | NULL | Gateway's refund ID |
| amount_paise | INT | NOT NULL | Refund amount |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, processing, success, failed |
| reason | VARCHAR(255) | NULL | |
| initiated_by | UUID | FK → admin_users.id, NOT NULL | Admin who approved |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `order_id`, `return_id`, `payment_id`, `gateway_refund_id`, `status`  
**Constraint:** `amount_paise > 0`

---

### 3.16 admin_users

Staff accounts with role-based access.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(255) | NULL | |
| role | VARCHAR(30) | NOT NULL | owner, catalog_editor, fulfillment_operator, support |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active, suspended |
| last_login_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `phone` (unique), `role`, `status`

---

### 3.17 audit_events

Immutable log of all admin and system mutations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| actor_type | VARCHAR(20) | NOT NULL | "admin", "system", "customer" |
| actor_id | UUID | NULL | admin_users.id or users.id |
| action | VARCHAR(50) | NOT NULL | "product.created", "inventory.adjusted", "order.confirmed" |
| entity_type | VARCHAR(50) | NOT NULL | "product", "inventory", "order" |
| entity_id | UUID | NOT NULL | |
| before_state | JSONB | NULL | State before change |
| after_state | JSONB | NULL | State after change |
| metadata | JSONB | NULL | Additional context (reason, IP, etc.) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `entity_type + entity_id`, `actor_id`, `action`, `created_at`  
**Note:** Append-only table. Never update or delete rows.

---

### 3.18 webhook_events

Inbound webhook payloads for idempotent processing.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| provider | VARCHAR(50) | NOT NULL | "razorpay", "cashfree" |
| provider_event_id | VARCHAR(200) | UNIQUE, NOT NULL | Deduplicate by this |
| event_type | VARCHAR(100) | NOT NULL | "payment.captured", "payment.failed" |
| payload | JSONB | NOT NULL | Raw webhook body |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'received' | received, processed, failed |
| processed_at | TIMESTAMPTZ | NULL | |
| error_message | TEXT | NULL | If processing failed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Indexes:** `provider_event_id` (unique), `provider + event_type`, `status`, `created_at`

---

## 4. Key Relationships

```
users ──1:N──> addresses
users ──1:N──> cart_items
users ──1:N──> orders

categories ──1:N──> products

products ──1:N──> product_variants
products ──1:N──> product_media

product_variants ──1:1──> inventory
product_variants ──1:N──> inventory_reservations
product_variants ──1:N──> cart_items
product_variants ──1:N──> order_items

orders ──1:N──> order_items
orders ──1:N──> payments
orders ──1:N──> shipments
orders ──1:N──> returns
orders ──1:N──> refunds
orders ──1:N──> inventory_reservations

returns ──1:N──> refunds

admin_users ──1:N──> refunds (initiated_by)
admin_users ──1:N──> audit_events (actor_id)
```

---

## 5. Indexing Strategy

| Table | Index | Type | Purpose |
|---|---|---|---|
| users | phone | UNIQUE | Login lookup |
| products | slug | UNIQUE | URL routing |
| products | category_id, publish_status | COMPOSITE | Catalog filtering |
| product_variants | sku | UNIQUE | Inventory operations |
| product_variants | product_id, active | COMPOSITE | Product detail query |
| inventory | variant_id | PK | Direct stock lookup |
| inventory_reservations | status, expires_at | COMPOSITE | Expiry worker query |
| orders | user_id, created_at | COMPOSITE | Customer order history |
| orders | public_number | UNIQUE | Customer lookup |
| orders | status, created_at | COMPOSITE | Admin order dashboard |
| payments | provider_payment_id | BTREE | Webhook reconciliation |
| webhook_events | provider_event_id | UNIQUE | Idempotent processing |
| audit_events | entity_type, entity_id | COMPOSITE | Entity history lookup |

---

## 6. Data Integrity Rules

| Rule | Enforcement |
|---|---|
| Stock cannot go negative | CHECK constraint: `on_hand >= 0`, `reserved >= 0` |
| Reserved cannot exceed on_hand | CHECK: `reserved + unavailable <= on_hand` |
| Reservation is atomic | `SELECT FOR UPDATE` + single transaction |
| One cart entry per variant per user | UNIQUE(`user_id`, `variant_id`) |
| Order prices are immutable | Snapshot in `order_items`, not joined from product |
| Address is frozen at order time | `address_snapshot` JSONB on orders |
| No duplicate webhook processing | UNIQUE on `provider_event_id` |
| No duplicate order creation | UNIQUE on `idempotency_key` |
| Refund ≤ payment amount | Application-level check before insert |
| Valid state transitions only | Application-level state machine validation |

---

## 7. Migration Strategy

- All schema changes via Prisma migrations (versioned, reversible)
- Every migration tested with rollback in staging before production
- Destructive changes (column drops) deferred to separate migration after verification
- Seed script for development with sample categories, products, variants, and inventory
