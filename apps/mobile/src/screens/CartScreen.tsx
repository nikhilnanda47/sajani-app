import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import {
  isLoggedIn, loadToken, getCart, updateCartItem, removeCartItem, formatPaise,
  type CartResponse, type CartItemResponse,
} from '../services/api';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null); // item ID being updated
  const [loggedIn, setLoggedIn] = useState(false);

  // Reload cart every time this tab gets focus
  useFocusEffect(
    useCallback(() => {
      checkAndLoad();
    }, []),
  );

  const checkAndLoad = async () => {
    const hasToken = await loadToken();
    setLoggedIn(hasToken);
    if (hasToken) {
      await loadCart();
    } else {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      setCart({ items: [], subtotalPaise: 0, itemCount: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    setUpdating(itemId);
    try {
      if (newQty <= 0) {
        const data = await removeCartItem(itemId);
        setCart(data);
      } else {
        const data = await updateCartItem(itemId, newQty);
        setCart(data);
      }
    } catch {}
    setUpdating(null);
  };

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const data = await removeCartItem(itemId);
      setCart(data);
    } catch {}
    setUpdating(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not logged in
  if (!loggedIn) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🛍️</Text>
        <Text style={styles.emptyTitle}>Your bag is empty</Text>
        <Text style={styles.emptySubtitle}>Login to start adding handwoven sarees to your bag.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.loginBtnText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🛍️</Text>
        <Text style={styles.emptyTitle}>Your bag is empty</Text>
        <Text style={styles.emptySubtitle}>Explore our curated collection of handwoven Sambalpuri sarees.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text style={styles.loginBtnText}>EXPLORE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCart(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 16 }}>⏱️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Shopping Bag</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Handloom items reserved for you</Text>
          </View>
        </View>

        {/* Cart Items */}
        {cart.items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            updating={updating === item.id}
            onIncrement={() => handleUpdateQty(item.id, item.quantity + 1)}
            onDecrement={() => handleUpdateQty(item.id, item.quantity - 1)}
            onRemove={() => handleRemove(item.id)}
            onPress={() => navigation.navigate('Explore', {
              screen: 'ProductDetail',
              params: { slug: item.variant.productSlug },
            })}
          />
        ))}

        {/* Certification */}
        <View style={styles.certBox}>
          <Text style={{ fontSize: 18 }}>🏅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.certTitle}>ODISHA HERITAGE CERTIFICATION</Text>
            <Text style={styles.certSub}>Every weave carries an authentic Silk Mark & Handloom Tag.</Text>
          </View>
        </View>

        {/* Bill Details */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal ({cart.itemCount} items)</Text>
            <Text style={styles.billValue}>{formatPaise(cart.subtotalPaise)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Shipping</Text>
            <Text style={styles.billFree}>Calculated at checkout</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes (GST 5%)</Text>
            <Text style={styles.billIncluded}>Included</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Total Amount</Text>
            <Text style={styles.billTotal}>{formatPaise(cart.subtotalPaise)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Checkout Bar */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.85}>
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
          <Text style={styles.checkoutPrice}>{formatPaise(cart.subtotalPaise)} →</Text>
        </TouchableOpacity>
        <View style={styles.secureRow}>
          <Text style={styles.secureText}>🔒 100% Secure Checkout • 256-Bit Encrypted</Text>
        </View>
      </View>
    </View>
  );
}

// ── Cart Item Card ──
function CartItemCard({
  item, updating, onIncrement, onDecrement, onRemove, onPress,
}: {
  item: CartItemResponse;
  updating: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.itemRow}>
        {/* Thumbnail placeholder */}
        <View style={styles.itemThumb}>
          <Text style={{ fontSize: 24 }}>🧶</Text>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.variant.productTitle}</Text>
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.removeIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.itemVariant} numberOfLines={1}>
            {[item.variant.color, item.variant.name].filter(Boolean).join(' • ')}
          </Text>

          {item.availabilityWarning && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>{item.availabilityWarning}</Text>
            </View>
          )}

          <View style={styles.itemBottom}>
            <View style={styles.priceCol}>
              <Text style={styles.itemPrice}>{formatPaise(item.variant.pricePaise)}</Text>
              {item.variant.compareAtPaise && item.variant.compareAtPaise > item.variant.pricePaise && (
                <Text style={styles.itemCompare}>{formatPaise(item.variant.compareAtPaise)}</Text>
              )}
            </View>

            {/* Qty Stepper */}
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={onDecrement}
                disabled={updating}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepQty}>
                {updating ? '...' : item.quantity}
              </Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={onIncrement}
                disabled={updating || item.quantity >= 10}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.lineTotal}>Line total: {formatPaise(item.lineTotalPaise)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.margin, paddingBottom: 160 },
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

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...typography.headlineMd, color: colors.primary },
  countBadge: {
    backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: { ...typography.labelSm, color: colors.secondary },
  headerSub: { ...typography.bodySm, color: colors.onSurfaceVariant },

  // Item Card
  itemCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...elevation.flat,
  },
  itemRow: { flexDirection: 'row', gap: spacing.md },
  itemThumb: {
    width: 80, height: 100, borderRadius: borderRadius.DEFAULT,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  itemDetails: { flex: 1 },
  itemTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  itemTitle: { ...typography.headlineMd, fontSize: 15, color: colors.onSurface, flex: 1 },
  removeIcon: { fontSize: 16 },
  itemVariant: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  warningBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#fce4ec', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  warningText: { ...typography.labelSm, color: colors.error, fontWeight: '700' },

  itemBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10,
  },
  priceCol: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  itemPrice: { ...typography.currencyMd, color: colors.primary, fontWeight: '600' },
  itemCompare: { ...typography.currencyStrike },

  // Stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.full,
    padding: 2,
  },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  stepQty: { ...typography.labelMd, paddingHorizontal: 10, color: colors.onSurface, fontWeight: '600' },

  lineTotal: {
    ...typography.bodySm, color: colors.onSurfaceVariant,
    textAlign: 'right', marginTop: 8,
  },

  // Certification
  certBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(254, 216, 150, 0.2)', borderRadius: borderRadius.lg,
    padding: spacing.md, marginTop: spacing.sm,
  },
  certTitle: { ...typography.labelMd, color: colors.secondary, fontWeight: '700' },
  certSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  // Bill Card
  billCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginTop: spacing.md, ...elevation.flat,
  },
  billTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: 12 },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  billValue: { ...typography.currencyMd, color: colors.onSurface, fontWeight: '500' },
  billFree: { ...typography.bodySm, color: colors.secondary },
  billIncluded: { ...typography.bodySm, color: colors.outline },
  billDivider: {
    height: 1, backgroundColor: colors.surfaceContainerHighest,
    marginVertical: 8,
  },
  billTotalLabel: { ...typography.headlineMd, fontSize: 16, color: colors.onSurface, fontWeight: '600' },
  billTotal: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },

  // Checkout Bar
  checkoutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.margin, paddingTop: 12, paddingBottom: 28,
  },
  checkoutBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, paddingHorizontal: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...elevation.raised,
  },
  checkoutBtnText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },
  checkoutPrice: { ...typography.currencyMd, color: colors.secondaryContainer },
  secureRow: { alignItems: 'center', marginTop: 8 },
  secureText: { ...typography.bodySm, color: colors.outline, letterSpacing: 0.5 },
});
