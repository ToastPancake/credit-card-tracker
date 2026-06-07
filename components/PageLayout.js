'use client';

export default function PageLayout({ header, leftSidebar, rightSidebar, children, emptyState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {header}

      {emptyState ? emptyState : (
        <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* LEFT SIDEBAR */}
          {leftSidebar && (
            <div className="glass-panel" style={{ flex: '0 0 280px', position: 'sticky', top: '24px', width: '100%' }}>
              {leftSidebar}
            </div>
          )}

          {/* MAIN CONTENT */}
          <div style={{ flex: '1 1 500px', minWidth: '400px' }}>
            {children}
          </div>

          {/* RIGHT SIDEBAR */}
          {rightSidebar && (
            <div className="glass-panel" style={{ flex: '0 0 320px', position: 'sticky', top: '24px', width: '100%', ...rightSidebar.style }}>
              {rightSidebar.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
