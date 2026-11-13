import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ARTISANAL LOOM HERITAGE</Text>
        <Text style={styles.heroTitle}>Handwoven Heritage,{'\n'}Modern Elegance</Text>
        <Text style={styles.heroSubtitle}>
          Authentic Sambalpuri Bandha & Bomkai Silk, steeped in poetic Odisha craft tradition.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOOM ARCHIVES</Text>
        <Text style={styles.sectionTitle}>Curated Collections</Text>
        {/* Collection cards will be implemented in Phase 2 */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Collections coming soon</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FRESH OFF THE LOOM</Text>
        <Text style={styles.sectionTitle}>New Arrivals</Text>
        {/* Product carousel will be implemented in Phase 2 */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>New arrivals coming soon</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  heroLabel: {
    ...typography.label,
    color: colors.maroon,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.charcoalLight,
  },
  section: {
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  placeholder: {
    backgroundColor: colors.greyLight,
    borderRadius: 10,
    padding: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.bodySmall,
  },
});
