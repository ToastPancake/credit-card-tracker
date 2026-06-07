'use client';

export default function TriStateCheckbox({ label, state, onClick }) {
  let icon = null;
  let bg = 'transparent';
  let border = '1px solid var(--border)';
  if (state === 'include') {
    bg = 'var(--primary)';
    border = '1px solid var(--primary)';
    icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;
  } else if (state === 'exclude') {
    bg = '#ef4444';
    border = '1px solid #ef4444';
    icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
  }

  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 0', userSelect: 'none' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: bg, border: border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ color: state ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.2' }}>{label}</span>
    </div>
  );
}
