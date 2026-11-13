"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paiseToRupee = paiseToRupee;
exports.formatPaise = formatPaise;
exports.rupeeToPaise = rupeeToPaise;
exports.generateSlug = generateSlug;
exports.generateOrderNumber = generateOrderNumber;
exports.isValidIndianPhone = isValidIndianPhone;
exports.isValidPinCode = isValidPinCode;
const constants_1 = require("../constants");
/**
 * Convert paise (integer) to rupee display string.
 * e.g., 350000 → "3,500.00"
 */
function paiseToRupee(paise) {
    const rupees = paise / constants_1.CURRENCY.PAISE_PER_RUPEE;
    return rupees.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
/**
 * Convert paise to formatted display with ₹ symbol.
 * e.g., 350000 → "₹3,500.00"
 */
function formatPaise(paise) {
    return `₹${paiseToRupee(paise)}`;
}
/**
 * Convert rupees (number) to paise (integer).
 * e.g., 3500 → 350000
 */
function rupeeToPaise(rupees) {
    return Math.round(rupees * constants_1.CURRENCY.PAISE_PER_RUPEE);
}
/**
 * Generate a URL-safe slug from a string.
 * e.g., "Sambalpuri Ikat Silk Saree – Maroon & Gold" → "sambalpuri-ikat-silk-saree-maroon-gold"
 */
function generateSlug(text) {
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
function generateOrderNumber(sequence) {
    const now = new Date();
    const date = [
        now.getUTCFullYear(),
        String(now.getUTCMonth() + 1).padStart(2, '0'),
        String(now.getUTCDate()).padStart(2, '0'),
    ].join('');
    const seq = String(sequence).padStart(4, '0');
    return `${constants_1.ORDER_NUMBER_PREFIX}-${date}-${seq}`;
}
/**
 * Validate Indian phone number in E.164 format.
 * e.g., "+919876543210" → true
 */
function isValidIndianPhone(phone) {
    return /^\+91[6-9]\d{9}$/.test(phone);
}
/**
 * Validate Indian PIN code.
 * e.g., "768001" → true
 */
function isValidPinCode(pinCode) {
    return /^[1-9][0-9]{5}$/.test(pinCode);
}
//# sourceMappingURL=index.js.map