'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';
import styles from './catalog.module.css';

interface Variant {
  id: string;
  sku: string;
  name: string | null;
  color: string | null;
  pricePaise: number;
  inventory: { available: number } | null;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  category: { id: string; name: string } | null;
  fabric: string | null;
  variants: Variant[];
  createdAt: string;
}

function formatPaise(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN');
}

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push('/login'); return; }
    loadProducts();
  }, [router]);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.items || []);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (product: Product) => {
    const newStatus = product.publishStatus === 'published' ? 'draft' : 'published';
    await api.updateProduct(product.id, { publishStatus: newStatus });
    await loadProducts();
  };

  const filtered = filter === 'all'
    ? products
    : products.filter((p) => p.publishStatus === filter);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h2>Product Catalog</h2>
            <span className={styles.count}>{products.length} products</span>
          </div>
          <button className={styles.addBtn} onClick={() => router.push('/catalog/new')}>
            + Add Product
          </button>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                className={filter === f ? styles.filterActive : styles.filterBtn}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Price Range</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const prices = product.variants.map((v) => v.pricePaise);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + (v.inventory?.available ?? 0), 0,
                );

                return (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productCell}>
                        <strong>{product.title}</strong>
                        <span className={styles.slug}>{product.slug}</span>
                      </div>
                    </td>
                    <td>{product.category?.name || '—'}</td>
                    <td>{product.variants.length}</td>
                    <td className={styles.price}>
                      {minPrice === maxPrice
                        ? formatPaise(minPrice)
                        : `${formatPaise(minPrice)} – ${formatPaise(maxPrice)}`}
                    </td>
                    <td>
                      <span className={totalStock <= 2 ? styles.lowStock : ''}>
                        {totalStock}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          product.publishStatus === 'published'
                            ? styles.badgePublished
                            : styles.badgeDraft
                        }
                      >
                        {product.publishStatus}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => togglePublish(product)}
                      >
                        {product.publishStatus === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
