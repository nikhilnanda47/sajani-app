import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import { formatPaise } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ ? 'http://localhost:3000' : 'https://api.sajani.in';

async function fetchOrderDetail(orderId: string) {
  const token = await AsyncStorage.getItem('sajani_token');
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

async function cancelOrder(orderId: string, reason: string) {
  const token = await AsyncStorage.getItem('sajani_token');
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

const TIMELINE_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

interface Props {
  navigation: any;
  route: { params: { orderId: string } };
}

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [orderId]);

  const load = async () => {
    try {
      const data = await fetchOrderDetail(orderId);
      setOrder(data);
    } catch {}
    setLoading(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive',
          onPress: async () => {
            try {
              const updated = await cancelOrder(orderId, 'Customer requested cancellation');
              setOrder(updated);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!order) {
    return <View style={styles.center}><Text style={styles.errorText}>Order not found</Text></View>;
  }

  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const addr = order.addressSnapshot;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Order Header */}
      <View style={styles.headerCard}>
        <Text style={styles.orderNumber}>{order.publicNumber}</Text>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Status Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledText}>❌ Order Cancelled</Text>
            {order.cancellationReason && (
              <Text style={styles.cancelReason}>{order.cancellationReason}</Text>
            )}
          </View>
        ) : (
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const timestamp = order[`${step === 'placed' ? 'created' : step}At`];
              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isDone && styles.timelineDotDone,
                      isCurrent && styles.timelineDotCurrent,
                    ]}>
                      {isDone && <Text style={styles.timelineCheck}>✓</Text>}
                    </View>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </Text>
                    {timestamp && (
                      <Text style={styles.timelineTime}>
                        {new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' '}
                        {new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Tracking */}
      {order.shipments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          {order.shipments.map((s: any) => (
            <View key={s.id} style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>🚚 {s.carrier}</Text>
              <Text style={styles.trackingId}>{s.trackingId}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Delivery Address */}
      {addr && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addrName}>{addr.recipientName}</Text>
          <Text style={styles.addrLine}>
            {[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.addrCity}>
            {addr.city}, {addr.district}, {addr.state} — {addr.pinCode}
          </Text>
          <Text style={styles.addrPhone}>{addr.recipientPhone}</Text>
        </View>
      )}

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemThumb}><Text style={{ fontSize: 18 }}>🧶</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.productTitle}</Text>
              <Text style={styles.itemVariant}>{item.variantName || item.sku}</Text>
              <Text style={styles.itemQty}>Qty: {item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatPaise(item.totalPaise)}</Text>
          </View>
        ))}
      </View>

      {/* Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Mode</Text>
          <Text style={styles.payValue}>{order.paymentMode === 'cod' ? 'Cash on Delivery' : 'UPI'}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Status</Text>
          <Text style={styles.payValue}>{order.paymentStatus.replace('_', ' ')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Subtotal</Text>
          <Text style={styles.payValue}>{formatPaise(order.subtotalPaise)}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Shipping</Text>
          <Text style={styles.payValue}>{order.shippingPaise === 0 ? 'FREE' : formatPaise(order.shippingPaise)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.payRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPaise(order.totalPaise)}</Text>
        </View>
      </View>

      {/* Cancel Button */}
      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>CANCEL ORDER</Text>
        </TouchableOpacity>
      )}

      {/* Support */}
      <View style={styles.supportCard}>
        <Text style={styles.supportText}>💬 Need help? WhatsApp us for support</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.margin, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  errorText: { ...typography.bodyMd, color: colors.error },

  headerCard: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center',
  },
  orderNumber: { fontSize: 20, fontWeight: '700', color: colors.onSurface, fontFamily: 'monospace' },
  orderDate: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },

  section: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...elevation.flat,
  },
  sectionTitle: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface, fontWeight: '600', marginBottom: 12 },

  // Timeline
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', minHeight: 52 },
  timelineLeft: { width: 28, alignItems: 'center' },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.outline,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface,
  },
  timelineDotDone: { borderColor: colors.success, backgroundColor: colors.success },
  timelineDotCurrent: { borderColor: colors.primary, backgroundColor: colors.primary },
  timelineCheck: { fontSize: 12, color: colors.white, fontWeight: '700' },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.outlineVariant, marginVertical: 2 },
  timelineLineDone: { backgroundColor: colors.success },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 8 },
  timelineLabel: { ...typography.bodyMd, color: colors.outline },
  timelineLabelDone: { color: colors.onSurface, fontWeight: '600' },
  timelineTime: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  // Cancelled
  cancelledBanner: {
    backgroundColor: '#fce4ec', borderRadius: borderRadius.DEFAULT, padding: 12,
  },
  cancelledText: { ...typography.bodyMd, color: '#c62828', fontWeight: '600' },
  cancelReason: { ...typography.bodySm, color: '#c62828', marginTop: 4 },

  // Tracking
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingLabel: { ...typography.bodyMd, color: colors.onSurface },
  trackingId: { ...typography.bodyMd, fontWeight: '600', color: colors.primary, fontFamily: 'monospace' },

  // Address
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
    width: 40, height: 50, borderRadius: 6, backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  itemTitle: { ...typography.bodyMd, fontWeight: '500', color: colors.onSurface },
  itemVariant: { ...typography.bodySm, color: colors.onSurfaceVariant },
  itemQty: { ...typography.bodySm, color: colors.onSurfaceVariant },
  itemPrice: { ...typography.currencyMd, color: colors.primary },

  // Payment
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  payValue: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHighest, marginVertical: 8 },
  totalLabel: { ...typography.headlineMd, fontSize: 16, fontWeight: '600', color: colors.onSurface },
  totalValue: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },

  // Cancel
  cancelBtn: {
    borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 12, alignItems: 'center', marginBottom: spacing.sm,
  },
  cancelBtnText: { ...typography.labelLg, color: colors.error },

  // Support
  supportCard: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  supportText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
