// ── Order Status ──
export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  RETURNED = 'returned',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
}

// ── Payment Status ──
export enum PaymentStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  COD_PENDING = 'cod_pending',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
}

// ── Payment Mode ──
export enum PaymentMode {
  UPI = 'upi',
  COD = 'cod',
}

// ── Shipment Status ──
export enum ShipmentStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RTO = 'rto',
}

// ── Reservation Status ──
export enum ReservationStatus {
  HELD = 'held',
  COMMITTED = 'committed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

// ── Publish Status ──
export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ── Admin Roles ──
export enum AdminRole {
  OWNER = 'owner',
  CATALOG_EDITOR = 'catalog_editor',
  FULFILLMENT_OPERATOR = 'fulfillment_operator',
  SUPPORT = 'support',
}

// ── User Status ──
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// ── Return Reason ──
export enum ReturnReason {
  DAMAGED = 'damaged',
  WRONG_PRODUCT = 'wrong_product',
  NOT_AS_DESCRIBED = 'not_as_described',
  OTHER = 'other',
}

// ── Return Status ──
export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RECEIVED = 'received',
  COMPLETED = 'completed',
}

// ── Refund Status ──
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// ── Stock Adjustment Reason ──
export enum AdjustmentReason {
  RECEIVED = 'received',
  DAMAGED = 'damaged',
  CORRECTION = 'correction',
  RETURN_RESTOCKED = 'return_restocked',
  OTHER = 'other',
}

// ── Media Type ──
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

// ── Product Sort ──
export enum ProductSortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RELEVANCE = 'relevance',
}
