'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { api } from '../../../services/api';
import styles from './new.module.css';

interface Category {
  id: string;
  name: string;
}

interface VariantForm {
  sku: string;
  name: string;
  color: string;
  pricePaise: string;
  compareAtPaise: string;
  initialStock: string;
}

const emptyVariant = (): VariantForm => ({
  sku: '',
  name: '',
  color: '',
  pricePaise: '',
  compareAtPaise: '',
  initialStock: '',
});

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Product fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft');

  // Fabric metadata
  const [fabric, setFabric] = useState('');
  const [weaveMethod, setWeaveMethod] = useState('');
  const [origin, setOrigin] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [blousePiece, setBlousePiece] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [weight, setWeight] = useState('');
  const [occasion, setOccasion] = useState('');
  const [tags, setTags] = useState('');

  // Variants
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()]);

  useEffect(() => {
    const token = api.getToken();
    if (!token) { router.push('/login'); return; }
    api.getCategories().then(setCategories).catch(() => router.push('/login'));
  }, [router]);

  const updateVariant = (index: number, field: keyof VariantForm, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        title,
        categoryId,
        publishStatus,
        variants: variants.map((v) => ({
          sku: v.sku,
          name: v.name || undefined,
          color: v.color || undefined,
          pricePaise: Math.round(parseFloat(v.pricePaise) * 100),
          compareAtPaise: v.compareAtPaise
            ? Math.round(parseFloat(v.compareAtPaise) * 100)
            : undefined,
          initialStock: parseInt(v.initialStock) || 0,
        })),
      };

      if (description) body.description = description;
      if (shortDescription) body.shortDescription = shortDescription;
      if (fabric) body.fabric = fabric;
      if (weaveMethod) body.weaveMethod = weaveMethod;
      if (origin) body.origin = origin;
      if (careInstructions) body.careInstructions = careInstructions;
      if (blousePiece) body.blousePiece = blousePiece;
      if (length) body.length = length;
      if (width) body.width = width;
      if (weight) body.weight = weight;
      if (occasion.trim()) body.occasion = occasion.split(',').map((s) => s.trim()).filter(Boolean);
      if (tags.trim()) body.tags = tags.split(',').map((s) => s.trim()).filter(Boolean);

      await api.createProduct(body);
      router.push('/catalog');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/catalog')}>
            ← Back
          </button>
          <h2>Create New Product</h2>
        </header>

        <form className={styles.formContainer} onSubmit={handleSubmit}>
          {/* Basic Info */}
          <section className={styles.section}>
            <h3>Basic Information</h3>
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sambalpuri Ikat Silk Saree – Maroon & Gold"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Short Description</label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-liner for cards (max 500 chars)"
                maxLength={500}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full product description..."
                rows={4}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Category *</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value as 'draft' | 'published')}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </section>

          {/* Fabric Metadata */}
          <section className={styles.section}>
            <h3>Fabric & Craft Details</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Fabric</label>
                <input value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="e.g. Pure Silk" />
              </div>
              <div className={styles.formGroup}>
                <label>Weave Method</label>
                <input value={weaveMethod} onChange={(e) => setWeaveMethod(e.target.value)} placeholder="e.g. Handloom Ikat" />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Origin</label>
                <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Sonepur, Odisha" />
              </div>
              <div className={styles.formGroup}>
                <label>Blouse Piece</label>
                <input value={blousePiece} onChange={(e) => setBlousePiece(e.target.value)} placeholder="e.g. Included – 0.8m unstitched" />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Length</label>
                <input value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 5.5 meters" />
              </div>
              <div className={styles.formGroup}>
                <label>Width</label>
                <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 46 inches" />
              </div>
              <div className={styles.formGroup}>
                <label>Weight</label>
                <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 450 grams" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Care Instructions</label>
              <input value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} placeholder="e.g. Dry clean only" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Occasion (comma-separated)</label>
                <input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Festive, Wedding, Party" />
              </div>
              <div className={styles.formGroup}>
                <label>Tags (comma-separated)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="silk, ikat, bapta" />
              </div>
            </div>
          </section>

          {/* Variants */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Variants *</h3>
              <button type="button" className={styles.addVariantBtn} onClick={addVariant}>
                + Add Variant
              </button>
            </div>

            {variants.map((variant, idx) => (
              <div key={idx} className={styles.variantCard}>
                <div className={styles.variantHeader}>
                  <span>Variant {idx + 1}</span>
                  {variants.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeVariant(idx)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>SKU *</label>
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      placeholder="SAJ-IKT-MRN-001"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input
                      value={variant.name}
                      onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                      placeholder="Maroon with Gold Border"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Color</label>
                    <input
                      value={variant.color}
                      onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                      placeholder="Maroon"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.pricePaise}
                      onChange={(e) => updateVariant(idx, 'pricePaise', e.target.value)}
                      placeholder="3500.00"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Compare Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.compareAtPaise}
                      onChange={(e) => updateVariant(idx, 'compareAtPaise', e.target.value)}
                      placeholder="4500.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.initialStock}
                      onChange={(e) => updateVariant(idx, 'initialStock', e.target.value)}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push('/catalog')}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
