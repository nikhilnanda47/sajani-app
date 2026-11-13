import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🛍️</Text>
        <Text style={styles.emptyTitle}>Your bag is empty</Text>
        <Text style={styles.emptySubtitle}>
          Explore our curated collection of handwoven Sambalpuri sarees.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.headlineMd,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySm,
    textAlign: 'center',
  },
});
