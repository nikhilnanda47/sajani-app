/**
 * Mobile API client — connects to NestJS backend.
 * Uses the TransformInterceptor response shape: { success, data, requestId }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__
  ? 'http://localhost:3000'  // Dev: local API
  : 'https://api.sajani.in'; // Prod: placeholder

const TOKEN_KEY = 'sajani_token';
const REFRESH_KEY = 'sajani_refresh';

let accessToken: string | null = null;

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    const err = (json as any).error || { code: 'UNKNOWN', message: 'Request failed' };
    throw new ApiError(err.code, err.message, res.status);
  }

  return json.data;
}

// ── Token management ──

export async function loadToken(): Promise<boolean> {
  try {
    accessToken = await AsyncStorage.getItem(TOKEN_KEY);
    return !!accessToken;
  } catch {
    return false;
  }
}

export async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  await AsyncStorage.setItem(TOKEN_KEY, access);
  await AsyncStorage.setItem(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  accessToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!accessToken;
}

// ── Auth endpoints ──

export async function requestOtp(phone: string) {
  return request<{ message: string; expiresInSeconds: number }>(
    '/api/v1/auth/otp/request',
    { method: 'POST', body: JSON.stringify({ phone }) },
  );
}

export async function verifyOtp(phone: string, otp: string) {
  const data = await request<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    user: { id: string; phone: string; name: string | null; type: string };
  }>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });

  await saveTokens(data.accessToken, data.refreshToken);
  return data;
}

// ── Profile endpoints ──

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  status: string;
  type: string;
  createdAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/me');
}

export async function updateProfile(data: { name?: string; email?: string }): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Address endpoints ──

export interface Address {
  id: string;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  label: string | null;
  isDefault: boolean;
}

export async function getAddresses(): Promise<Address[]> {
  return request<Address[]>('/api/v1/me/addresses');
}

export async function createAddress(data: Record<string, unknown>): Promise<Address> {
  return request<Address>('/api/v1/me/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(id: string, data: Record<string, unknown>): Promise<Address> {
  return request<Address>(`/api/v1/me/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: string): Promise<void> {
  await request(`/api/v1/me/addresses/${id}`, { method: 'DELETE' });
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
