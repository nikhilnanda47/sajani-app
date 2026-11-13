'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { api } from '../../services/api';
import styles from './categories.module.css';

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push('/login'); return; }
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createCategory(formData);
      setFormData({ name: '', description: '', sortOrder: 0 });
      setShowForm(false);
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    await api.updateCategory(cat.id, { active: !cat.active });
    await loadCategories();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <h2>Categories</h2>
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Category'}
          </button>
        </header>

        {showForm && (
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Heritage"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.saveBtn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Category'}
            </button>
          </form>
        )}

        <div className={styles.content}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.sortOrder}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td className={styles.slug}>{cat.slug}</td>
                  <td className={styles.desc}>{cat.description || '—'}</td>
                  <td>
                    <span className={cat.active ? styles.badgeActive : styles.badgeInactive}>
                      {cat.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.toggleBtn} onClick={() => toggleActive(cat)}>
                      {cat.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
