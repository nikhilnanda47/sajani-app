/**
 * Convert paise (integer) to rupee display string.
 * e.g., 350000 → "3,500.00"
 */
export declare function paiseToRupee(paise: number): string;
/**
 * Convert paise to formatted display with ₹ symbol.
 * e.g., 350000 → "₹3,500.00"
 */
export declare function formatPaise(paise: number): string;
/**
 * Convert rupees (number) to paise (integer).
 * e.g., 3500 → 350000
 */
export declare function rupeeToPaise(rupees: number): number;
/**
 * Generate a URL-safe slug from a string.
 * e.g., "Sambalpuri Ikat Silk Saree – Maroon & Gold" → "sambalpuri-ikat-silk-saree-maroon-gold"
 */
export declare function generateSlug(text: string): string;
/**
 * Generate a human-readable order number.
 * Format: SAJ-YYYYMMDD-XXXX (XXXX is a zero-padded sequence)
 */
export declare function generateOrderNumber(sequence: number): string;
/**
 * Validate Indian phone number in E.164 format.
 * e.g., "+919876543210" → true
 */
export declare function isValidIndianPhone(phone: string): boolean;
/**
 * Validate Indian PIN code.
 * e.g., "768001" → true
 */
export declare function isValidPinCode(pinCode: string): boolean;
//# sourceMappingURL=index.d.ts.map