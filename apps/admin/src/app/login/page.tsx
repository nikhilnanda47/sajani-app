'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requestOtp(phone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOtp(phone, otp);
      api.setToken(result.accessToken);
      localStorage.setItem('sajani_admin_refresh', result.refreshToken);

      // Verify admin access
      const me = await api.getMe();
      if (me.type !== 'admin') {
        api.clearToken();
        setError('This account does not have admin access.');
        return;
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>Sajani</h1>
          <span>Admin Portal</span>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp}>
            <label className={styles.label}>Phone Number</label>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              required
            />
            <p className={styles.hint}>Enter your admin phone number. Dev OTP: 123456</p>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label className={styles.label}>Enter OTP</label>
            <input
              className={styles.input}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
            />
            <p className={styles.hint}>OTP sent to {phone}</p>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <button
              className={styles.link}
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            >
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
