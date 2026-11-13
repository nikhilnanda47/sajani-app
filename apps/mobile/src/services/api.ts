/**
 * Mobile API client — connects to NestJS backend.
 * Uses the TransformInterceptor response shape: { success, data, requestId }
 */

const API_BASE = __DEV__
  ? 'http://localhost:3000'  // Dev: local API
  : 'https://api.sajani.in'; // Prod: placeholder

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId: string;
}

interface PaginatedData<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string | null;
  color: string | null;
  attributes: Record<string, unknown> | null;
  pricePaise: number;
  compareAtPaise: number | null;
  inventory: {
    available: number;
    reserved: number;
  } | null;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  publishStatus: string;
  fabric: string | null;
  weaveMethod: string | null;
  origin: string | null;
  careInstructions: string | null;
  blousePiece: string | null;
  length: string | null;
  width: string | null;
  weight: string | null;
  occasion: string[] | null;
  tags: string[] | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: ProductVariant[];
  media: Array<{
    id: string;
    url: string;
    altText: string | null;
    mediaType: string;
    sortOrder: number;
  }>;
  createdAt: string;
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    const err = (json as any).error || { code: 'UNKNOWN', message: 'Request failed' };
    throw new ApiError(err.code, err.message, res.status);
  }

  return json.data;
}

// ── Public endpoints (no auth needed) ──

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/api/v1/categories');
}

export async function getProducts(params?: Record<string, string>): Promise<PaginatedData<Product>> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<PaginatedData<Product>>(`/api/v1/products${query}`);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return request<Product>(`/api/v1/products/${slug}`);
}

// ── Helpers ──

export function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export function getLowestPrice(variants?: ProductVariant[]): number {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.pricePaise));
}

export function getComparePrice(variants?: ProductVariant[]): number | null {
  if (!variants || variants.length === 0) return null;
  const prices = variants.map((v) => v.compareAtPaise).filter(Boolean) as number[];
  return prices.length > 0 ? Math.max(...prices) : null;
}

export function getTotalStock(variants?: ProductVariant[]): number {
  if (!variants) return 0;
  return variants.reduce((sum, v) => sum + (v.inventory?.available ?? 0), 0);
}
