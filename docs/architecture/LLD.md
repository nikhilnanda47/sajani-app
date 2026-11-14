# Sajani — Low-Level Design (Pilot P0)

**Version:** 1.0  
**Date:** 13 November 2026  
**Status:** Draft for review  

---

## 1. Backend Module Architecture

```
src/
├── main.ts                          # Bootstrap NestJS app
├── app.module.ts                    # Root module
├── config/
│   ├── config.module.ts             # Environment config
│   ├── config.service.ts            # Typed config access
│   └── config.validation.ts         # Joi/Zod env schema
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Customer auth
│   │   ├── admin-auth.guard.ts      # Admin auth
│   │   └── roles.guard.ts           # RBAC check
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── idempotency-key.decorator.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts   # Request/response logging
│   │   └── transform.interceptor.ts # Response envelope
│   ├── filters/
│   │   └── http-exception.filter.ts # Standard error format
│   ├── pipes/
│   │   └── validation.pipe.ts       # DTO validation
│   ├── dto/
│   │   ├── pagination.dto.ts        # Cursor pagination
│   │   └── api-response.dto.ts      # {success, data, error, requestId}
│   └── utils/
│       ├── paise.util.ts            # Money helpers
│       ├── slug.util.ts             # Slug generation
│       └── order-number.util.ts     # SAJ-YYYYMMDD-XXXX generator
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts            # Extends PrismaClient, onModuleInit
└── modules/
    ├── auth/
    ├── users/
    ├── addresses/
    ├── categories/
    ├── products/
    ├── media/
    ├── inventory/
    ├── cart/
    ├── checkout/
    ├── orders/
    ├── payments/
    └── admin/
```

---

## 2. Module Designs

### 2.1 Auth Module

**Purpose:** OTP-based phone authentication for customers and admins.

```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── request-otp.dto.ts
│   └── verify-otp.dto.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   └── throttle-otp.guard.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

**DTOs:**

```typescript
// request-otp.dto.ts
class RequestOtpDto {
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/)
  phone: string;             // E.164 Indian mobile
}

// verify-otp.dto.ts
class VerifyOtpDto {
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/)
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
```

**Service Methods:**

| Method | Input | Output | Business Rules |
|---|---|---|---|
| `requestOtp(dto)` | phone | `{ message, expiresIn }` | Rate limit: 3/phone/10min, 10/IP/hour. Generate 6-digit OTP, store hashed with 5min expiry. Send via SMS provider. |
| `verifyOtp(dto)` | phone, otp | `{ accessToken, refreshToken, isNewUser }` | Compare hashed OTP. If valid: upsert user (create if new), set `verified_at`, issue JWT pair. Mark OTP as used. |
| `refreshToken(token)` | refreshToken | `{ accessToken }` | Validate refresh token, issue new access token. |

**JWT Payload:**

```typescript
interface JwtPayload {
  sub: string;        // user UUID
  phone: string;
  type: 'customer' | 'admin';
  iat: number;
  exp: number;
}
```

**Token Lifecycle:**
- Access token: 15 minutes
- Refresh token: 7 days, stored as httpOnly cookie
- On verify: return both tokens
- On refresh: return new access token only

**Error Cases:**

| Error | HTTP | Code | When |
|---|---|---|---|
| OTP_RATE_LIMITED | 429 | AUTH_001 | Too many OTP requests |
| OTP_EXPIRED | 400 | AUTH_002 | OTP older than 5 minutes |
| OTP_INVALID | 401 | AUTH_003 | Wrong OTP code |
| OTP_MAX_ATTEMPTS | 401 | AUTH_004 | 5 wrong attempts → invalidate OTP |
| REFRESH_TOKEN_INVALID | 401 | AUTH_005 | Expired or tampered refresh token |

---

### 2.2 Users Module

**Purpose:** Customer profile management.

```
modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    └── update-profile.dto.ts
```

**DTOs:**

```typescript
class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

**Service Methods:**

| Method | Input | Output | Rules |
|---|---|---|---|
| `findById(id)` | UUID | User | Return profile |
| `findByPhone(phone)` | phone | User or null | Lookup for auth |
| `update(id, dto)` | UUID, UpdateProfileDto | User | Only own profile; email uniqueness check |

---

### 2.3 Addresses Module

**Purpose:** Delivery address CRUD with default management.

```
modules/addresses/
├── addresses.module.ts
├── addresses.controller.ts
├── addresses.service.ts
└── dto/
    ├── create-address.dto.ts
    └── update-address.dto.ts
```

**DTOs:**

```typescript
class CreateAddressDto {
  @IsString() @MaxLength(100)
  recipientName: string;

  @Matches(/^\+91[6-9]\d{9}$/)
  recipientPhone: string;

  @IsString() @MaxLength(255)
  line1: string;

  @IsOptional() @IsString()
  line2?: string;

  @IsOptional() @IsString()
  landmark?: string;

  @IsString() @MaxLength(100)
  city: string;

  @IsString() @MaxLength(100)
  district: string;

  @IsString() @MaxLength(100) @IsOptional()
  state?: string;               // Defaults to "Odisha"

  @Matches(/^[1-9][0-9]{5}$/)
  pinCode: string;

  @IsOptional() @IsString()
  label?: string;               // "Home", "Office"

  @IsOptional() @IsBoolean()
  isDefault?: boolean;
}
```

**Service Methods:**

| Method | Input | Output | Rules |
|---|---|---|---|
| `create(userId, dto)` | UUID, CreateAddressDto | Address | Max 10 addresses per user. If `isDefault=true` or first address, unset other defaults in same transaction. |
| `findAll(userId)` | UUID | Address[] | Only own addresses, ordered default-first |
| `update(userId, id, dto)` | UUID, UUID, UpdateDto | Address | Ownership check. If setting default, unset others. |
| `delete(userId, id)` | UUID, UUID | void | Ownership check. Cannot delete if used in active order (warn only). |

**Error Cases:**

| Error | HTTP | Code |
|---|---|---|
| ADDRESS_NOT_FOUND | 404 | ADDR_001 |
| ADDRESS_LIMIT_REACHED | 400 | ADDR_002 |
| ADDRESS_NOT_OWNED | 403 | ADDR_003 |

---

### 2.4 Categories Module

**Purpose:** Product category listing (admin-managed).

```
modules/categories/
├── categories.module.ts
├── categories.controller.ts
├── categories.service.ts
└── dto/
    ├── create-category.dto.ts
    └── update-category.dto.ts
```

**DTOs:**

```typescript
class CreateCategoryDto {
  @IsString() @MaxLength(100)
  name: string;

  @IsOptional() @IsString()
  slug?: string;               // Auto-generated from name if omitted

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}
```

