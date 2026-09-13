'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/jeux', label: 'Jeux', icon: '🎮' },
  { href: '/classement', label: 'Classement', icon: '🏆' },
  { href: '/calendrier', label: 'Calendrier', icon: '📅' },
  { href: '/profil', label: 'Profil', icon: '👤' }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="topbar">
        <button className="brand" type="button">
          <span className="brand-main">
            LSOR<span className="brand-accent">-SPORT</span>
          </span>
          <small>ENTRE POTES</small>
        </button>
        <div className="desktop-nav">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-btn${pathname === item.href ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mobile-nav">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-btn${pathname === item.href ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
