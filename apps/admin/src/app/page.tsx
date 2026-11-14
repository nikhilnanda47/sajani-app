'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';
import styles from './page.module.css';

interface DashboardStats {
  todaysOrders: number;
  pendingConfirmation: number;
  lowStockItems: number;
  gmvTodayPaise: number;
  recentOrders: any[];
}

function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: 0,
    pendingConfirmation: 0,
    lowStockItems: 0,
    gmvTodayPaise: 0,
    recentOrders: [],
  });

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
        loadDashboard();
      }
    }).catch(() => {
      api.clearToken();
      router.push('/login');
    });
  }, [router]);

  const loadDashboard = async () => {
    try {
      // Fetch all orders and compute stats client-side
      const allOrders = await api.getOrders();
      const orders = allOrders.items || [];

      const today = new Date().toDateString();
      const todaysOrders = orders.filter(
        (o: any) => new Date(o.createdAt).toDateString() === today,
      );
      const pendingConfirmation = orders.filter(
        (o: any) => o.status === 'placed',
      ).length;
      const gmvTodayPaise = todaysOrders.reduce(
        (sum: number, o: any) => sum + (o.totalPaise || 0), 0,
      );

      // Fetch products to check low stock
      const products = await api.getProducts();
      let lowStock = 0;
      (products.items || []).forEach((p: any) => {
        (p.variants || []).forEach((v: any) => {
          const available = v.inventory?.available ?? v.inventory?.onHand ?? 0;
          if (available > 0 && available <= 3) lowStock++;
        });
      });

      setStats({
        todaysOrders: todaysOrders.length,
        pendingConfirmation,
        lowStockItems: lowStock,
        gmvTodayPaise,
        recentOrders: orders.slice(0, 5),
      });
    } catch {}
    setLoading(false);
  };

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
              <span className={styles.statValue}>{stats.todaysOrders}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pending Confirmation</span>
              <span className={styles.statValue}>{stats.pendingConfirmation}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Low Stock Items</span>
              <span className={styles.statValue}>{stats.lowStockItems}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>GMV Today</span>
              <span className={styles.statValue}>{formatPaise(stats.gmvTodayPaise)}</span>
            </div>
          </div>

          {/* Recent Orders */}
          {stats.recentOrders.length > 0 && (
            <div className={styles.recentSection}>
              <h3>Recent Orders</h3>
              <table className={styles.recentTable}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td className={styles.mono}>{order.publicNumber}</td>
                      <td>{order.customer?.name || order.customer?.phone || '—'}</td>
                      <td>{formatPaise(order.totalPaise)}</td>
                      <td>
                        <span className={styles[`status_${order.status}`] || styles.statusDefault}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