**Endpoints:**

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /api/v1/categories | Public | Active categories, sorted by `sort_order` |
| POST | /api/v1/admin/categories | Admin (catalog_editor+) | Create category |
| PATCH | /api/v1/admin/categories/:id | Admin | Update category |

---

### 2.5 Products Module

**Purpose:** Product catalog — admin CRUD + public search/filter/sort.

```
modules/products/
├── products.module.ts
├── products.controller.ts        # Public endpoints
├── products-admin.controller.ts  # Admin endpoints
├── products.service.ts
└── dto/
    ├── create-product.dto.ts
    ├── update-product.dto.ts
    ├── create-variant.dto.ts
    ├── update-variant.dto.ts
    ├── product-query.dto.ts
    └── product-response.dto.ts
```

**Product Query DTO (public catalog):**

```typescript
class ProductQueryDto {
  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsOptional() @IsString()
  search?: string;              // ILIKE on title, description, tags

  @IsOptional() @IsString()
  fabric?: string;              // Exact filter

  @IsOptional() @IsString()
  weaveMethod?: string;

  @IsOptional() @IsString()
  color?: string;               // Filter via variants

  @IsOptional() @IsInt() @Min(0)
  minPrice?: number;            // In paise

  @IsOptional() @IsInt()
  maxPrice?: number;

  @IsOptional() @IsEnum(ProductSortBy)
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'relevance';

  @IsOptional() @IsString()
  cursor?: string;              // Cursor pagination

  @IsOptional() @IsInt() @Min(1) @Max(50)
  limit?: number;               // Default 20
}
```

**Create Product DTO (admin):**

```typescript
class CreateProductDto {
  @IsString() @MaxLength(255)
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  shortDescription?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional() @IsEnum(PublishStatus)
  publishStatus?: 'draft' | 'published';  // Default: draft

  @IsOptional() @IsString()
  fabric?: string;

  @IsOptional() @IsString()
  weaveMethod?: string;

  @IsOptional() @IsString()
  origin?: string;

  @IsOptional() @IsString()
  careInstructions?: string;

  @IsOptional() @IsString()
  blousePiece?: string;

  @IsOptional() @IsString()
  length?: string;

  @IsOptional() @IsString()
  width?: string;

  @IsOptional() @IsString()
  weight?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  occasion?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @ArrayMinSize(1)
  variants: CreateVariantDto[];
}

class CreateVariantDto {
  @IsString() @MaxLength(50)
  sku: string;

  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsObject()
  attributes?: Record<string, any>;

  @IsInt() @Min(1)
  pricePaise: number;

  @IsOptional() @IsInt() @Min(1)
  compareAtPaise?: number;

  @IsInt() @Min(0)
  initialStock: number;         // Creates inventory row
}
```

**Service Methods:**

| Method | Input | Output | Rules |
|---|---|---|---|
| `findAll(query)` | ProductQueryDto | `{ items, cursor, hasMore }` | Only `published` + `active` variants. Cursor pagination by `created_at` + `id`. Join inventory for availability. |
| `findBySlug(slug)` | slug | ProductDetail | Include variants (active only), media (sorted), inventory availability. 404 if not published. |
| `create(dto, adminId)` | CreateProductDto, UUID | Product | Auto-generate slug from title. Create variants + inventory rows in transaction. Audit log. |
| `update(id, dto, adminId)` | UUID, UpdateDto, UUID | Product | Validate category exists. Update slug if title changes (check uniqueness). Audit log with before/after. |
| `archive(id, adminId)` | UUID, UUID | void | Set `publish_status = 'archived'`. Don't delete — order history references. |

**Product Response (public):**

```typescript
class ProductCardResponse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  categorySlug: string;
  primaryImage: { url: string; alt: string };
  startingPricePaise: number;       // Lowest active variant price
  compareAtPaise: number | null;
  isAvailable: boolean;             // Any variant has available > 0
  fabric: string;
  weaveMethod: string;
}

class ProductDetailResponse {
  // All ProductCard fields plus:
  description: string;
  origin: string;
  careInstructions: string;
  blousePiece: string;
  length: string;
  width: string;
  weight: string;
  occasion: string[];
  media: MediaItem[];               // Sorted images + video
  variants: VariantResponse[];      // Each with price, color, availability
}

class VariantResponse {
  id: string;
  sku: string;
  name: string;
  color: string;
  attributes: Record<string, any>;
  pricePaise: number;
  compareAtPaise: number | null;
  available: number;                // on_hand - reserved - unavailable
  isAvailable: boolean;
}
```

**Error Cases:**

| Error | HTTP | Code |
|---|---|---|
| PRODUCT_NOT_FOUND | 404 | PROD_001 |
| SLUG_ALREADY_EXISTS | 409 | PROD_002 |
| SKU_ALREADY_EXISTS | 409 | PROD_003 |
| CATEGORY_NOT_FOUND | 400 | PROD_004 |
| COMPARE_PRICE_INVALID | 400 | PROD_005 |

---

### 2.6 Media Module

**Purpose:** Product image/video upload via signed S3 URLs.

```
modules/media/
├── media.module.ts
├── media.controller.ts
├── media.service.ts
├── s3.service.ts
└── dto/
    ├── request-upload.dto.ts
    └── confirm-upload.dto.ts
```

**Upload Flow:**

```
Admin                    API                           S3
──────                   ───                           ──
1. POST /admin/media/upload-url
   { productId, type, mimeType }
                         Validate mime (image/jpeg,
                         image/png, image/webp, video/mp4)
                         Generate object key
                         Create signed PUT URL (5min expiry)
                    <──  { uploadUrl, objectKey }

2. PUT {uploadUrl}  ─────────────────────────────────> Upload file
                                                       (max 10MB image, 50MB video)

3. POST /admin/media/confirm
   { productId, objectKey, altText }
                         Verify object exists in S3
                         Generate thumbnail (Sharp: 300px, 600px)
                         Upload thumbnails to S3
                         Insert product_media row
                    <──  { media }
```

**Service Methods:**

| Method | Rules |
|---|---|
| `requestUploadUrl(dto)` | Validate product exists + admin owns. Generate S3 signed PUT URL. Content-type restricted. Max 10MB for images. |
| `confirmUpload(dto)` | Verify S3 object exists. Generate thumbnails via Sharp. Store media record. |
| `reorder(productId, mediaIds[])` | Update `sort_order` for all media of a product. |
| `delete(mediaId, adminId)` | Delete S3 objects (original + thumbnails). Remove DB row. Audit log. |

---

### 2.7 Inventory Module

**Purpose:** Stock tracking with atomic reservations.

