import { OrderStatus } from '../enums';

// ── Order State Machine ──
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURN_APPROVED, OrderStatus.RETURN_REJECTED],
  [OrderStatus.RETURN_APPROVED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURN_REJECTED]: [],
  [OrderStatus.RETURNED]: [OrderStatus.REFUND_PENDING],
  [OrderStatus.REFUND_PENDING]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Rate Limits ──
export const RATE_LIMITS = {
  OTP_PER_PHONE: { max: 3, windowMinutes: 10 },
  OTP_PER_IP: { max: 10, windowMinutes: 60 },
  OTP_VERIFY_ATTEMPTS: 5,
  API_PER_USER: { max: 100, windowMinutes: 1 },
  API_PUBLIC_PER_IP: { max: 30, windowMinutes: 1 },
} as const;

// ── Auth ──
export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  OTP_EXPIRY_SECONDS: 300, // 5 minutes
  OTP_LENGTH: 6,
} as const;

// ── Inventory ──
export const INVENTORY = {
  UPI_RESERVATION_MINUTES: 30,
  COD_RESERVATION_MINUTES: 1440, // 24 hours
  EXPIRY_WORKER_INTERVAL_SECONDS: 60,
} as const;

// ── Cart ──
export const CART = {
  MAX_QUANTITY_PER_VARIANT: 10,
  MAX_ADDRESSES_PER_USER: 10,
} as const;

// ── Pagination ──
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

// ── Upload ──
export const UPLOAD = {
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_VIDEO_MIMES: ['video/mp4'] as const,
  SIGNED_URL_EXPIRY_SECONDS: 300, // 5 minutes
} as const;

// ── Returns ──
export const RETURNS = {
  WINDOW_DAYS: 7,
} as const;

// ── Order Number ──
export const ORDER_NUMBER_PREFIX = 'SAJ';

// ── Currency ──
export const CURRENCY = {
  CODE: 'INR',
  PAISE_PER_RUPEE: 100,
} as const;
