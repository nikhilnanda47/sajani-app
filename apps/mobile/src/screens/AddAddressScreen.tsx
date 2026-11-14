import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { createAddress } from '../services/api';

interface Props {
  navigation: any;
}

export default function AddAddressScreen({ navigation }: Props) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+91');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Odisha');
  const [pinCode, setPinCode] = useState('');
  const [label, setLabel] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!recipientName || !recipientPhone || !line1 || !city || !district || !pinCode) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await createAddress({
        recipientName, recipientPhone, line1,
        line2: line2 || undefined,
        landmark: landmark || undefined,
        city, district, state, pinCode, label, isDefault,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <InputField label="Recipient Name *" value={recipientName} onChangeText={setRecipientName} placeholder="Priya Meher" />
      <InputField label="Phone *" value={recipientPhone} onChangeText={setRecipientPhone} placeholder="+919876543210" keyboardType="phone-pad" maxLength={13} />
      <InputField label="Address Line 1 *" value={line1} onChangeText={setLine1} placeholder="House/Flat/Building" />
      <InputField label="Address Line 2" value={line2} onChangeText={setLine2} placeholder="Street/Area" />
      <InputField label="Landmark" value={landmark} onChangeText={setLandmark} placeholder="Near Samaleswari Temple" />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <InputField label="City *" value={city} onChangeText={setCity} placeholder="Sambalpur" />
        </View>
        <View style={{ flex: 1 }}>
          <InputField label="District *" value={district} onChangeText={setDistrict} placeholder="Sambalpur" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <InputField label="State" value={state} onChangeText={setState} placeholder="Odisha" />
        </View>
        <View style={{ flex: 1 }}>
          <InputField label="PIN Code *" value={pinCode} onChangeText={setPinCode} placeholder="768001" keyboardType="number-pad" maxLength={6} />
        </View>
      </View>

      {/* Label selector */}
      <Text style={styles.fieldLabel}>LABEL</Text>
      <View style={styles.labelRow}>
        {['Home', 'Office', 'Other'].map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.labelChip, label === l && styles.labelChipActive]}
            onPress={() => setLabel(l)}
          >
            <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Default toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Set as default address</Text>
        <Switch
          value={isDefault}
          onValueChange={setIsDefault}
          trackColor={{ true: colors.primary, false: colors.surfaceContainerHigh }}
          thumbColor={colors.white}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE ADDRESS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, maxLength }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.margin, paddingBottom: 40 },

  field: { marginBottom: 14 },
  fieldLabel: {
    ...typography.labelMd, color: colors.secondary, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.DEFAULT,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.onSurface,
  },

  row: { flexDirection: 'row', gap: 10 },

  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  labelChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer,
  },
  labelChipActive: { backgroundColor: colors.primary },
  labelChipText: { ...typography.labelMd, color: colors.onSurface },
  labelChipTextActive: { color: colors.onPrimary },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingVertical: 8,
  },
  toggleLabel: { ...typography.bodyMd, color: colors.onSurface },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '700' },
});
