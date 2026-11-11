'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import styles from './DashboardSidebar.module.css';

interface MenuItemConfig {
  icon: string;
  iconAlt: string;
  label: string;
  href: string;
}

const menuItems: MenuItemConfig[] = [
  {
    icon: '/images/icons/home.png',
    iconAlt: 'Home',
    label: 'Home',
    href: '/dashboard',
  },
  {
    icon: '/images/icons/trophy.png',
    iconAlt: 'Daftar Lomba',
    label: 'Daftar Lomba',
    href: '/dashboard/compe-list',
  },
  {
    icon: '/images/icons/calendar.png',
    iconAlt: 'Daftar Event',
    label: 'Daftar Event',
    href: '/dashboard/event-list',
  },
  {
    icon: '/images/icons/user.png',
    iconAlt: 'Profil',
    label: 'Profil',
    href: '/dashboard/profile',
  },
];

interface DashboardSidebarProps {
  topOffset?: number;
  mobileMode?: 'drawer' | 'dropdown';
  mobileTopOffset?: number;
  translucent?: boolean;
  /** Ikut aliran halaman (mis. sebagai kolom grid) alih-alih dipaku ke layar */
  inline?: boolean;
}

export default function DashboardSidebar({
  topOffset = 0,
  mobileMode = 'drawer',
  mobileTopOffset = 60,
  translucent = false,
  inline = false,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isDropdown = mobileMode === 'dropdown';

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderItems = () =>
    menuItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.menuItem} ${
          isActive(item.href) ? styles.menuItemActive : ''
        }`}
        onClick={closeSidebar}
      >
        <div className={styles.iconWrapper}>
          <Image
            src={item.icon}
            alt={item.iconAlt}
            width={24}
            height={24}
            className={styles.icon}
          />
        </div>
        <span className={styles.label}>{item.label}</span>
      </Link>
    ));

  const cssVars = {
    '--sidebar-top': `${topOffset}px`,
    '--mobile-top': `${mobileTopOffset}px`,
  } as CSSProperties;

  return (
    <>
      {!isDropdown && (
        <button
          className={styles.mobileMenuToggle}
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {!isDropdown && isOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {isDropdown && (
        <>
          <button
            type="button"
            className={styles.mobileTrigger}
            onClick={toggleSidebar}
            aria-expanded={isOpen}
            aria-controls="dashboard-mobile-menu"
            style={cssVars}
          >
            <span>Dashboard</span>
            <ChevronDown
              size={20}
              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            />
          </button>

          <div className={styles.mobileMenuWrap} style={cssVars}>
            <div
              className={`${styles.mobileMenuCollapse} ${
                isOpen ? styles.mobileMenuCollapseOpen : ''
              }`}
            >
              <nav
                id="dashboard-mobile-menu"
                className={styles.mobileMenu}
                aria-hidden={!isOpen}
              >
                {renderItems()}
              </nav>
            </div>
          </div>
        </>
      )}

      <aside
        className={`${styles.sidebar} ${isOpen && !isDropdown ? styles.sidebarOpen : ''} ${
          isDropdown ? styles.sidebarDesktopOnly : ''
        } ${translucent ? styles.sidebarTranslucent : ''} ${
          inline ? styles.sidebarInline : ''
        }`}
        style={cssVars}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Dashboard</h2>
        </div>

        <nav className={styles.nav}>{renderItems()}</nav>
      </aside>
    </>
  );
}