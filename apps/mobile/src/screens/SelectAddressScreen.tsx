import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import { getAddresses, type Address } from '../services/api';

interface Props {
  navigation: any;
  route: any;
}

export default function SelectAddressScreen({ navigation }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, []),
  );

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      // Auto-select default or first
      const def = data.find((a) => a.isDefault) || data[0];
      if (def) setSelected(def.id);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptySubtitle}>Add a delivery address to continue</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addrCard, selected === addr.id && styles.addrCardSelected]}
              onPress={() => setSelected(addr.id)}
              activeOpacity={0.85}
            >
              <View style={styles.addrRow}>
                <View style={[styles.radio, selected === addr.id && styles.radioSelected]}>
                  {selected === addr.id && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.addrHeader}>
                    {addr.label && <View style={styles.labelBadge}><Text style={styles.labelText}>{addr.label}</Text></View>}
                    {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>DEFAULT</Text></View>}
                  </View>
                  <Text style={styles.addrName}>{addr.recipientName}</Text>
                  <Text style={styles.addrPhone}>{addr.recipientPhone}</Text>
                  <Text style={styles.addrLine}>
                    {[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}
                  </Text>
                  <Text style={styles.addrCity}>
                    {addr.city}, {addr.district}, {addr.state} — {addr.pinCode}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <Text style={styles.addBtnText}>+ ADD NEW ADDRESS</Text>
        </TouchableOpacity>
      </ScrollView>

      {selected && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('OrderReview', { addressId: selected })}
          >
            <Text style={styles.continueBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.margin, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: { ...typography.headlineMd, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.bodySm, textAlign: 'center' },

  addrCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...elevation.flat,
  },
  addrCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  addrRow: { flexDirection: 'row', gap: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.outline, justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },

  addrHeader: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  labelBadge: {
    backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  labelText: { ...typography.labelSm, color: colors.onSurface },
  defaultBadge: {
    backgroundColor: colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  defaultText: { ...typography.labelSm, color: colors.secondary },

  addrName: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  addrPhone: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  addrLine: { ...typography.bodyMd, color: colors.onSurface, marginTop: 6 },
  addrCity: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  addBtn: {
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center',
    marginTop: spacing.sm,
  },
  addBtnText: { ...typography.labelLg, color: colors.primary },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.margin, paddingVertical: 12, paddingBottom: 28,
  },
  continueBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, alignItems: 'center',
  },
  continueBtnText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },
});