```
modules/inventory/
├── inventory.module.ts
├── inventory.controller.ts       # Admin only
├── inventory.service.ts
├── reservation.service.ts
├── reservation-expiry.cron.ts    # Scheduled worker
└── dto/
    ├── adjust-stock.dto.ts
    └── stock-response.dto.ts
```

**Adjust Stock DTO (admin):**

```typescript
class AdjustStockDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  adjustment: number;           // Positive = add, negative = remove

  @IsEnum(AdjustmentReason)
  reason: 'received' | 'damaged' | 'correction' | 'return_restocked' | 'other';

  @IsOptional() @IsString()
  notes?: string;
}
```

**Service Methods:**

| Method | Input | Output | Rules |
|---|---|---|---|
| `getStock(variantId)` | UUID | StockResponse | Return on_hand, reserved, unavailable, available (computed) |
| `getStockBulk(variantIds)` | UUID[] | StockResponse[] | Batch lookup for cart/catalog |
| `adjustStock(dto, adminId)` | AdjustStockDto, UUID | StockResponse | Validate: `on_hand + adjustment >= reserved + unavailable`. Update with optimistic lock (`version`). Audit log with before/after. |
| `reserve(variantId, qty, expiresAt)` | UUID, int, Date | Reservation | **Inside existing transaction.** `SELECT ... FOR UPDATE`. Check available >= qty. Increment reserved. Create reservation row. |
| `commitReservation(reservationId)` | UUID | void | Set status = 'committed'. (Stock stays reserved until fulfillment.) |
| `releaseReservation(reservationId)` | UUID | void | Decrement reserved. Set status = 'released'. |

**Reservation Expiry Cron:**

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async handleExpiredReservations() {
  // Find all reservations WHERE status = 'held' AND expires_at < NOW()
  // For each: release reservation (decrement reserved, set status = 'expired')
  // Run in individual transactions (one failure doesn't block others)
  // Log count of expired reservations
}
```

**Concurrency Control:**

```typescript
// Inside a Prisma interactive transaction:
async reserve(tx: PrismaTx, variantId: string, qty: number, expiresAt: Date) {
  // 1. Lock row
  const inv = await tx.$queryRaw`
    SELECT * FROM inventory WHERE variant_id = ${variantId} FOR UPDATE
  `;

  // 2. Check availability
  const available = inv.on_hand - inv.reserved - inv.unavailable;
  if (available < qty) {
    throw new ConflictException('INSUFFICIENT_STOCK');
  }

  // 3. Reserve
  await tx.inventory.update({
    where: { variantId },
    data: {
      reserved: { increment: qty },
      version: { increment: 1 },
    },
  });

  // 4. Create reservation record
  return tx.inventoryReservation.create({
    data: { variantId, qty, expiresAt, status: 'held' },
  });
}
```

**Error Cases:**

| Error | HTTP | Code |
|---|---|---|
| INSUFFICIENT_STOCK | 409 | INV_001 |
| STOCK_WOULD_GO_NEGATIVE | 400 | INV_002 |
| VARIANT_NOT_FOUND | 404 | INV_003 |
| RESERVATION_NOT_FOUND | 404 | INV_004 |
| RESERVATION_ALREADY_PROCESSED | 409 | INV_005 |

---

### 2.8 Cart Module

**Purpose:** Server-side cart with live pricing.

```
modules/cart/
├── cart.module.ts
├── cart.controller.ts
├── cart.service.ts
└── dto/
    ├── add-to-cart.dto.ts
    ├── update-cart-item.dto.ts
    └── cart-response.dto.ts
```

**DTOs:**

```typescript
class AddToCartDto {
  @IsUUID()
  variantId: string;

  @IsInt() @Min(1) @Max(10)
  quantity: number;
}

class UpdateCartItemDto {
  @IsInt() @Min(0) @Max(10)     // 0 = remove
  quantity: number;
}
```

**Cart Response (always server-calculated):**

```typescript
class CartResponse {
  items: CartItemResponse[];
  subtotalPaise: number;
  itemCount: number;
}

class CartItemResponse {
  id: string;                     // cart_item ID
  variant: {
    id: string;
    sku: string;
    name: string;
    color: string;
    pricePaise: number;
    available: number;
    productTitle: string;
    productSlug: string;
    imageUrl: string;
  };
  quantity: number;
  lineTotalPaise: number;         // qty × pricePaise
  isAvailable: boolean;           // available >= quantity
  availabilityWarning?: string;   // "Only 2 left" or "Out of stock"
}
```

**Service Methods:**

| Method | Rules |
|---|---|
| `getCart(userId)` | Join cart_items → product_variants → inventory → product_media. Recalculate all prices from current variant price. Flag unavailable items. |
| `addItem(userId, dto)` | Check variant exists + active + published product. If already in cart, increment qty. Max 10 per variant. |
| `updateItem(userId, itemId, dto)` | Ownership check. Qty=0 removes item. Validate variant still active. |
| `removeItem(userId, itemId)` | Ownership check. Delete cart_item row. |
| `clearCart(userId)` | Delete all cart_items for user. Called after successful order placement. |

**Important:** Cart stores NO prices. Every read joins with current `product_variants.price_paise`. Client-side totals are for display only — server recalculates at checkout.

**Error Cases:**

| Error | HTTP | Code |
|---|---|---|
| VARIANT_NOT_FOUND | 404 | CART_001 |
| VARIANT_UNAVAILABLE | 400 | CART_002 |
| QUANTITY_EXCEEDS_LIMIT | 400 | CART_003 |
| CART_ITEM_NOT_FOUND | 404 | CART_004 |

---

### 2.9 Checkout Module

**Purpose:** Quote generation + atomic order placement.

```
modules/checkout/
├── checkout.module.ts
├── checkout.controller.ts
├── checkout.service.ts
└── dto/
    ├── checkout-quote.dto.ts
    ├── place-order.dto.ts
    ├── quote-response.dto.ts
    └── order-response.dto.ts
```

**Checkout Quote DTO:**

```typescript
class CheckoutQuoteDto {
  @IsUUID()
  addressId: string;

  @IsEnum(PaymentMode)
  paymentMode: 'upi' | 'cod';
}
```

**Place Order DTO:**

```typescript
class PlaceOrderDto {
  @IsUUID()
  addressId: string;

  @IsEnum(PaymentMode)
  paymentMode: 'upi' | 'cod';

