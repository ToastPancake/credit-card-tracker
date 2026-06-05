'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DataLayout({ children }) {
  const pathname = usePathname();

  return (
    <main>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>Data Management</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        <Link href="/data/issuers" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/issuers') ? 'var(--primary)' : 'transparent', color: pathname.includes('/issuers') ? 'white' : 'var(--text-muted)' }}>
          Issuers
        </Link>
        <Link href="/data/categories" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/categories') ? 'var(--primary)' : 'transparent', color: pathname.includes('/categories') ? 'white' : 'var(--text-muted)' }}>
          Categories
        </Link>
        <Link href="/data/templates" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/templates') ? 'var(--primary)' : 'transparent', color: pathname.includes('/templates') ? 'white' : 'var(--text-muted)' }}>
          Card Templates
        </Link>
      </div>

      {children}
    </main>
  );
}
