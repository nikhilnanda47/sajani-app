import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, elevation } from '../theme';
import {
  isLoggedIn, loadToken, requestOtp, verifyOtp, clearTokens,
  getProfile, updateProfile, type UserProfile,
} from '../services/api';

type Screen = 'loading' | 'login' | 'otp' | 'profile' | 'editName';

export default function ProfileScreen() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const hasToken = await loadToken();
    if (hasToken) {
      try {
        const p = await getProfile();
        setProfile(p);
        setScreen('profile');
      } catch {
        await clearTokens();
        setScreen('login');
      }
    } else {
      setScreen('login');
    }
  };

  const handleRequestOtp = async () => {
    setBusy(true);
    setError('');
    try {
      await requestOtp(phone);
      setScreen('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await verifyOtp(phone, otp);
      const p = await getProfile();
      setProfile(p);

      // If new user, prompt for name
      if (result.isNewUser || !p.name) {
        setEditName('');
        setScreen('editName');
      } else {
        setScreen('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const p = await updateProfile({ name: editName.trim() });
      setProfile(p);
      setScreen('profile');
    } catch (err: any) {
      setError(err.message || 'Failed to save name');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await clearTokens();
    setProfile(null);
    setPhone('+91');
    setOtp('');
    setScreen('login');
  };

  if (screen === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Login Screen ──
  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <View style={styles.loginCard}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🧶</Text>
          <Text style={styles.loginTitle}>Welcome to Sajani</Text>
          <Text style={styles.loginSubtitle}>
            Login with your phone number to manage orders, addresses and more.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+919876543210"
              keyboardType="phone-pad"
              maxLength={13}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.disabledBtn]}
            onPress={handleRequestOtp}
            disabled={busy || phone.length < 13}
          >
            <Text style={styles.primaryBtnText}>
              {busy ? 'SENDING...' : 'SEND OTP'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.devHint}>Dev mode: OTP is always 123456</Text>
        </View>
      </View>
    );
  }

  // ── OTP Verify Screen ──
  if (screen === 'otp') {
    return (
      <View style={styles.container}>
        <View style={styles.loginCard}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔐</Text>
          <Text style={styles.loginTitle}>Enter OTP</Text>
          <Text style={styles.loginSubtitle}>
            We sent a 6-digit code to {phone}
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OTP CODE</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.disabledBtn]}
            onPress={handleVerifyOtp}
            disabled={busy || otp.length < 6}
          >
            <Text style={styles.primaryBtnText}>
              {busy ? 'VERIFYING...' : 'VERIFY'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setOtp(''); setError(''); setScreen('login'); }}>
            <Text style={styles.linkText}>← Change number</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Edit Name Screen (shown after first login) ──
  if (screen === 'editName') {
    return (
      <View style={styles.container}>
        <View style={styles.loginCard}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>👋</Text>
          <Text style={styles.loginTitle}>What's your name?</Text>
          <Text style={styles.loginSubtitle}>
            Help us personalise your handloom shopping experience.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Priya Meher"
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.disabledBtn]}
            onPress={handleSaveName}
            disabled={busy || !editName.trim()}
          >
            <Text style={styles.primaryBtnText}>
              {busy ? 'SAVING...' : 'CONTINUE'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Profile Screen (logged in) ──
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>{profile?.name || 'Sajani Customer'}</Text>
        <Text style={styles.profilePhone}>{profile?.phone}</Text>
        {profile?.email && <Text style={styles.profileEmail}>{profile.email}</Text>}
      </View>

      {/* Actions */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => { setEditName(profile?.name || ''); setScreen('editName'); }}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuText}>Edit Name</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📍</Text>
          <Text style={styles.menuText}>My Addresses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Order History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  container: {
    flex: 1, backgroundColor: colors.surface,
    justifyContent: 'center', padding: spacing.lg,
  },
  scrollContainer: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingBottom: 100 },

  // Login Card
  loginCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center',
  },
  loginTitle: { ...typography.headlineMd, marginBottom: spacing.sm },
  loginSubtitle: {
    ...typography.bodySm, textAlign: 'center', marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  // Input
  inputGroup: { width: '100%', marginBottom: spacing.md },
  inputLabel: { ...typography.labelMd, color: colors.secondary, marginBottom: 6 },
  input: {
    width: '100%', backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.DEFAULT,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: colors.onSurface,
  },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8 },

  // Buttons
  primaryBtn: {
    width: '100%', backgroundColor: colors.primary,
    borderRadius: borderRadius.DEFAULT, paddingVertical: 14,
    alignItems: 'center', marginTop: spacing.sm,
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { ...typography.labelLg, color: colors.onPrimary },
  linkText: { ...typography.bodyMd, color: colors.primary, marginTop: spacing.md },
  devHint: {
    ...typography.bodySm, color: colors.neutral, marginTop: spacing.md,
    fontStyle: 'italic',
  },
  errorText: { ...typography.bodySm, color: colors.error, marginBottom: spacing.sm },

  // Profile Header
  profileHeader: {
    alignItems: 'center', paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.onPrimary },
  profileName: { ...typography.headlineMd, color: colors.onSurface },
  profilePhone: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  profileEmail: { ...typography.bodySm, color: colors.secondary, marginTop: 2 },

  // Menu
  menuSection: {
    marginTop: spacing.lg, marginHorizontal: spacing.margin,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg, ...elevation.flat, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 18 },
  menuText: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },

  // Logout
  logoutBtn: {
    marginTop: spacing.lg, marginHorizontal: spacing.margin,
    borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.DEFAULT,
    paddingVertical: 12, alignItems: 'center',
  },
  logoutText: { ...typography.labelLg, color: colors.error },
});