  @IsString() @MaxLength(100)
  idempotencyKey: string;          // Client-generated UUID

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;                  // Delivery instructions
}
```

**Quote Response:**

```typescript
class QuoteResponse {
  items: QuoteItem[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMode: string;
  codAvailable: boolean;
  estimatedDelivery: string | null;
  warnings: string[];              // "Item X has only 2 left", etc.
}
```

**Service Methods:**

| Method | Rules |
|---|---|
| `getQuote(userId, dto)` | Fetch cart + address. Validate all items available. Calculate shipping (flat rate for pilot). Calculate tax (if applicable). Check COD eligibility by PIN code. Return server-calculated totals. Do NOT reserve stock yet. |
| `placeOrder(userId, dto)` | **Single Prisma interactive transaction:** 1) Check idempotency key uniqueness (return existing order if duplicate). 2) Fetch cart items + current prices. 3) Validate all variants active + in stock. 4) Reserve inventory for each item (FOR UPDATE). 5) Create order + order_items with price snapshots. 6) Snapshot address as JSONB. 7) Clear cart. 8) COMMIT. If any step fails → ROLLBACK (releases all locks). |

**Order Placement Transaction (pseudocode):**

```typescript
async placeOrder(userId: string, dto: PlaceOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Idempotency check
    const existing = await tx.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) return existing;  // Return same order

    // 2. Fetch cart with current prices
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { variant: { include: { product: true, inventory: true } } },
    });
    if (cartItems.length === 0) throw new BadRequestException('CART_EMPTY');

    // 3. Validate + reserve each item
    const reservations = [];
    for (const item of cartItems) {
      if (!item.variant.active || item.variant.product.publishStatus !== 'published') {
        throw new BadRequestException(`VARIANT_UNAVAILABLE: ${item.variant.sku}`);
      }
      const reservation = await this.inventoryService.reserve(
        tx, item.variantId, item.quantity,
        dto.paymentMode === 'upi'
          ? addMinutes(new Date(), 30)    // 30 min for UPI
          : addMinutes(new Date(), 1440), // 24 hours for COD
      );
      reservations.push(reservation);
    }

    // 4. Calculate totals (server-side, never trust client)
    const subtotal = cartItems.reduce(
      (sum, i) => sum + i.variant.pricePaise * i.quantity, 0
    );
    const shipping = this.calculateShipping(address.pinCode);
    const tax = this.calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    // 5. Create order
    const order = await tx.order.create({
      data: {
        publicNumber: generateOrderNumber(),
        userId,
        status: 'placed',
        paymentMode: dto.paymentMode,
        paymentStatus: dto.paymentMode === 'cod' ? 'cod_pending' : 'pending',
        subtotalPaise: subtotal,
        shippingPaise: shipping,
        taxPaise: tax,
        totalPaise: total,
        addressSnapshot: address,
        idempotencyKey: dto.idempotencyKey,
        notes: dto.notes,
      },
    });

    // 6. Create order items (snapshot prices)
    await tx.orderItem.createMany({
      data: cartItems.map((item) => ({
        orderId: order.id,
        variantId: item.variantId,
        productTitle: item.variant.product.title,
        variantName: item.variant.name,
        sku: item.variant.sku,
        qty: item.quantity,
        unitPricePaise: item.variant.pricePaise,
        taxPaise: 0,  // Per-item tax if needed
        totalPaise: item.variant.pricePaise * item.quantity,
        productImageUrl: primaryImageUrl,
      })),
    });

    // 7. Link reservations to order
    await tx.inventoryReservation.updateMany({
      where: { id: { in: reservations.map(r => r.id) } },
      data: { orderId: order.id },
    });

    // 8. Clear cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  }, {
    isolationLevel: 'ReadCommitted',
    timeout: 10000,  // 10s max transaction
  });
}
```

**Error Cases:**

| Error | HTTP | Code | Recovery |
|---|---|---|---|
| CART_EMPTY | 400 | CHK_001 | — |
| VARIANT_UNAVAILABLE | 400 | CHK_002 | Remove from cart |
| INSUFFICIENT_STOCK | 409 | CHK_003 | Reduce quantity |
| ADDRESS_NOT_FOUND | 404 | CHK_004 | Select different address |
| PIN_NOT_SERVICEABLE | 400 | CHK_005 | Change address |
| COD_NOT_AVAILABLE | 400 | CHK_006 | Use UPI |
| DUPLICATE_ORDER | 200 | — | Return existing order |

---

### 2.10 Orders Module

**Purpose:** Order lifecycle management for customers and admins.

```
modules/orders/
├── orders.module.ts
├── orders.controller.ts          # Customer endpoints
├── orders-admin.controller.ts    # Admin endpoints
├── orders.service.ts
├── order-state-machine.ts        # State transition rules
└── dto/
    ├── order-query.dto.ts
    ├── update-order-status.dto.ts
    ├── cancel-order.dto.ts
    └── order-response.dto.ts
```

**State Machine:**

```typescript
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed:           ['confirmed', 'cancelled'],
  confirmed:        ['packed', 'cancelled'],
  packed:           ['shipped'],
  shipped:          ['delivered'],
  delivered:        ['return_requested'],
  cancelled:        [],
  return_requested: ['return_approved', 'return_rejected'],
  return_approved:  ['returned'],
  return_rejected:  [],
  returned:         ['refund_pending'],
  refund_pending:   ['refunded'],
  refunded:         [],
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Side Effects per Transition:**

| Transition | Side Effects |
|---|---|
| placed → confirmed | For COD: mark as manually verified. For UPI: auto on payment success. |
| placed → cancelled | Release inventory reservations. If payment exists, initiate refund. |
| confirmed → cancelled | Release inventory reservations. Initiate refund if paid. |
| confirmed → packed | Record packed_at timestamp. |
| packed → shipped | Record shipped_at. Create/update shipment record. Notify customer (WhatsApp). |
| shipped → delivered | Record delivered_at. Update shipment. For COD: payment_status stays 'cod_pending' until remittance. |
| delivered → return_requested | Validate within return window (7 days). |
| return_approved → returned | Restock inventory (on_hand += qty). |
| returned → refund_pending | Trigger refund creation. |
| refund_pending → refunded | Refund processed by gateway. Update payment_status. |

**Customer Endpoints:**

| Method | Path | Rules |
|---|---|---|
| GET | /orders | Own orders only, paginated by created_at desc |
| GET | /orders/:id | Own order only, include items + shipment + payments |
| POST | /orders/:id/cancel | Only if status in [placed, confirmed]. Record reason. |
| POST | /orders/:id/return | Only if delivered and within 7 days. Specify item + reason. |

**Admin Endpoints:**

| Method | Path | Rules |
|---|---|---|
| GET | /admin/orders | Search by public_number, phone, status, date range |
| PATCH | /admin/orders/:id/status | Validate transition. Execute side effects. Audit log. |

