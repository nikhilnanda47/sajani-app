import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { formatPaise } from '../services/api';

interface Props {
  navigation: any;
  route: { params: { order: any } };
}

export default function OrderSuccessScreen({ navigation, route }: Props) {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>

        {/* Order Number */}
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>ORDER NUMBER</Text>
          <Text style={styles.orderNumber}>{order.publicNumber}</Text>
        </View>

        <Text style={styles.delivery}>📦 Estimated delivery: {order.estimatedDelivery || '5–7 business days'}</Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {order.items?.length || 0} item(s) • {formatPaise(order.totalPaise)}
          </Text>
          <Text style={styles.summaryMode}>
            Payment: {order.paymentMode === 'cod' ? 'Cash on Delivery' : 'UPI'}
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => {
            navigation.navigate('Orders', {
              screen: 'OrderDetail',
              params: { orderId: order.id },
            });
          }}
        >
          <Text style={styles.viewBtnText}>VIEW ORDER DETAILS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: spacing.lg },

  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  checkMark: { fontSize: 36, color: colors.white, fontWeight: '700' },

  title: { ...typography.headlineLg, color: colors.primary, textAlign: 'center', marginBottom: 20 },

  orderCard: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center',
    marginBottom: 16, width: '100%',
  },
  orderLabel: { ...typography.labelMd, color: colors.secondary, marginBottom: 4 },
  orderNumber: {
    fontSize: 22, fontWeight: '700', color: colors.onSurface,
    fontFamily: 'monospace', letterSpacing: 1,
  },

  delivery: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: 16 },

  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: 16, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, marginBottom: 24,
  },
  summaryText: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  summaryMode: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },

  viewBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  viewBtnText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },

  shopBtn: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  shopBtnText: { ...typography.labelLg, color: colors.primary },
});
