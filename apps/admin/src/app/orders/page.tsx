'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';
import styles from './orders.module.css';

const STATUS_OPTIONS = ['all', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const NEXT_STATUS: Record<string, string> = {
  placed: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'Confirm',
  confirmed: 'Pack',
  packed: 'Ship',
  shipped: 'Deliver',
};

function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [shipModal, setShipModal] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [courierName, setCourierName] = useState('');

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push('/login'); return; }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const data = await api.getOrders(params);
      setOrders(data.items || []);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [filter]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    // If shipping, show tracking modal
    if (status === 'shipped') {
      setShipModal(orderId);
      return;
    }

    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, { status });
      await loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
    setUpdating(null);
  };

  const handleShip = async () => {
    if (!shipModal || !trackingId) return;
    setUpdating(shipModal);
    try {
      await api.updateOrderStatus(shipModal, {
        status: 'shipped',
        trackingId,
        courierName: courierName || 'Manual',
      });
      setShipModal(null);
      setTrackingId('');
      setCourierName('');
      await loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
    setUpdating(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <h2>Orders</h2>
          <div className={styles.searchBox}>
            <input
              placeholder="Search by order # or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            />
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={filter === s ? styles.filterActive : styles.filterBtn}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.mono}>{order.publicNumber}</td>
                  <td>
                    <div>{order.customer?.name || '—'}</div>
                    <div className={styles.phone}>{order.customer?.phone}</div>
                  </td>
                  <td className={styles.date}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td>{order.itemCount}</td>
                  <td className={styles.price}>{formatPaise(order.totalPaise)}</td>
                  <td>
                    <span className={styles.payBadge}>
                      {order.paymentMode === 'cod' ? 'COD' : 'UPI'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {NEXT_STATUS[order.status] && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleStatusUpdate(order.id, NEXT_STATUS[order.status])}
                        disabled={updating === order.id}
                      >
                        {updating === order.id ? '...' : STATUS_LABELS[order.status]}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className={styles.empty}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Ship Modal */}
        {shipModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Ship Order</h3>
              <div className={styles.modalField}>
                <label>Tracking ID *</label>
                <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. DTDC123456" />
              </div>
              <div className={styles.modalField}>
                <label>Courier Name</label>
                <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DTDC, India Post" />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelModalBtn} onClick={() => { setShipModal(null); setTrackingId(''); setCourierName(''); }}>Cancel</button>
                <button className={styles.confirmBtn} onClick={handleShip} disabled={!trackingId}>Ship</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
