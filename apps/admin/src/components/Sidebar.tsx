'use client';

import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/catalog', label: 'Catalog', icon: '🧵' },
  { href: '/categories', label: 'Categories', icon: '📁' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
  { href: '/orders', label: 'Orders', icon: '📋' },
  { href: '/reports', label: 'Reports', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('sajani_admin_token');
    localStorage.removeItem('sajani_admin_refresh');
    window.location.href = '/login';
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>Sajani</h1>
        <span>Admin</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={pathname === item.href ? styles.navItemActive : styles.navItem}
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
