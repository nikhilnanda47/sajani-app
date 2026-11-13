import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>👤</Text>
        <Text style={styles.loginTitle}>Welcome to Sajani</Text>
        <Text style={styles.loginSubtitle}>
          Login with your phone number to manage orders and addresses.
        </Text>
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>LOGIN WITH OTP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  loginCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  loginTitle: {
    ...typography.headlineMd,
    marginBottom: spacing.sm,
  },
  loginSubtitle: {
    ...typography.bodySm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