---

### 2.11 Payments Module

**Purpose:** Payment gateway integration, webhook processing, reconciliation, refunds.

```
modules/payments/
├── payments.module.ts
├── payments.controller.ts
├── payments.service.ts
├── webhook.controller.ts
├── reconciliation.cron.ts          # Periodic payment status check
├── gateway/
│   ├── payment-gateway.interface.ts
│   ├── razorpay.gateway.ts
│   └── mock.gateway.ts             # Dev/test
└── dto/
    ├── initiate-payment.dto.ts
    └── payment-response.dto.ts
```

**Gateway Interface:**

```typescript
interface PaymentGateway {
  // Creates a gateway order/session — returns checkout URL or SDK options
  createOrder(amount: number, currency: string, orderId: string): Promise<GatewayOrder>;

  // Verifies webhook signature — MUST be gateway-specific (Razorpay HMAC-SHA256 ≠ Cashfree)
  verifyWebhookSignature(rawBody: string, signature: string): boolean;

  // Server-side verification — query gateway API for definitive payment status
  // NEVER trust client-side success callback alone
  getPaymentStatus(providerOrderId: string): Promise<GatewayPaymentStatus>;

  // Initiate refund via gateway
  initiateRefund(providerPaymentId: string, amount: number): Promise<RefundResult>;
}

// Gateway-specific implementations (NOT a shared generic verifier)
// razorpay.gateway.ts → uses crypto.createHmac('sha256', secret)
// cashfree.gateway.ts → uses different signature scheme
```

**Key Distinction — Public vs Secret Keys:**

```typescript
// SECRET keys — backend only (env vars, never exposed)
RAZORPAY_KEY_SECRET=<secret>        // For webhook verification + API calls
RAZORPAY_WEBHOOK_SECRET=<secret>    // For webhook signature verification

// PUBLIC/PUBLISHABLE key — safe for mobile SDK
RAZORPAY_KEY_ID=<publishable>       // Passed to mobile app for checkout SDK
```

The mobile app receives only the publishable key + gateway order ID to open the checkout UI. All verification happens server-side.

**Payment Attempt Model:**

Each payment attempt is a separate row. An order can have multiple attempts (customer retries). Only one can succeed.

```typescript
// WRONG: Reuse failed payment row
payment.status = 'failed' → payment.status = 'pending'  // DON'T DO THIS

// RIGHT: Create new attempt
Payment #1: { orderId, status: 'failed', ... }
Payment #2: { orderId, status: 'pending', ... }  // New row for retry
```

**Payment State Machine (per attempt):**

```
  pending ──→ initiated ──→ authorized ──→ captured (success)
    │              │              │
    │              │              └──→ capture_failed
    │              │
    │              └──→ failed
    │
    └──→ expired

Note: "authorized" ≠ "captured" for Razorpay.
      authorized = funds held on customer's account
      captured = funds transferred to merchant
      Only transition order to confirmed on CAPTURE, not authorize.
```

**Payment Flow (Revised):**

```
Customer                    API                         Gateway
────────                    ───                         ───────
POST /payments/:orderId/initiate
                            Validate order.status = 'placed'
                            Validate payment_mode = 'upi'
                            Validate no active payment attempt (pending/initiated)
                            Create new Payment row (status: 'pending')
                            Call gateway.createOrder(total, 'INR', orderId)
                            Update payment (status: 'initiated',
                              providerOrderId: gatewayOrderId)
                       <──  { gatewayOrderId, publishableKey, checkoutOptions }

[Customer completes payment on gateway checkout UI]

[Mobile client receives success callback]
                            ⚠️ DO NOT fulfill based on this callback alone
                            Wait for server-side webhook verification

                            POST /webhooks/payments
                            ├── Verify signature (gateway-specific HMAC)
                            ├── Check webhook_events for duplicate
                            │   UNIQUE (provider, provider_event_id)
                            ├── Store webhook event (status: 'received')
                            │
                            ├── In database transaction:
                            │   ├── Lock payment row (SELECT FOR UPDATE)
                            │   ├── Verify payment not already processed
                            │   ├── Verify amount matches order.total_paise
                            │   ├── Verify gateway order ID matches
                            │   │
                            │   ├── If payment.captured:
                            │   │   ├── Update payment status = 'captured'
                            │   │   ├── Update order payment_status = 'success'
                            │   │   ├── Transition order: placed → confirmed
                            │   │   ├── Commit inventory reservations
                            │   │   └── Mark webhook event 'processed'
                            │   │
                            │   ├── If payment.authorized (not yet captured):
                            │   │   ├── Update payment status = 'authorized'
                            │   │   ├── Auto-capture if enabled, OR
                            │   │   └── Wait for capture webhook
                            │   │
                            │   └── If payment.failed:
                            │       ├── Update payment status = 'failed'
                            │       ├── DO NOT release inventory yet
                            │       │   (customer may retry with new attempt)
                            │       └── Mark webhook event 'processed'
                            │
                            └── Return { status: 'ok' }
```

**Stock Release Rules (Revised):**

```
Payment failed?
  └── DON'T release stock immediately
  └── Stock is still reserved for the ORDER, not the payment attempt
  └── Customer may retry payment

When to release stock:
  1. Order explicitly cancelled (by customer or admin)
  2. Order expired (no successful payment within reservation window)
     → Handled by reservation-expiry.cron.ts (already built)
  3. All payment attempts exhausted AND order past expiry

Key principle: Inventory is reserved at ORDER level, not PAYMENT ATTEMPT level.
```

**Webhook Security (Revised):**

```typescript
@Post('webhooks/payments')
@HttpCode(200)  // Always return 200 to prevent gateway retries on our errors
async handleWebhook(
  @Req() req: RawBodyRequest,
  @Headers('x-razorpay-signature') signature: string,
) {
  // 1. Verify signature (gateway-specific, NOT generic)
  // NestJS must be configured with rawBody: true in bootstrap
  const isValid = this.gateway.verifyWebhookSignature(
    req.rawBody.toString(), signature
  );
  if (!isValid) {
    this.logger.warn('Invalid webhook signature received');
    throw new UnauthorizedException('INVALID_SIGNATURE');
  }

  // 2. Parse and deduplicate
  const event = JSON.parse(req.rawBody.toString());
  const eventId = event.event_id || event.id;

  const existing = await this.prisma.webhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: 'razorpay',
        providerEventId: eventId,
      },
    },
  });
  if (existing) return { status: 'already_processed' };

  // 3. Store webhook event BEFORE processing (crash recovery)
  await this.prisma.webhookEvent.create({
    data: {
      provider: 'razorpay',
      providerEventId: eventId,
      eventType: event.event,
      payload: event,
      status: 'received',
    },
  });

  // 4. Process in transaction (atomic order + payment + inventory update)
  try {
    await this.prisma.$transaction(async (tx) => {
      await this.processPaymentEvent(tx, event);
    });

    // 5. Mark processed
    await this.prisma.webhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: 'razorpay',
          providerEventId: eventId,
        },
      },
      data: { status: 'processed', processedAt: new Date() },
    });
  } catch (error) {
    // Mark failed but still return 200 to prevent infinite retries
    await this.prisma.webhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: 'razorpay',
          providerEventId: eventId,
        },
      },
      data: { status: 'failed' },
    });
    this.logger.error(`Webhook processing failed: ${error.message}`);
  }

  return { status: 'ok' };
}
```

