import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import {
  getCategories, getProducts, formatPaise, getLowestPrice, getComparePrice, getTotalStock,
  type Category, type Product,
} from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.margin * 2 - spacing.gutter) / 2;

interface Props {
  navigation: any;
}

export default function ExploreScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (categoryId?: string | null) => {
    try {
      setError('');
      const [cats, prods] = await Promise.all([
        getCategories(),
        getProducts(categoryId ? { categoryId } : undefined),
      ]);
      setCategories(cats);
      setProducts(prods.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectCategory = (catId: string | null) => {
    setSelectedCategory(catId);
    setLoading(true);
    loadData(catId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedCategory);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadData(selectedCategory); }}>
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Curator Header */}
      <View style={styles.curatorHeader}>
        <View style={styles.curatorRow}>
          <Text style={styles.curatorLabel}>THE LOOM LEDGER</Text>
          <Text style={styles.curatorOrigin}>Bargarh • Sonepur Weaves</Text>
        </View>
        <View style={styles.curatorRow}>
          <Text style={styles.curatorTitle}>Artisanal Catalog</Text>
          <Text style={styles.curatorCount}>{products.length} Pieces</Text>
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => selectCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All Weaves</Text>
          {!selectedCategory && <View style={styles.chipDot} />}
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
            onPress={() => selectCategory(cat.id)}
          >
            <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Grid */}
      <View style={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
          />
        ))}
      </View>

      {products.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No sarees in this collection yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Product Card Component ──
function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const variants = product.variants || [];
  const price = getLowestPrice(variants);
  const comparePrice = getComparePrice(variants);
  const stock = getTotalStock(variants);
  const variant = variants[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Image Placeholder */}
      <View style={styles.cardImage}>
        <View style={styles.cardImageInner}>
          <Text style={styles.cardImageEmoji}>🧶</Text>
          <Text style={styles.cardImageLabel}>{product.fabric || 'Handloom'}</Text>
        </View>

        {/* Technique Badge */}
        <View style={styles.techniqueBadge}>
          <Text style={styles.techniqueBadgeText}>
            {product.weaveMethod || 'HANDLOOM'}
          </Text>
        </View>

        {/* Stock Overlay */}
        <View style={styles.stockOverlay}>
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: stock > 0 ? '#4ade80' : colors.error }]} />
            <Text style={styles.stockText}>
              {stock > 0 ? 'In Stock' : 'Sold Out'}
            </Text>
          </View>
          {product.origin && (
            <Text style={styles.originText}>{product.origin.split(',')[0]}</Text>
          )}
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.cardMeta}>
        <Text style={styles.cardCategory} numberOfLines={1}>
          {product.category?.name?.toUpperCase() || 'COLLECTION'}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={1}>{product.title}</Text>
        {variant && (
          <Text style={styles.cardVariant} numberOfLines={1}>
            {[variant.color, product.fabric].filter(Boolean).join(' • ')}
          </Text>
        )}

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatPaise(price)}</Text>
          {comparePrice && comparePrice > price && (
            <Text style={styles.comparePriceText}>{formatPaise(comparePrice)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },

  // Error
  errorText: { ...typography.bodyMd, color: colors.error, marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
  },
  retryText: { ...typography.labelLg, color: colors.onPrimary },

  // Curator Header
  curatorHeader: { paddingHorizontal: spacing.margin, paddingTop: spacing.md },
  curatorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 2,
  },
  curatorLabel: { ...typography.labelSm, color: colors.secondary, fontWeight: '700' },
  curatorOrigin: { ...typography.labelSm, color: colors.onSurfaceVariant },
  curatorTitle: { ...typography.headlineLg, color: colors.primary },
  curatorCount: { ...typography.labelMd, color: colors.secondary },

  // Category Chips
  chipScroll: { marginTop: spacing.md },
  chipContent: { paddingHorizontal: spacing.margin, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: { ...typography.labelMd, color: colors.onSurface },
  chipTextActive: { color: colors.onPrimary },
  chipDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.secondaryContainer,
  },

  // Product Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.margin,
    marginTop: spacing.md,
    gap: spacing.gutter,
  },

  // Product Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: 8,
    ...elevation.raised,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.DEFAULT,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImageInner: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  cardImageEmoji: { fontSize: 32, marginBottom: 4 },
  cardImageLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },

  // Technique Badge
  techniqueBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  techniqueBadgeText: { ...typography.labelSm, color: colors.primary, letterSpacing: 1.5 },

  // Stock Overlay
  stockOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 8, paddingVertical: 6,
    backgroundColor: 'rgba(77, 5, 22, 0.75)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { ...typography.labelSm, color: colors.surfaceContainerLowest, fontWeight: '600' },
  originText: { ...typography.labelSm, color: colors.secondaryContainer },

  // Card Metadata
  cardMeta: { marginTop: 10, paddingHorizontal: 2 },
  cardCategory: { ...typography.labelSm, color: colors.secondary, marginBottom: 2 },
  cardTitle: { ...typography.headlineMd, fontSize: 15, color: colors.primary, lineHeight: 20 },
  cardVariant: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  // Price
  priceRow: {
    marginTop: 8, paddingTop: 8,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: borderRadius.DEFAULT,
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
  },
  priceText: { ...typography.currencyMd, color: colors.primary, fontWeight: '700' },
  comparePriceText: { ...typography.currencyStrike },

  // Empty State
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
