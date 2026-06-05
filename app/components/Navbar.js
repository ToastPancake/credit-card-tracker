'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: 'Wallet', path: '/' },
    { name: 'Credits', path: '/credits' },
    { name: 'SUB Tracker', path: '/subs' },
    { name: 'Cards', path: '/accounts' },
    { name: 'Data', path: '/data' },
  ];

  return (
    <nav style={{
      display: 'flex',
      gap: '24px',
      padding: '16px 32px',
      background: 'rgba(20, 20, 20, 0.7)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: 'auto', color: 'var(--text-main)' }}>
        💳 Tracker
      </div>
      {links.map(link => {
        const isActive = link.path === '/' ? pathname === '/' : pathname.startsWith(link.path);
        return (
          <Link key={link.path} href={link.path} style={{
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontWeight: isActive ? '600' : '400',
            borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'all 0.2s ease'
          }}>
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
