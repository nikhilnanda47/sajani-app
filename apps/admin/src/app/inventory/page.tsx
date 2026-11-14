'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';
import styles from './inventory.module.css';

interface VariantStock {
  variantId: string;
  sku: string;
  color: string | null;
  name: string | null;
  productTitle: string;
  onHand: number;
  reserved: number;
  available: number;
}

function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export default function InventoryPage() {
  const router = useRouter();
  const [variants, setVariants] = useState<VariantStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push('/login'); return; }
    loadInventory();
  }, [router]);

  const loadInventory = async () => {
    try {
      const products = await api.getProducts();
      const items: VariantStock[] = [];
      (products.items || []).forEach((p: any) => {
        (p.variants || []).forEach((v: any) => {
          const inv = v.inventory || {};
          items.push({
            variantId: v.id,
            sku: v.sku,
            color: v.color,
            name: v.name,
            productTitle: p.title,
            onHand: inv.onHand ?? 0,
            reserved: inv.reserved ?? 0,
            available: (inv.onHand ?? 0) - (inv.reserved ?? 0) - (inv.unavailable ?? 0),
          });
        });
      });
      setVariants(items);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <h2>Inventory</h2>
          <span className={styles.count}>{variants.length} variants</span>
        </header>

        <div className={styles.content}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Color / Variant</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.variantId}>
                  <td className={styles.productName}>{v.productTitle}</td>
                  <td className={styles.sku}>{v.sku}</td>
                  <td>{v.color || v.name || '—'}</td>
                  <td className={styles.num}>{v.onHand}</td>
                  <td className={styles.num}>{v.reserved}</td>
                  <td className={styles.num}>
                    <span className={v.available <= 0 ? styles.stockOut : v.available <= 3 ? styles.stockLow : styles.stockOk}>
                      {v.available}
                    </span>
                  </td>
                  <td>
                    {v.available <= 0 ? (
                      <span className={styles.badgeOut}>OUT OF STOCK</span>
                    ) : v.available <= 3 ? (
                      <span className={styles.badgeLow}>LOW STOCK</span>
                    ) : (
                      <span className={styles.badgeOk}>IN STOCK</span>
                    )}
                  </td>
                </tr>
              ))}
              {variants.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No inventory data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
