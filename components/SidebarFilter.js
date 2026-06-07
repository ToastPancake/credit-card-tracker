'use client';

export default function SidebarFilter({ title = 'Filters', onClearAll, showClearAll, children }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          {title}
        </h3>
        {showClearAll && (
          <button onClick={onClearAll} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {children}
      </div>
    </>
  );
}

export function FilterSection({ title, children, isScrollable = false }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{title}</label>
      {isScrollable ? (
        <div className="custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
