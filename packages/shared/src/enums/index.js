"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSortBy = exports.MediaType = exports.AdjustmentReason = exports.RefundStatus = exports.ReturnStatus = exports.ReturnReason = exports.UserStatus = exports.AdminRole = exports.PublishStatus = exports.ReservationStatus = exports.ShipmentStatus = exports.PaymentMode = exports.PaymentStatus = exports.OrderStatus = void 0;
// ── Order Status ──
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PLACED"] = "placed";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PACKED"] = "packed";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["RETURN_REQUESTED"] = "return_requested";
    OrderStatus["RETURN_APPROVED"] = "return_approved";
    OrderStatus["RETURN_REJECTED"] = "return_rejected";
    OrderStatus["RETURNED"] = "returned";
    OrderStatus["REFUND_PENDING"] = "refund_pending";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// ── Payment Status ──
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["INITIATED"] = "initiated";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["EXPIRED"] = "expired";
    PaymentStatus["COD_PENDING"] = "cod_pending";
    PaymentStatus["REFUND_PENDING"] = "refund_pending";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// ── Payment Mode ──
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["UPI"] = "upi";
    PaymentMode["COD"] = "cod";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
// ── Shipment Status ──
var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["PENDING"] = "pending";
    ShipmentStatus["DISPATCHED"] = "dispatched";
    ShipmentStatus["IN_TRANSIT"] = "in_transit";
    ShipmentStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    ShipmentStatus["DELIVERED"] = "delivered";
    ShipmentStatus["RTO"] = "rto";
})(ShipmentStatus || (exports.ShipmentStatus = ShipmentStatus = {}));
// ── Reservation Status ──
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["HELD"] = "held";
    ReservationStatus["COMMITTED"] = "committed";
    ReservationStatus["RELEASED"] = "released";
    ReservationStatus["EXPIRED"] = "expired";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
// ── Publish Status ──
var PublishStatus;
(function (PublishStatus) {
    PublishStatus["DRAFT"] = "draft";
    PublishStatus["PUBLISHED"] = "published";
    PublishStatus["ARCHIVED"] = "archived";
})(PublishStatus || (exports.PublishStatus = PublishStatus = {}));
// ── Admin Roles ──
var AdminRole;
(function (AdminRole) {
    AdminRole["OWNER"] = "owner";
    AdminRole["CATALOG_EDITOR"] = "catalog_editor";
    AdminRole["FULFILLMENT_OPERATOR"] = "fulfillment_operator";
    AdminRole["SUPPORT"] = "support";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
// ── User Status ──
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
// ── Return Reason ──
var ReturnReason;
(function (ReturnReason) {
    ReturnReason["DAMAGED"] = "damaged";
    ReturnReason["WRONG_PRODUCT"] = "wrong_product";
    ReturnReason["NOT_AS_DESCRIBED"] = "not_as_described";
    ReturnReason["OTHER"] = "other";
})(ReturnReason || (exports.ReturnReason = ReturnReason = {}));
// ── Return Status ──
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["REQUESTED"] = "requested";
    ReturnStatus["APPROVED"] = "approved";
    ReturnStatus["REJECTED"] = "rejected";
    ReturnStatus["RECEIVED"] = "received";
    ReturnStatus["COMPLETED"] = "completed";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
// ── Refund Status ──
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "pending";
    RefundStatus["PROCESSING"] = "processing";
    RefundStatus["SUCCESS"] = "success";
    RefundStatus["FAILED"] = "failed";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
// ── Stock Adjustment Reason ──
var AdjustmentReason;
(function (AdjustmentReason) {
    AdjustmentReason["RECEIVED"] = "received";
    AdjustmentReason["DAMAGED"] = "damaged";
    AdjustmentReason["CORRECTION"] = "correction";
    AdjustmentReason["RETURN_RESTOCKED"] = "return_restocked";
    AdjustmentReason["OTHER"] = "other";
})(AdjustmentReason || (exports.AdjustmentReason = AdjustmentReason = {}));
// ── Media Type ──
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
})(MediaType || (exports.MediaType = MediaType = {}));
// ── Product Sort ──
var ProductSortBy;
(function (ProductSortBy) {
    ProductSortBy["NEWEST"] = "newest";
    ProductSortBy["PRICE_ASC"] = "price_asc";
    ProductSortBy["PRICE_DESC"] = "price_desc";
    ProductSortBy["RELEVANCE"] = "relevance";
})(ProductSortBy || (exports.ProductSortBy = ProductSortBy = {}));
//# sourceMappingURL=index.js.map