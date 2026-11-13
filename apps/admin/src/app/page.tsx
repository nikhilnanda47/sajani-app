import styles from './page.module.css';

export default function AdminDashboard() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>Sajani</h1>
          <span>Admin</span>
        </div>
        <nav className={styles.nav}>
          <a href="/" className={styles.navItemActive}>Dashboard</a>
          <a href="/catalog" className={styles.navItem}>Catalog</a>
          <a href="/inventory" className={styles.navItem}>Inventory</a>
          <a href="/orders" className={styles.navItem}>Orders</a>
          <a href="/customers" className={styles.navItem}>Customers</a>
          <a href="/reports" className={styles.navItem}>Reports</a>
          <a href="/settings" className={styles.navItem}>Settings</a>
        </nav>
      </aside>
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
            Dashboard data will populate once catalog and orders modules are built.
          </p>
        </div>
      </main>
    </div>
  );
}
