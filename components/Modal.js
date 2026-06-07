'use client';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '800px' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }} onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth, 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          border: '1px solid var(--primary)',
          background: 'rgba(15, 23, 42, 0.95)',
          padding: 0
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            lineHeight: 1,
            padding: '0 8px'
          }}>&times;</button>
        </div>
        <div className="custom-scrollbar" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
