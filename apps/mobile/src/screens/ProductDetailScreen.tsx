import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import {
  getProductBySlug, formatPaise, getTotalStock, addToCart, isLoggedIn,
  type Product, type ProductVariant,
} from '../services/api';

const { width } = Dimensions.get('window');

interface Props {
  route: { params: { slug: string } };
  navigation: any;
}

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      setError('');
      const data = await getProductBySlug(slug);
      setProduct(data);
      if (data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stock = selectedVariant?.available ?? 0;
  const totalStock = getTotalStock(product.variants);
  const discount = selectedVariant?.compareAtPaise && selectedVariant.compareAtPaise > selectedVariant.pricePaise
    ? Math.round((1 - selectedVariant.pricePaise / selectedVariant.compareAtPaise) * 100)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image Placeholder */}
        <View style={styles.heroImage}>
          <View style={styles.heroInner}>
            <Text style={styles.heroEmoji}>🧵</Text>
            <Text style={styles.heroLabel}>{product.fabric || 'Handloom Saree'}</Text>
          </View>

          {/* Certification Badge */}
          <View style={styles.certBadge}>
            <View style={styles.certDot} />
            <Text style={styles.certText}>✓ AUTHENTIC {product.weaveMethod?.toUpperCase() || 'HANDLOOM'}</Text>
          </View>
        </View>

        {/* Title & Pricing */}
        <View style={styles.infoSection}>
          <View style={styles.tagRow}>
            <Text style={styles.tagLabel}>
              {product.category?.name?.toUpperCase() || 'COLLECTION'}
              {product.origin ? ` • ${product.origin}` : ''}
            </Text>
            {totalStock <= 5 && totalStock > 0 && (
              <View style={styles.scarcityBadge}>
                <View style={styles.scarcityDot} />
                <Text style={styles.scarcityText}>Only {totalStock} left</Text>
              </View>
            )}
          </View>

          <Text style={styles.productTitle}>{product.title}</Text>

          {product.weaveMethod && (
            <View style={styles.weaverRow}>
              <Text style={styles.weaverText}>🏅 {product.weaveMethod} Craft</Text>
            </View>
          )}

          {/* Pricing */}
          {selectedVariant && (
            <View style={styles.priceBlock}>
              <Text style={styles.mainPrice}>{formatPaise(selectedVariant.pricePaise)}</Text>
              {selectedVariant.compareAtPaise && selectedVariant.compareAtPaise > selectedVariant.pricePaise && (
                <Text style={styles.comparePrice}>{formatPaise(selectedVariant.compareAtPaise)}</Text>
              )}
              {discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.taxNote}>Includes all local handloom cesses & taxes</Text>
        </View>

        {/* Variant Selector */}
        {product.variants.length > 1 && (
          <View style={styles.variantSection}>
            <View style={styles.variantHeader}>
              <Text style={styles.variantLabel}>SELECT VARIANT</Text>
              <Text style={styles.variantSelected}>
                {selectedVariant?.name || selectedVariant?.color || 'Default'}
              </Text>
            </View>
            <View style={styles.variantList}>
              {product.variants.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.variantChip, selectedVariant?.id === v.id && styles.variantChipActive]}
                  onPress={() => setSelectedVariant(v)}
                >
                  <Text style={[
                    styles.variantChipText,
                    selectedVariant?.id === v.id && styles.variantChipTextActive,
                  ]}>
                    {v.color || v.name || v.sku}
                  </Text>
                  <Text style={[
                    styles.variantChipPrice,
                    selectedVariant?.id === v.id && styles.variantChipPriceActive,
                  ]}>
                    {formatPaise(v.pricePaise)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Certification Ribbon */}
        <View style={styles.certRibbon}>
          <View style={styles.certRibbonIcon}>
            <Text style={{ fontSize: 20 }}>🛡️</Text>
          </View>
          <View style={styles.certRibbonText}>
            <Text style={styles.certRibbonTitle}>Handloom Certified</Text>
            <Text style={styles.certRibbonSub}>100% Silk Mark Authenticated</Text>
          </View>
        </View>

        {/* Specifications Grid */}
        <View style={styles.specsSection}>
          <Text style={styles.specsSectionTitle}>Textile Provenance</Text>
          <View style={styles.specsGrid}>
            {product.fabric && (
              <SpecCard icon="🧶" label="FABRIC" value={product.fabric} sub="Premium Handloom" />
            )}
            {product.length && (
              <SpecCard icon="📏" label="LENGTH" value={product.length} sub={product.blousePiece || ''} />
            )}
            {product.origin && (
              <SpecCard icon="📍" label="ORIGIN" value={product.origin.split(',')[0]} sub="Western Odisha" />
            )}
            {product.careInstructions && (
              <SpecCard icon="🧼" label="CARE" value={product.careInstructions} sub="Preserve Sheen" />
            )}
            {product.width && (
              <SpecCard icon="↔️" label="WIDTH" value={product.width} sub="" />
            )}
            {product.weight && (
              <SpecCard icon="⚖️" label="WEIGHT" value={product.weight} sub="" />
            )}
          </View>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.storySection}>
            <Text style={styles.storyLabel}>📖 STORY OF THE LOOM</Text>
            <Text style={styles.storyBody}>{product.description}</Text>
          </View>
        )}

        {/* Delivery & Assurance */}
        <View style={styles.assuranceSection}>
          <AssuranceRow icon="🚚" title="Delivers in 5–7 business days" sub="Direct from weaver artisan hub" />
          <AssuranceRow icon="💵" title="Cash on Delivery Available" sub="Pay safely upon unboxing" />
          <AssuranceRow icon="🔄" title="7-Day Hassle-Free Returns" sub="Doorstep pickup guaranteed" />
        </View>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {product.tags.map((tag, i) => (
              <View key={i} style={styles.tagPill}>
                <Text style={styles.tagPillText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          {selectedVariant && (
            <>
              <Text style={styles.bottomPrice}>{formatPaise(selectedVariant.pricePaise)}</Text>
              {selectedVariant.compareAtPaise && selectedVariant.compareAtPaise > selectedVariant.pricePaise && (
                <Text style={styles.bottomCompare}>{formatPaise(selectedVariant.compareAtPaise)}</Text>
              )}
            </>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (stock <= 0 || addingToCart) && styles.addToCartDisabled]}
          disabled={stock <= 0 || addingToCart}
          activeOpacity={0.85}
          onPress={async () => {
            if (!isLoggedIn()) {
              Alert.alert('Login Required', 'Please login from the Profile tab to add items to your bag.');
              return;
            }
            if (!selectedVariant) return;
            setAddingToCart(true);
            try {
              await addToCart(selectedVariant.id, 1);
              Alert.alert('Added to Bag', `${product.title} has been added to your shopping bag.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to add to cart');
            } finally {
              setAddingToCart(false);
            }
          }}
        >
          <Text style={styles.addToCartText}>
            {addingToCart ? 'ADDING...' : stock > 0 ? 'ADD TO BAG' : 'SOLD OUT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sub-components ──

function SpecCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <View style={styles.specCard}>
      <View style={styles.specCardHeader}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
        <Text style={styles.specCardLabel}>{label}</Text>
      </View>
      <Text style={styles.specCardValue}>{value}</Text>
      {sub ? <Text style={styles.specCardSub}>{sub}</Text> : null}
    </View>
  );
}

function AssuranceRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={styles.assuranceRow}>
      <View style={styles.assuranceIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.assuranceTitle}>{title}</Text>
        <Text style={styles.assuranceSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  errorText: { ...typography.bodyMd, color: colors.error, marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
  },
  retryText: { ...typography.labelLg, color: colors.onPrimary },

  // Hero
  heroImage: {
    width: '100%', aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden', position: 'relative',
  },
  heroInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroLabel: { ...typography.labelLg, color: colors.onSurfaceVariant },
  certBadge: {
    position: 'absolute', bottom: 20, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: borderRadius.full,
    ...elevation.raised,
  },
  certDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  certText: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },

  // Info Section
  infoSection: { paddingHorizontal: spacing.margin, paddingTop: spacing.lg },
  tagRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  tagLabel: { ...typography.labelSm, color: colors.secondary, fontWeight: '700' },
  scarcityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.tertiaryContainer, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  scarcityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  scarcityText: { ...typography.labelSm, color: colors.onError, fontWeight: '700' },
  productTitle: { ...typography.headlineLg, color: colors.primary, marginBottom: 4 },
  weaverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  weaverText: { ...typography.bodySm, color: colors.onSurfaceVariant },

  // Pricing
  priceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 12 },
  mainPrice: { ...typography.headlineXl, color: colors.onSurface, fontWeight: '600' },
  comparePrice: { ...typography.currencyStrike, fontSize: 16 },
  discountBadge: {
    backgroundColor: '#ffdadb', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  taxNote: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },

  // Variant Selector
  variantSection: {
    marginTop: spacing.lg, marginHorizontal: spacing.margin,
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    padding: 16,
    ...elevation.flat,
  },
  variantHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  variantLabel: { ...typography.labelLg, color: colors.onSurface },
  variantSelected: { ...typography.bodySm, color: colors.secondary, fontWeight: '500' },
  variantList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  variantChipActive: {
    backgroundColor: colors.primary,
  },
  variantChipText: { ...typography.labelMd, color: colors.onSurface },
  variantChipTextActive: { color: colors.onPrimary },
  variantChipPrice: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  variantChipPriceActive: { color: colors.surfaceContainerLow },

  // Certification Ribbon
  certRibbon: {
    marginTop: spacing.md, marginHorizontal: spacing.margin,
    backgroundColor: colors.secondaryContainer, borderRadius: borderRadius.lg,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  certRibbonIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  certRibbonText: { flex: 1 },
  certRibbonTitle: { ...typography.labelLg, color: colors.onSurface, fontWeight: '700', letterSpacing: 0.5 },
  certRibbonSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  // Specifications
  specsSection: { marginTop: spacing.lg, paddingHorizontal: spacing.margin },
  specsSectionTitle: { ...typography.headlineMd, color: colors.primary, marginBottom: 12 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard: {
    width: (width - spacing.margin * 2 - 10) / 2,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg,
    padding: 14,
  },
  specCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  specCardLabel: { ...typography.labelSm, color: colors.secondary },
  specCardValue: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  specCardSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  // Story
  storySection: {
    marginTop: spacing.lg, marginHorizontal: spacing.margin,
    backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg,
    padding: 16,
  },
  storyLabel: { ...typography.labelLg, color: colors.primary, fontWeight: '700', marginBottom: 8 },
  storyBody: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },

  // Assurance
  assuranceSection: {
    marginTop: spacing.lg, marginHorizontal: spacing.margin,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg,
    padding: 16, gap: 12,
  },
  assuranceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assuranceIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  assuranceTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  assuranceSub: { ...typography.bodySm, color: colors.onSurfaceVariant },

  // Tags
  tagsSection: {
    marginTop: spacing.md, paddingHorizontal: spacing.margin,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  tagPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.full,
  },
  tagPillText: { ...typography.labelSm, color: colors.onSurfaceVariant },

  // Bottom CTA
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.margin, paddingVertical: 12,
    paddingBottom: 28, // safe area
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  bottomPriceCol: { flex: 1 },
  bottomPrice: { ...typography.headlineMd, color: colors.onSurface, fontWeight: '600' },
  bottomCompare: { ...typography.currencyStrike },
  addToCartBtn: {
    flex: 1.5,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.DEFAULT,
    alignItems: 'center',
    ...elevation.raised,
  },
  addToCartDisabled: { backgroundColor: colors.surfaceContainerHigh },
  addToCartText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },
});
