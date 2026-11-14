import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import { isLoggedIn, loadToken, formatPaise } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ ? 'http://localhost:3000' : 'https://api.sajani.in';

async function fetchOrders() {
  const token = await AsyncStorage.getItem('sajani_token');
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.success ? json.data.items : [];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed: { bg: '#e3f2fd', text: '#1565c0' },
  confirmed: { bg: '#fff8e1', text: '#f57f17' },
  packed: { bg: '#fff3e0', text: '#e65100' },
  shipped: { bg: '#fff3e0', text: '#e65100' },
  delivered: { bg: '#e8f5e9', text: '#2e7d32' },
  cancelled: { bg: '#fce4ec', text: '#c62828' },
  return_requested: { bg: '#fff8e1', text: '#f57f17' },
};

interface Props {
  navigation: any;
}

export default function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAndLoad();
    }, []),
  );

  const checkAndLoad = async () => {
    const hasToken = await loadToken();
    setLoggedIn(hasToken);
    if (hasToken) {
      const data = await fetchOrders();
      setOrders(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!loggedIn) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
        <Text style={styles.emptyTitle}>Login to view orders</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.loginBtnText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>Your handloom journey begins with your first order.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.loginBtnText}>EXPLORE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); checkAndLoad(); }} tintColor={colors.primary} />}
    >
      {orders.map((order: any) => {
        const sc = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
        return (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            activeOpacity={0.85}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{order.publicNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.text }]}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            {order.items?.slice(0, 2).map((item: any, i: number) => (
              <Text key={i} style={styles.orderItem} numberOfLines={1}>
                {item.qty}× {item.productTitle}
              </Text>
            ))}
            {order.itemCount > 2 && (
              <Text style={styles.orderMore}>+{order.itemCount - 2} more</Text>
            )}
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{formatPaise(order.totalPaise)}</Text>
              <Text style={styles.viewLink}>View Details →</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.margin, paddingBottom: 100 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface, paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.headlineMd, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.bodySm, textAlign: 'center', marginBottom: spacing.lg },
  loginBtn: {
    backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: borderRadius.DEFAULT,
  },
  loginBtnText: { ...typography.labelLg, color: colors.onPrimary },

  orderCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...elevation.flat,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { ...typography.bodyMd, fontWeight: '700', color: colors.onSurface, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSm, fontWeight: '700' },
  orderDate: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },
  orderItem: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },
  orderMore: { ...typography.bodySm, color: colors.secondary, marginTop: 2 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  orderTotal: { ...typography.currencyMd, color: colors.primary, fontWeight: '700' },
  viewLink: { ...typography.labelMd, color: colors.primary },
});
