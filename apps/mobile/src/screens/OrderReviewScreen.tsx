import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import { getAddresses, getCart, formatPaise, type Address, type CartResponse } from '../services/api';

// Inline the checkout API calls to avoid circular issues
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ ? 'http://localhost:3000' : 'https://api.sajani.in';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('sajani_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Request failed');
  return json.data;
}

interface Props {
  navigation: any;
  route: { params: { addressId: string } };
}

export default function OrderReviewScreen({ navigation, route }: Props) {
  const { addressId } = route.params;
  const [address, setAddress] = useState<Address | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMode] = useState<'cod'>('cod'); // COD only for pilot

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [addrs, cartData] = await Promise.all([getAddresses(), getCart()]);
      const addr = addrs.find((a) => a.id === addressId);
      setAddress(addr || null);
      setCart(cartData);
    } catch {}
    setLoading(false);
  };

  const shippingPaise = (cart?.subtotalPaise ?? 0) >= 500000 ? 0 : 9900;
  const totalPaise = (cart?.subtotalPaise ?? 0) + shippingPaise;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const order = await apiRequest<any>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({ addressId, paymentMode, idempotencyKey }),
      });
      navigation.replace('OrderSuccess', { order });
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.changeLink}>CHANGE</Text>
            </TouchableOpacity>
          </View>
          {address && (
            <View style={styles.addrCard}>
              <Text style={styles.addrName}>{address.recipientName}</Text>
              <Text style={styles.addrLine}>
                {[address.line1, address.line2, address.landmark].filter(Boolean).join(', ')}
              </Text>
              <Text style={styles.addrCity}>
                {address.city}, {address.district}, {address.state} — {address.pinCode}
              </Text>
              <Text style={styles.addrPhone}>{address.recipientPhone}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemThumb}>
                <Text style={{ fontSize: 20 }}>🧶</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.variant.productTitle}</Text>
                <Text style={styles.itemVariant}>
                  {[item.variant.color, item.variant.name].filter(Boolean).join(' • ')}
                </Text>
                <Text style={styles.itemQtyPrice}>
                  Qty: {item.quantity} × {formatPaise(item.variant.pricePaise)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPaise(item.lineTotalPaise)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={[styles.paymentCard, styles.paymentCardSelected]}>
            <View style={styles.paymentRow}>
              <Text style={{ fontSize: 20 }}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Cash on Delivery</Text>
                <Text style={styles.paymentDesc}>Pay safely upon unboxing inspection</Text>
              </View>
              <View style={[styles.radio, styles.radioSelected]}>
                <View style={styles.radioDot} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={[styles.paymentCard, styles.paymentCardDisabled]}>
            <View style={styles.paymentRow}>
              <Text style={{ fontSize: 20 }}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, { color: colors.outline }]}>UPI / Online Payment</Text>
                <Text style={styles.paymentDesc}>Coming soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal ({cart.itemCount} items)</Text>
            <Text style={styles.priceValue}>{formatPaise(cart.subtotalPaise)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceValue}>{shippingPaise === 0 ? 'FREE' : formatPaise(shippingPaise)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (GST 5%)</Text>
            <Text style={styles.priceIncl}>Included</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPaise(totalPaise)}</Text>
          </View>
        </View>

        {/* Trust */}
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>🔒 Secure checkout • Handloom certified • Direct from artisans</Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && { opacity: 0.5 }]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.85}
        >
          <Text style={styles.placeBtnText}>
            {placing ? 'PLACING ORDER...' : `PLACE ORDER ${formatPaise(totalPaise)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.margin, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },

  section: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...elevation.flat,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface, fontWeight: '600' },
  changeLink: { ...typography.labelLg, color: colors.primary },

  // Address
  addrCard: { marginTop: 4 },
  addrName: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  addrLine: { ...typography.bodyMd, color: colors.onSurface, marginTop: 4 },
  addrCity: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  addrPhone: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },

  // Items
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  itemThumb: {
    width: 44, height: 56, borderRadius: 6, backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  itemTitle: { ...typography.bodyMd, fontWeight: '500', color: colors.onSurface },
  itemVariant: { ...typography.bodySm, color: colors.onSurfaceVariant },
  itemQtyPrice: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  itemTotal: { ...typography.currencyMd, color: colors.primary },

  // Payment
  paymentCard: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg,
    padding: 12, marginTop: 8,
  },
  paymentCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  paymentCardDisabled: { opacity: 0.4 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentLabel: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  paymentDesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.outline, justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  priceValue: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  priceIncl: { ...typography.bodySm, color: colors.outline },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHighest, marginVertical: 8 },
  totalLabel: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface, fontWeight: '600' },
  totalValue: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },

  trustRow: { alignItems: 'center', paddingVertical: spacing.md },
  trustText: { ...typography.bodySm, color: colors.outline, textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.margin, paddingVertical: 12, paddingBottom: 28,
  },
  placeBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, alignItems: 'center', ...elevation.raised,
  },
  placeBtnText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },
});