**Payment Reconciliation Cron (NEW):**

Webhooks are reliable but not guaranteed. A reconciliation job catches missed events.

```typescript
@Cron('*/10 * * * *')  // Every 10 minutes
async reconcilePayments() {
  // 1. Find orders with unresolved payments
  //    (status: 'initiated' or 'authorized', created > 10 min ago)
  const unresolvedPayments = await this.prisma.payment.findMany({
    where: {
      status: { in: ['initiated', 'authorized'] },
      createdAt: { lt: subMinutes(new Date(), 10) },
    },
    include: { order: true },
  });

  for (const payment of unresolvedPayments) {
    try {
      // 2. Query gateway API for definitive status
      const gatewayStatus = await this.gateway.getPaymentStatus(
        payment.providerOrderId,
      );

      // 3. If captured → process as if webhook arrived
      if (gatewayStatus.status === 'captured') {
        await this.prisma.$transaction(async (tx) => {
          // Verify not already processed (idempotent)
          const current = await tx.payment.findUnique({
            where: { id: payment.id },
          });
          if (current.status === 'captured') return; // Already done

          // Same logic as webhook handler
          await this.confirmPayment(tx, payment, gatewayStatus);
        });
        this.logger.log(`Reconciled payment ${payment.id} → captured`);
      }

      // 4. If failed/expired → mark failed
      if (['failed', 'expired'].includes(gatewayStatus.status)) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });
        this.logger.log(`Reconciled payment ${payment.id} → failed`);
      }

      // 5. If still pending on gateway → skip (will check next cycle)
    } catch (error) {
      this.logger.error(`Reconciliation failed for ${payment.id}: ${error.message}`);
    }
  }
}
```

**Scenarios the reconciliation cron handles:**

| Scenario | Without Reconciliation | With Reconciliation |
|---|---|---|
| Backend down when webhook arrives | Order stuck as "pending" forever | Resolved within 10 minutes |
| Customer closes app during payment | No webhook processed | Gateway queried, order updated |
| Webhook delivery fails (network) | Gateway retries, but may give up | Cron catches it independently |
| Race condition: webhook + client callback | Possible double processing | Idempotent — safe either way |

**Payment Initiation Idempotency:**

```typescript
class InitiatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsString() @MaxLength(100)
  idempotencyKey: string;     // Client-generated, prevents duplicate initiations
}

// Service checks:
// 1. No existing ACTIVE payment attempt (pending/initiated/authorized) for this order
// 2. No existing payment with same idempotencyKey
// If duplicate key found → return existing payment (don't create new)
```

**Additional Database Constraints:**

```sql
-- Prevent duplicate webhook events per provider
CREATE UNIQUE INDEX idx_webhook_events_provider_event
  ON webhook_events (provider, provider_event_id);

-- Prevent duplicate gateway payment records
CREATE UNIQUE INDEX idx_payments_provider_payment
  ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- Prevent duplicate gateway order records
CREATE UNIQUE INDEX idx_payments_provider_order
  ON payments (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

-- Ensure only one successful payment per order
CREATE UNIQUE INDEX idx_payments_order_success
  ON payments (order_id)
  WHERE status = 'captured';
```

**Order Confirmation Safety Rule:**

```
⚠️ CRITICAL: Never fulfill an order based on:
  - Mobile SDK success callback
  - Client-side redirect URL
  - Customer claiming they paid

ONLY confirm an order when:
  - Webhook with valid signature confirms payment.captured
  - OR reconciliation cron verifies captured status via gateway API
  - AND amount matches order.total_paise
  - AND gateway order ID matches our payment record
```

**Refund Flow:**

```typescript
async initiateRefund(orderId: string, adminId: string, amount?: number) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    const payment = await tx.payment.findFirst({
      where: { orderId, status: 'captured' },  // Only captured, not just 'success'
    });

    if (!payment) throw new BadRequestException('NO_SUCCESSFUL_PAYMENT');

    const refundAmount = amount ?? payment.amountPaise;

    // Check total refunds don't exceed payment
    const existingRefunds = await tx.refund.aggregate({
      where: { paymentId: payment.id, status: { not: 'failed' } },
      _sum: { amountPaise: true },
    });
    const totalRefunded = existingRefunds._sum.amountPaise ?? 0;

    if (totalRefunded + refundAmount > payment.amountPaise) {
      throw new BadRequestException('REFUND_EXCEEDS_PAYMENT');
    }

    // Call gateway
    const result = await this.gateway.initiateRefund(
      payment.providerPaymentId!, refundAmount,
    );

    // Record refund
    await tx.refund.create({
      data: {
        orderId,
        paymentId: payment.id,
        gatewayRefundId: result.refundId,
        amountPaise: refundAmount,
        status: 'processing',
        initiatedBy: adminId,
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'refund_pending' },
    });

    // Audit log
    await tx.auditEvent.create({
      data: {
        action: 'refund.initiated',
        entityType: 'order',
        entityId: orderId,
        actorType: 'admin',
        actorId: adminId,
        afterState: { refundAmount, gatewayRefundId: result.refundId } as any,
      },
    });
  });
}
```

**Error Cases:**

| Error | HTTP | Code |
|---|---|---|
| ORDER_NOT_FOUND | 404 | PAY_001 |
| INVALID_ORDER_STATUS | 400 | PAY_002 |
| ACTIVE_PAYMENT_EXISTS | 409 | PAY_003 |
| INVALID_WEBHOOK_SIGNATURE | 401 | PAY_004 |
| AMOUNT_MISMATCH | 400 | PAY_005 |
| DUPLICATE_WEBHOOK | 200 | — (idempotent OK) |
| NO_SUCCESSFUL_PAYMENT | 400 | PAY_006 |
| REFUND_EXCEEDS_PAYMENT | 400 | PAY_007 |
| GATEWAY_ERROR | 502 | PAY_008 |
| DUPLICATE_PAYMENT_INITIATION | 200 | — (return existing) |
| PAYMENT_EXPIRED | 400 | PAY_009 |

