export declare enum OrderStatus {
    PLACED = "placed",
    CONFIRMED = "confirmed",
    PACKED = "packed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    RETURN_REQUESTED = "return_requested",
    RETURN_APPROVED = "return_approved",
    RETURN_REJECTED = "return_rejected",
    RETURNED = "returned",
    REFUND_PENDING = "refund_pending",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    INITIATED = "initiated",
    SUCCESS = "success",
    FAILED = "failed",
    EXPIRED = "expired",
    COD_PENDING = "cod_pending",
    REFUND_PENDING = "refund_pending",
    REFUNDED = "refunded"
}
export declare enum PaymentMode {
    UPI = "upi",
    COD = "cod"
}
export declare enum ShipmentStatus {
    PENDING = "pending",
    DISPATCHED = "dispatched",
    IN_TRANSIT = "in_transit",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    RTO = "rto"
}
export declare enum ReservationStatus {
    HELD = "held",
    COMMITTED = "committed",
    RELEASED = "released",
    EXPIRED = "expired"
}
export declare enum PublishStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export declare enum AdminRole {
    OWNER = "owner",
    CATALOG_EDITOR = "catalog_editor",
    FULFILLMENT_OPERATOR = "fulfillment_operator",
    SUPPORT = "support"
}
export declare enum UserStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended"
}
export declare enum ReturnReason {
    DAMAGED = "damaged",
    WRONG_PRODUCT = "wrong_product",
    NOT_AS_DESCRIBED = "not_as_described",
    OTHER = "other"
}
export declare enum ReturnStatus {
    REQUESTED = "requested",
    APPROVED = "approved",
    REJECTED = "rejected",
    RECEIVED = "received",
    COMPLETED = "completed"
}
export declare enum RefundStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare enum AdjustmentReason {
    RECEIVED = "received",
    DAMAGED = "damaged",
    CORRECTION = "correction",
    RETURN_RESTOCKED = "return_restocked",
    OTHER = "other"
}
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum ProductSortBy {
    NEWEST = "newest",
    PRICE_ASC = "price_asc",
    PRICE_DESC = "price_desc",
    RELEVANCE = "relevance"
}
//# sourceMappingURL=index.d.ts.map