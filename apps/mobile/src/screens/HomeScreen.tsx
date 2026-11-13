import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import { getProducts, formatPaise, getLowestPrice, getComparePrice, type Product } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.margin * 2 - spacing.gutter) / 2;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    getProducts({ limit: '4', sortBy: 'newest' })
      .then((data) => setNewArrivals(data.items || []))
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>ARTISANAL LOOM HERITAGE</Text>
          </View>
          <Text style={styles.heroTitle}>
            Handwoven Heritage,{'\n'}
            <Text style={styles.heroTitleItalic}>Modern Elegance</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Authentic Sambalpuri Bandha & Bomkai Silk, steeped in poetic Odisha craft tradition.
          </Text>
          <View style={styles.heroCta}>
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.heroButtonText}>EXPLORE MASTERPIECES</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Trust Badges */}
      <View style={styles.trustBadges}>
        {[
          { icon: '🏅', title: '100% SILK MARK', subtitle: 'Certified Purity' },
          { icon: '🧶', title: 'BARGARH WEAVERS', subtitle: 'Direct from Looms' },
          { icon: '🌿', title: 'BANDHA TIE-DYE', subtitle: 'Natural Pigments' },
        ].map((badge, i) => (
          <View key={i} style={[styles.trustBadge, i < 2 && styles.trustBadgeBorder]}>
            <Text style={styles.trustIcon}>{badge.icon}</Text>
            <Text style={styles.trustTitle}>{badge.title}</Text>
            <Text style={styles.trustSubtitle}>{badge.subtitle}</Text>
          </View>
        ))}
      </View>

      {/* Curated Collections */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOOM ARCHIVES</Text>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curated Collections</Text>
          <Text style={styles.viewAll}>View All →</Text>
        </View>
        <View style={styles.collectionsGrid}>
          {[
            { name: 'Everyday', tag: 'TUSSAR & COTTON', color: colors.tertiaryContainer },
            { name: 'Signature', tag: 'PURE IKAT SILKS', color: colors.primary },
            { name: 'Heritage', tag: 'BOMKAI & PASAPALLI', color: colors.primary },
            { name: 'Celebrations', tag: 'BRIDAL ZARI PALLU', color: colors.tertiaryContainer },
          ].map((col, i) => (
            <View key={i} style={[styles.collectionCard, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={[styles.collectionOverlay, { backgroundColor: col.color }]}>
                <Text style={styles.collectionTag}>{col.tag}</Text>
                <Text style={styles.collectionName}>{col.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* New Arrivals */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FRESH OFF THE LOOM</Text>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        {newArrivals.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.arrivalsScroll}>
            {newArrivals.map((product) => {
              const price = getLowestPrice(product.variants || []);
              const compare = getComparePrice(product.variants || []);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.arrivalCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Explore', {
                    screen: 'ProductDetail',
                    params: { slug: product.slug },
                  })}
                >
                  <View style={styles.arrivalImage}>
                    <Text style={{ fontSize: 24 }}>🧶</Text>
                    <Text style={styles.arrivalFabric}>{product.fabric || 'Handloom'}</Text>
                  </View>
                  <View style={styles.arrivalMeta}>
                    <Text style={styles.arrivalCategory}>{product.category?.name?.toUpperCase()}</Text>
                    <Text style={styles.arrivalTitle} numberOfLines={1}>{product.title}</Text>
                    <View style={styles.arrivalPriceRow}>
                      <Text style={styles.arrivalPrice}>{formatPaise(price)}</Text>
                      {compare && compare > price && (
                        <Text style={styles.arrivalCompare}>{formatPaise(compare)}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Loading new arrivals...</Text>
          </View>
        )}
      </View>

      {/* Authenticity Section */}
      <View style={styles.authSection}>
        <Text style={styles.authLabel}>BANDHAKALA REVERENCE</Text>
        <Text style={styles.authTitle}>14 Days on the Loom. A Lifetime in Your Wardrobe.</Text>
        <Text style={styles.authBody}>
          Each warp and weft is precision tie-dyed before weaving, creating soft feather-edged motifs
          celebrated as India's finest poetry in silk.
        </Text>
        <View style={styles.authBadge}>
          <Text style={styles.authBadgeText}>✓ Authenticity Certificate with Every Saree</Text>
        </View>
      </View>

      {/* Footer Trust Strip */}
      <View style={styles.footerStrip}>
        <Text style={styles.footerText}>
          DIRECT FROM WEAVERS OF SONEPUR & BARGARH  •  100% SILK MARK CERTIFIED  •  HANDCRAFTED WITH DEVOTION
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 100, // Account for 64px tab bar + safe area
  },

  // ── Hero ──
  hero: {
    marginHorizontal: spacing.margin,
    marginTop: spacing.md,
    height: 380,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(77, 5, 22, 0.75)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: 10,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondaryContainer,
    marginRight: 6,
  },
  heroBadgeText: {
    ...typography.labelSm,
    color: colors.white,
  },
  heroTitle: {
    ...typography.headlineXl,
    color: colors.white,
    marginBottom: 6,
  },
  heroTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: colors.surfaceContainerLow,
    opacity: 0.9,
    marginBottom: 16,
    maxWidth: 270,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroButton: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  heroButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },

  // ── Trust Badges ──
  trustBadges: {
    flexDirection: 'row',
    marginHorizontal: spacing.margin,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: 14,
    ...elevation.flat,
  },
  trustBadge: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  trustBadgeBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.outlineVariant,
  },
  trustIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  trustTitle: {
    ...typography.labelSm,
    color: colors.onSurface,
    textAlign: 'center',
  },
  trustSubtitle: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },

  // ── Sections ──
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.margin,
  },
  sectionLabel: {
    ...typography.labelMd,
    color: colors.secondary,
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  viewAll: {
    ...typography.labelLg,
    color: colors.primaryContainer,
  },

  // ── Collections Grid ──
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutter,
  },
  collectionCard: {
    width: CARD_WIDTH,
    height: 192,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  collectionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    opacity: 0.9,
  },
  collectionTag: {
    ...typography.labelSm,
    color: colors.secondaryContainer,
    marginBottom: 2,
  },
  collectionName: {
    ...typography.headlineMd,
    fontSize: 17,
    color: colors.white,
  },

  // ── New Arrivals Scroll ──
  arrivalsScroll: {
    paddingTop: spacing.md,
    gap: spacing.gutter,
  },
  arrivalCard: {
    width: 160,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...elevation.raised,
  },
  arrivalImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivalFabric: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  arrivalMeta: {
    padding: 10,
  },
  arrivalCategory: {
    ...typography.labelSm,
    color: colors.secondary,
    marginBottom: 2,
  },
  arrivalTitle: {
    ...typography.headlineMd,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primary,
  },
  arrivalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  arrivalPrice: {
    ...typography.currencyMd,
    color: colors.primary,
    fontWeight: '700',
  },
  arrivalCompare: {
    ...typography.currencyStrike,
  },

  // ── Placeholder ──
  placeholder: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  placeholderText: {
    ...typography.bodySm,
  },

  // ── Authenticity ──
  authSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.margin,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  authLabel: {
    ...typography.labelMd,
    color: colors.secondary,
    marginBottom: 8,
  },
  authTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 8,
  },
  authBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authBadgeText: {
    ...typography.labelLg,
    color: colors.secondary,
  },

  // ── Footer ──
  footerStrip: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.margin,
    alignItems: 'center',
  },
  footerText: {
    ...typography.labelSm,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 16,
  },
});
