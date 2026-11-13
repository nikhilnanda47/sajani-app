import { CURRENCY, ORDER_NUMBER_PREFIX } from '../constants';

/**
 * Convert paise (integer) to rupee display string.
 * e.g., 350000 → "3,500.00"
 */
export function paiseToRupee(paise: number): string {
  const rupees = paise / CURRENCY.PAISE_PER_RUPEE;
  return rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convert paise to formatted display with ₹ symbol.
 * e.g., 350000 → "₹3,500.00"
 */
export function formatPaise(paise: number): string {
  return `₹${paiseToRupee(paise)}`;
}

/**
 * Convert rupees (number) to paise (integer).
 * e.g., 3500 → 350000
 */
export function rupeeToPaise(rupees: number): number {
  return Math.round(rupees * CURRENCY.PAISE_PER_RUPEE);
}

/**
 * Generate a URL-safe slug from a string.
 * e.g., "Sambalpuri Ikat Silk Saree – Maroon & Gold" → "sambalpuri-ikat-silk-saree-maroon-gold"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Generate a human-readable order number.
 * Format: SAJ-YYYYMMDD-XXXX (XXXX is a zero-padded sequence)
 */
export function generateOrderNumber(sequence: number): string {
  const now = new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
  const seq = String(sequence).padStart(4, '0');
  return `${ORDER_NUMBER_PREFIX}-${date}-${seq}`;
}

/**
 * Validate Indian phone number in E.164 format.
 * e.g., "+919876543210" → true
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

/**
 * Validate Indian PIN code.
 * e.g., "768001" → true
 */
export function isValidPinCode(pinCode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pinCode);
}
