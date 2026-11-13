'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api.getMe().then((user) => {
      if (user.type !== 'admin') {
        api.clearToken();
        router.push('/login');
      } else {
        setLoading(false);
      }
    }).catch(() => {
      api.clearToken();
      router.push('/login');
    });
  }, [router]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <h2>Dashboard</h2>
        </header>
        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Today&apos;s Orders</span>
              <span className={styles.statValue}>—</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pending Confirmation</span>
              <span className={styles.statValue}>—</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Low Stock Items</span>
              <span className={styles.statValue}>—</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>GMV Today</span>
              <span className={styles.statValue}>—</span>
            </div>
          </div>
          <p style={{ marginTop: '2rem', color: 'var(--grey)' }}>
            Dashboard stats will populate after orders module is built in Phase 3.
          </p>
        </div>
      </main>
    </div>
  );
}