---

### 2.12 Admin Module

**Purpose:** Admin authentication, RBAC, audit logging, reports.

```
modules/admin/
├── admin.module.ts
├── admin.controller.ts
├── admin.service.ts
├── audit.service.ts
├── reports.service.ts
└── dto/
    ├── create-admin.dto.ts
    ├── report-query.dto.ts
    └── audit-query.dto.ts
```

**RBAC Roles & Permissions:**

| Role | Catalog | Inventory | Orders | Reports | Admin Users |
|---|---|---|---|---|---|
| owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| catalog_editor | ✅ | Read | Read | ❌ | ❌ |
| fulfillment_operator | Read | ✅ | ✅ | Limited | ❌ |
| support | Read | Read | Read + notes | ❌ | ❌ |

**RBAC Guard:**

```typescript
@Injectable()
class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<AdminRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const user = context.switchToHttp().getRequest().user;
    if (user.type !== 'admin') return false;

    return requiredRoles.includes(user.role);
  }
}

// Usage:
@Roles('owner', 'catalog_editor')
@Post('admin/products')
createProduct() { ... }
```

**Audit Service:**

```typescript
async log(params: {
  actorType: 'admin' | 'system' | 'customer';
  actorId: string | null;
  action: string;           // 'product.created', 'inventory.adjusted'
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  metadata?: any;
}) {
  await this.prisma.auditEvent.create({ data: params });
}
```

**Pilot Reports:**

| Report | Query |
|---|---|
| Orders summary | Count + GMV by status, date range |
| COD pending | Orders with payment_status = 'cod_pending' and status = 'delivered' |
| Refunds | Total refunded, pending, by date |
| Stock summary | All variants with on_hand, reserved, available, low-stock flag |
| Top products | Order items grouped by product, sorted by qty desc |

---

## 3. State Transition Diagrams

### 3.1 Order + Payment Combined State

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORDER PLACEMENT                              │
│                                                                     │
│  Cart ──> POST /orders ──> [Reserve Stock] ──> Order: PLACED       │
│                                                                     │
│  ┌── UPI Path ──────────────────┐  ┌── COD Path ─────────────────┐ │
│  │                              │  │                              │ │
│  │ POST /payments/initiate      │  │ Order: PLACED               │ │
│  │ Payment: INITIATED           │  │ Payment: COD_PENDING        │ │
│  │     │                        │  │     │                        │ │
│  │     ├── Gateway Success      │  │     │ Admin confirms         │ │
│  │     │   Payment: SUCCESS     │  │     ▼                        │ │
│  │     │   Order: CONFIRMED     │  │ Order: CONFIRMED             │ │
│  │     │   Reservation: COMMIT  │  │ Reservation: COMMITTED      │ │
│  │     │                        │  │                              │ │
│  │     └── Gateway Failed       │  │                              │ │
│  │         Payment: FAILED      │  │                              │ │
│  │         Order: CANCELLED     │  │                              │ │
│  │         Reservation: RELEASE │  │                              │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        FULFILLMENT                                  │
│                                                                     │
│  CONFIRMED ──> Admin packs ──> PACKED                               │
│       │                          │                                   │
│       │                     Admin ships (tracking ID)                │
│       │                          │                                   │
│       │                        SHIPPED ──> Courier delivers          │
│       │                                        │                     │
│       │                                    DELIVERED                  │
│       │                                        │                     │
│       ▼                                   [Within 7 days]            │
│   CANCELLED                                    │                     │
│   (release stock,                         RETURN_REQUESTED           │
│    refund if paid)                         ┌────┴────┐               │
│                                            ▼         ▼               │
│                                     RETURN_APPROVED  RETURN_REJECTED │
│                                            │                         │
│                                            ▼                         │
│                                        RETURNED                      │
│                                     (restock inventory)              │
│                                            │                         │
│                                            ▼                         │
│                                      REFUND_PENDING                  │
│                                     (gateway refund)                 │
│                                            │                         │
│                                            ▼                         │
│                                         REFUNDED                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Inventory Reservation Lifecycle

```
                    ┌───────────┐
   Checkout ──────> │   HELD    │ <── reservation created
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         Payment OK   Payment Fail  Timer expires
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │COMMITTED │ │ RELEASED │ │ EXPIRED  │
        │          │ │          │ │          │
        │reserved  │ │reserved  │ │reserved  │
        │stays     │ │decrements│ │decrements│
        └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Error Handling Strategy

### 4.1 Standard Error Response

```typescript
{
  success: false,
  error: {
    code: "INV_001",                    // Machine-readable
    message: "Insufficient stock",       // Human-readable
    details: {                           // Optional context
      variantId: "uuid",
      requested: 3,
      available: 1
    }
  },
  requestId: "req_abc123"              // For support/debugging
}
```

### 4.2 HTTP Status Usage

| Status | Usage |
|---|---|
| 200 | Success, or idempotent duplicate (return existing resource) |
| 201 | Resource created |
| 400 | Validation error, business rule violation |
| 401 | Not authenticated, invalid/expired token |
| 403 | Authenticated but not authorized (wrong role, not owner) |
| 404 | Resource not found or not owned by requester |
| 409 | Conflict (stock unavailable, duplicate SKU, invalid state transition) |
| 429 | Rate limited (OTP, API) |
| 500 | Unexpected server error (log, alert, never expose internals) |
| 502 | External service error (gateway, OTP provider) |

### 4.3 Global Exception Filter

```typescript
@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.headers['x-request-id'] || uuid();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = body.code || `HTTP_${status}`;
      message = body.message || exception.message;
      details = body.details;
    }

    // Log full error (never expose stack to client)
    this.logger.error({
      requestId,
      status,
      code,
      message,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      success: false,
      error: { code, message, details },
      requestId,
    });
  }
}
```

### 4.4 Validation Error Format

```typescript
// Input: POST /orders with missing fields
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [
      { field: "addressId", message: "addressId must be a UUID" },
      { field: "idempotencyKey", message: "idempotencyKey should not be empty" }
    ]
  },
  requestId: "req_xyz789"
}
```

---

## 5. Cross-Cutting Concerns

### 5.1 Request Logging

```typescript
// Every request logs:
{
  requestId: "req_abc123",
  method: "POST",
  path: "/api/v1/orders",
  userId: "user-uuid",       // From JWT
  userType: "customer",
  statusCode: 201,
  durationMs: 145,
  timestamp: "2026-11-13T10:30:00Z"
}
```

### 5.2 Response Envelope

```typescript
// Success:
{ success: true, data: { ... }, requestId: "req_abc123" }

