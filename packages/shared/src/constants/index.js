"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY = exports.ORDER_NUMBER_PREFIX = exports.RETURNS = exports.UPLOAD = exports.PAGINATION = exports.CART = exports.INVENTORY = exports.AUTH = exports.RATE_LIMITS = exports.ORDER_TRANSITIONS = void 0;
exports.canTransitionOrder = canTransitionOrder;
const enums_1 = require("../enums");
// ── Order State Machine ──
exports.ORDER_TRANSITIONS = {
    [enums_1.OrderStatus.PLACED]: [enums_1.OrderStatus.CONFIRMED, enums_1.OrderStatus.CANCELLED],
    [enums_1.OrderStatus.CONFIRMED]: [enums_1.OrderStatus.PACKED, enums_1.OrderStatus.CANCELLED],
    [enums_1.OrderStatus.PACKED]: [enums_1.OrderStatus.SHIPPED],
    [enums_1.OrderStatus.SHIPPED]: [enums_1.OrderStatus.DELIVERED],
    [enums_1.OrderStatus.DELIVERED]: [enums_1.OrderStatus.RETURN_REQUESTED],
    [enums_1.OrderStatus.CANCELLED]: [],
    [enums_1.OrderStatus.RETURN_REQUESTED]: [enums_1.OrderStatus.RETURN_APPROVED, enums_1.OrderStatus.RETURN_REJECTED],
    [enums_1.OrderStatus.RETURN_APPROVED]: [enums_1.OrderStatus.RETURNED],
    [enums_1.OrderStatus.RETURN_REJECTED]: [],
    [enums_1.OrderStatus.RETURNED]: [enums_1.OrderStatus.REFUND_PENDING],
    [enums_1.OrderStatus.REFUND_PENDING]: [enums_1.OrderStatus.REFUNDED],
    [enums_1.OrderStatus.REFUNDED]: [],
};
function canTransitionOrder(from, to) {
    return exports.ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
// ── Rate Limits ──
exports.RATE_LIMITS = {
    OTP_PER_PHONE: { max: 3, windowMinutes: 10 },
    OTP_PER_IP: { max: 10, windowMinutes: 60 },
    OTP_VERIFY_ATTEMPTS: 5,
    API_PER_USER: { max: 100, windowMinutes: 1 },
    API_PUBLIC_PER_IP: { max: 30, windowMinutes: 1 },
};
// ── Auth ──
exports.AUTH = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    OTP_EXPIRY_SECONDS: 300, // 5 minutes
    OTP_LENGTH: 6,
};
// ── Inventory ──
exports.INVENTORY = {
    UPI_RESERVATION_MINUTES: 30,
    COD_RESERVATION_MINUTES: 1440, // 24 hours
    EXPIRY_WORKER_INTERVAL_SECONDS: 60,
};
// ── Cart ──
exports.CART = {
    MAX_QUANTITY_PER_VARIANT: 10,
    MAX_ADDRESSES_PER_USER: 10,
};
// ── Pagination ──
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 50,
};
// ── Upload ──
exports.UPLOAD = {
    MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
    ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_VIDEO_MIMES: ['video/mp4'],
    SIGNED_URL_EXPIRY_SECONDS: 300, // 5 minutes
};
// ── Returns ──
exports.RETURNS = {
    WINDOW_DAYS: 7,
};
// ── Order Number ──
exports.ORDER_NUMBER_PREFIX = 'SAJ';
// ── Currency ──
exports.CURRENCY = {
    CODE: 'INR',
    PAISE_PER_RUPEE: 100,
};
//# sourceMappingURL=index.js.map