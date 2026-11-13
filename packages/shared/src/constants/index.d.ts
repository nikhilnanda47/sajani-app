import { OrderStatus } from '../enums';
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean;
export declare const RATE_LIMITS: {
    readonly OTP_PER_PHONE: {
        readonly max: 3;
        readonly windowMinutes: 10;
    };
    readonly OTP_PER_IP: {
        readonly max: 10;
        readonly windowMinutes: 60;
    };
    readonly OTP_VERIFY_ATTEMPTS: 5;
    readonly API_PER_USER: {
        readonly max: 100;
        readonly windowMinutes: 1;
    };
    readonly API_PUBLIC_PER_IP: {
        readonly max: 30;
        readonly windowMinutes: 1;
    };
};
export declare const AUTH: {
    readonly ACCESS_TOKEN_EXPIRY: "15m";
    readonly REFRESH_TOKEN_EXPIRY: "7d";
    readonly OTP_EXPIRY_SECONDS: 300;
    readonly OTP_LENGTH: 6;
};
export declare const INVENTORY: {
    readonly UPI_RESERVATION_MINUTES: 30;
    readonly COD_RESERVATION_MINUTES: 1440;
    readonly EXPIRY_WORKER_INTERVAL_SECONDS: 60;
};
export declare const CART: {
    readonly MAX_QUANTITY_PER_VARIANT: 10;
    readonly MAX_ADDRESSES_PER_USER: 10;
};
export declare const PAGINATION: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 50;
};
export declare const UPLOAD: {
    readonly MAX_IMAGE_SIZE_BYTES: number;
    readonly MAX_VIDEO_SIZE_BYTES: number;
    readonly ALLOWED_IMAGE_MIMES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly ALLOWED_VIDEO_MIMES: readonly ["video/mp4"];
    readonly SIGNED_URL_EXPIRY_SECONDS: 300;
};
export declare const RETURNS: {
    readonly WINDOW_DAYS: 7;
};
export declare const ORDER_NUMBER_PREFIX = "SAJ";
export declare const CURRENCY: {
    readonly CODE: "INR";
    readonly PAISE_PER_RUPEE: 100;
};
//# sourceMappingURL=index.d.ts.map