// Paginated:
{ success: true, data: { items: [...], cursor: "abc", hasMore: true }, requestId: "req_abc123" }

// Error:
{ success: false, error: { code, message, details }, requestId: "req_abc123" }
```

### 5.3 Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| POST /auth/otp/request | 3 per phone | 10 minutes |
| POST /auth/otp/request | 10 per IP | 1 hour |
| POST /auth/otp/verify | 5 attempts per OTP | Until expiry |
| All authenticated APIs | 100 requests | 1 minute per user |
| All public APIs | 30 requests | 1 minute per IP |

### 5.4 Idempotency

| Endpoint | Key | Behavior |
|---|---|---|
| POST /orders | `idempotencyKey` in body | Return existing order if key exists |
| POST /webhooks/payments | `provider_event_id` | Skip if already processed |
| POST /payments/initiate | One active payment per order | Return existing if pending |

---

## 6. Module Dependency Graph

```
                    AppModule
                       │
          ┌────────────┼────────────────┐
          │            │                │
      ConfigModule  PrismaModule   CommonModule
          │            │            (guards, filters,
          │            │             interceptors)
          │            │
    ┌─────┴────────────┴─────────────────────────┐
    │                                             │
    │              Feature Modules                │
    │                                             │
    │  AuthModule ──────────> UsersModule          │
    │       │                     │               │
    │       │              AddressesModule         │
    │       │                                     │
    │  CategoriesModule                           │
    │       │                                     │
    │  ProductsModule ──────> CategoriesModule     │
    │       │                                     │
    │  MediaModule ─────────> ProductsModule       │
    │                                             │
    │  InventoryModule ─────> ProductsModule       │
    │       │                                     │
    │  CartModule ──────────> InventoryModule      │
    │       │                 ProductsModule       │
    │       │                                     │
    │  CheckoutModule ──────> CartModule           │
    │       │                 InventoryModule      │
    │       │                 AddressesModule      │
    │       │                 OrdersModule         │
    │       │                                     │
    │  OrdersModule ────────> InventoryModule      │
    │       │                 PaymentsModule       │
    │       │                                     │
    │  PaymentsModule ──────> OrdersModule         │
    │       │                 InventoryModule      │
    │       │                                     │
    │  AdminModule ─────────> All modules (read)   │
    │                         AuditService         │
    └─────────────────────────────────────────────┘
```

Note: Circular dependencies between Orders ↔ Payments resolved using `forwardRef()` or by extracting shared logic into a separate service.

---

## 6. Mobile App Screen Architecture

**Total: 21 screens** organized into 5 groups.

### 6.1 Onboarding & System States

| Screen | Component | Notes |
|---|---|---|
| Splash | `SplashScreen` | Logo + auto-transition, no user interaction |
| Welcome | `WelcomeScreen` | 2-3 swipeable pages, skip link, shown only on first launch (AsyncStorage flag) |
| No Internet | `NoInternetScreen` | Shown when network unavailable, retry button re-checks connectivity |
| App Update Required | `ForceUpdateScreen` | Non-dismissable, compare app version vs minimum from API/remote config |
| Maintenance | `MaintenanceScreen` | Shown when API returns 503, informational only |

### 6.2 Authentication

| Screen | Component | Route | Notes |
|---|---|---|---|
| Phone Input | `LoginPhoneScreen` | Profile tab (unauthenticated) | +91 prefix, validates 10-digit Indian mobile |
| OTP Verify | `LoginOtpScreen` | After phone submit | 6-digit input, 30s resend cooldown, max 5 attempts |
| Name Capture | `NameCaptureScreen` | After first OTP verify | Shown when `isNewUser=true` or `name=null`, skip option |

### 6.3 Core Shopping Flow

| Screen | Component | Route | Data Source |
|---|---|---|---|
| Home | `HomeScreen` | Tab: Home | `GET /products` (new arrivals), static collections |
| Explore | `ExploreScreen` | Tab: Explore | `GET /products` + `GET /categories` |
| Product Detail | `ProductDetailScreen` | Stack: Explore → Detail | `GET /products/:slug` |
| Cart | `CartScreen` | Tab: Cart | `GET /cart` (authenticated) |
| Select Address | `SelectAddressScreen` | Stack: Cart → Checkout | `GET /me/addresses` |
| Add Address | `AddAddressScreen` | Stack: Checkout → Add | `POST /me/addresses` |
| Order Review | `OrderReviewScreen` | Stack: Checkout → Review | `POST /checkout/quote` |
| Order Success | `OrderSuccessScreen` | Stack: after place order | `POST /checkout/place` response |

### 6.4 Post-Purchase

| Screen | Component | Route | Data Source |
|---|---|---|---|
| Orders List | `OrdersScreen` | Tab: Orders | `GET /orders` (authenticated) |
| Order Detail | `OrderDetailScreen` | Stack: Orders → Detail | `GET /orders/:id` |

### 6.5 Profile & Addresses

| Screen | Component | Route | Data Source |
|---|---|---|---|
| Profile | `ProfileScreen` | Tab: Profile | `GET /me` |
| My Addresses | `AddressesScreen` | Stack: Profile → Addresses | `GET /me/addresses` |
| Search Results | `SearchScreen` | Stack: Explore → Search | `GET /products?search=` |

### 6.6 Navigation Structure

```
TabNavigator (5 tabs)
├── Home (HomeScreen)
├── Explore (ExploreStackNavigator)
│   ├── ExploreList (ExploreScreen)
│   ├── ProductDetail (ProductDetailScreen)
│   └── Search (SearchScreen)
├── Cart (CartStackNavigator)
│   ├── CartView (CartScreen)
│   ├── SelectAddress (SelectAddressScreen)
│   ├── AddAddress (AddAddressScreen)
│   ├── OrderReview (OrderReviewScreen)
│   └── OrderSuccess (OrderSuccessScreen)
├── Orders (OrdersStackNavigator)
│   ├── OrdersList (OrdersScreen)
│   └── OrderDetail (OrderDetailScreen)
└── Profile (ProfileStackNavigator)
    ├── ProfileView (ProfileScreen)
    ├── Addresses (AddressesScreen)
    └── AddAddress (AddAddressScreen)
```

### 6.7 System Screen Triggers

| Screen | Trigger |
|---|---|
| Splash | App cold start, shown for 1-2s |
| Welcome | First launch only (`@sajani/onboarded` not in AsyncStorage) |
| No Internet | `NetInfo` listener detects offline state |
| Force Update | API response header `X-Min-App-Version` > current app version |
| Maintenance | API returns HTTP 503 with `maintenance: true` |
