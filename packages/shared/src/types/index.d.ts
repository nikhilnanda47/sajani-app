export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    requestId: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}
export interface PaginatedResponse<T> {
    items: T[];
    cursor: string | null;
    hasMore: boolean;
}
export interface JwtPayload {
    sub: string;
    phone: string;
    type: 'customer' | 'admin';
    role?: string;
    iat: number;
    exp: number;
}
export interface ProductCard {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    categorySlug: string;
    primaryImage: {
        url: string;
        alt: string | null;
    };
    startingPricePaise: number;
    compareAtPaise: number | null;
    isAvailable: boolean;
    fabric: string | null;
    weaveMethod: string | null;
}
export interface VariantResponse {
    id: string;
    sku: string;
    name: string | null;
    color: string | null;
    attributes: Record<string, unknown>;
    pricePaise: number;
    compareAtPaise: number | null;
    available: number;
    isAvailable: boolean;
    active: boolean;
}
export interface CartItemResponse {
    id: string;
    variant: {
        id: string;
        sku: string;
        name: string | null;
        color: string | null;
        pricePaise: number;
        available: number;
        productTitle: string;
        productSlug: string;
        imageUrl: string | null;
    };
    quantity: number;
    lineTotalPaise: number;
    isAvailable: boolean;
    availabilityWarning: string | null;
}
export interface CartResponse {
    items: CartItemResponse[];
    subtotalPaise: number;
    itemCount: number;
}
export interface OrderSummary {
    id: string;
    publicNumber: string;
    status: string;
    paymentMode: string;
    totalPaise: number;
    itemCount: number;
    primaryImageUrl: string | null;
    createdAt: string;
}
export interface QuoteResponse {
    items: QuoteItem[];
    subtotalPaise: number;
    shippingPaise: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
    paymentMode: string;
    codAvailable: boolean;
    estimatedDelivery: string | null;
    warnings: string[];
}
export interface QuoteItem {
    variantId: string;
    productTitle: string;
    sku: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    isAvailable: boolean;
}
export interface StockResponse {
    variantId: string;
    sku: string;
    productTitle: string;
    onHand: number;
    reserved: number;
    unavailable: number;
    available: number;
}
//# sourceMappingURL=index.d.ts.map