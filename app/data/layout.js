'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DataLayout({ children }) {
  const pathname = usePathname();

  return (
    <main>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>Data Management</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          <Link href="/data/issuers" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/issuers') ? 'var(--primary)' : 'transparent', color: pathname.includes('/issuers') ? 'white' : 'var(--text-muted)' }}>
            Issuers
          </Link>
          <Link href="/data/categories" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/categories') ? 'var(--primary)' : 'transparent', color: pathname.includes('/categories') ? 'white' : 'var(--text-muted)' }}>
            Categories
          </Link>
          <Link href="/data/templates" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/templates') ? 'var(--primary)' : 'transparent', color: pathname.includes('/templates') ? 'white' : 'var(--text-muted)' }}>
            Card Templates
          </Link>
          <Link href="/data/resources" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: pathname.includes('/resources') ? 'var(--primary)' : 'transparent', color: pathname.includes('/resources') ? 'white' : 'var(--text-muted)' }}>
            Resources
          </Link>
        </div>

        <button 
          onClick={async () => {
            try {
              const res = await fetch('/api/export-seed');
              const data = await res.json();
              if (res.ok) {
                alert(data.message + '\n\nYou can now commit data/seed.json to GitHub!');
              } else {
                alert('Export failed: ' + data.error);
              }
            } catch (err) {
              alert('Export failed: ' + err.message);
            }
          }}
          className="primary-button" 
          style={{ background: 'var(--success, #16a34a)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export to Seed
        </button>
      </div>

      {children}
    </main>
  );
}
