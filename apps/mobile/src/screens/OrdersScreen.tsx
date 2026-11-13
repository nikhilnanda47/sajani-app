import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Your handloom journey begins with your first order.
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
