'use client';
import { useState } from 'react';

export default function CardList({ 
  cards, 
  actualAccounts = [], 
  onEdit, 
  onDelete, 
  headerRight,
  showNoCardsMessage = true,
  noCardsMessage = "No cards found."
}) {
  const [viewMode, setViewMode] = useState('condensed');
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpanded = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', width: '100%' }}>
      {/* Controls row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
          <button style={{ background: viewMode === 'super-condensed' ? 'var(--primary)' : 'transparent', color: viewMode === 'super-condensed' ? 'white' : 'var(--text-muted)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }} onClick={() => setViewMode('super-condensed')}>Super Condensed</button>
          <button style={{ background: viewMode === 'condensed' ? 'var(--primary)' : 'transparent', color: viewMode === 'condensed' ? 'white' : 'var(--text-muted)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }} onClick={() => setViewMode('condensed')}>Condensed</button>
          <button style={{ background: viewMode === 'expanded' ? 'var(--primary)' : 'transparent', color: viewMode === 'expanded' ? 'white' : 'var(--text-muted)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }} onClick={() => { setViewMode('expanded'); setExpandedCards({}); }}>Expanded</button>
        </div>
        
        {headerRight && <div>{headerRight}</div>}
      </div>

      {cards.length === 0 && showNoCardsMessage && (
        <p style={{ color: 'var(--text-muted)' }}>{noCardsMessage}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cards.map(card => {
          const actualAcc = actualAccounts.find(a => a.id === card.actualAccountId);
          const isExpanded = viewMode === 'expanded' || expandedCards[card.id];
          const isSuperCondensed = viewMode === 'super-condensed' && !isExpanded;
          const isCondensed = viewMode === 'condensed' && !isExpanded;

          return (
            <div key={card.id} className="glass-panel" style={{ borderLeft: `4px solid ${card.color || 'var(--primary)'}`, cursor: !isExpanded ? 'pointer' : 'default', padding: isSuperCondensed ? '16px' : '24px' }} onClick={() => { if (!isExpanded) toggleCardExpanded(card.id); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isSuperCondensed ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {!isExpanded && viewMode !== 'expanded' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>▼</span>}
                  {isExpanded && viewMode !== 'expanded' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleCardExpanded(card.id); }}>▲</span>}
                  
                  <div>
                    <h3 style={{ fontSize: isSuperCondensed ? '1rem' : '1.1rem', marginBottom: isSuperCondensed ? 0 : '4px' }}>
                      {card.name} 
                      {!isSuperCondensed && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 'normal', marginLeft: '8px' }}>({card.issuer})</span>}
                    </h3>
                    
                    {!isSuperCondensed && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Linked: <strong style={{ color: 'var(--text-main)' }}>{actualAcc ? actualAcc.name : 'None'}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional prominent multiplier for category pages */}
                {card.highlightMultiplier ? (
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '16px', fontWeight: 'bold', color: '#fbbf24', fontSize: isSuperCondensed ? '1rem' : '1.1rem' }}>
                    {card.highlightMultiplier}x
                  </div>
                ) : (
                  isSuperCondensed && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{actualAcc ? actualAcc.name : 'Unlinked'}</div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {isExpanded && (onEdit || onDelete) && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {onEdit && <button className="btn-primary" style={{ background: 'var(--surface-hover)', padding: '6px 12px', fontSize: '0.875rem' }} onClick={(e) => { e.stopPropagation(); onEdit(card); }}>Edit</button>}
                      {onDelete && <button className="btn-primary" style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.875rem' }} onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}>Delete</button>}
                    </div>
                  )}
                  {isSuperCondensed && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      color: card.annualFee > 0 ? '#f87171' : '#10b981', 
                      background: card.annualFee > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${card.annualFee > 0 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      padding: '4px 10px', 
                      borderRadius: '12px'
                    }}>
                      {card.annualFee > 0 ? `$${card.annualFee} AF` : 'No AF'}
                    </div>
                  )}
                </div>
              </div>

              {!isSuperCondensed && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: isExpanded ? '16px' : '12px', minHeight: '28px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                    {(card.categories && card.categories.length > 0) && card.categories.map((c, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {c.categoryName}: {c.multiplier}x
                      </span>
                    ))}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    color: card.annualFee > 0 ? '#f87171' : '#10b981', 
                    background: card.annualFee > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${card.annualFee > 0 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    padding: '4px 10px', 
                    borderRadius: '12px',
                    marginLeft: '16px',
                    whiteSpace: 'nowrap'
                  }}>
                    {card.annualFee > 0 ? `$${card.annualFee} AF` : 'No AF'}
                  </div>
                </div>
              )}

              {isExpanded && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Additional Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Issuer: </span>{card.issuer}</div>
                      
                      <div><span style={{ color: 'var(--text-muted)' }}>Annual Fee: </span><strong style={{ color: 'var(--text-main)' }}>{card.annualFee > 0 ? `$${card.annualFee}` : '$0'}</strong></div>
                      
                      {/* Quick Links */}
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Quick Links:</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={`https://www.doctorofcredit.com/?s=${encodeURIComponent(card.name)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.75rem' }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Search DoC
                          </a>
                          <a href={`https://www.uscreditcardguide.com/en/?s=${encodeURIComponent(card.name)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.75rem' }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Search USCCG
                          </a>
                          {card.issuerLoginUrl && (
                            <a href={card.issuerLoginUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.75rem' }}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              {card.issuer} Portal
                            </a>
                          )}
                          {card.productUrl && (
                            <a href={card.productUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.75rem' }}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              Product Page
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Intro Offers: </span>
                      {(!card.introBonuses || card.introBonuses.length === 0) ? 'None' : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                          {card.introBonuses.map(bonus => {
                            let text = bonus.type;
                            if (bonus.type === 'SpendReward') text = `${bonus.rewardAmount} after $${bonus.spendRequirement}`;
                            if (bonus.type === 'GlobalMultiplierMatch') text = `Match all categories by ${bonus.modifierValue}x`;
                            if (bonus.type === 'GlobalFlatIncrease') text = `+${bonus.modifierValue}x on all categories`;
                            if (bonus.type === 'CategoryFlatIncrease') text = `+${bonus.modifierValue}x on category`;
                            if (bonus.type === 'CategoryOverride') text = `${bonus.modifierValue}x on category`;
                            if (bonus.type === 'FreeItem' || bonus.type === 'ReducedAPR' || bonus.type === 'FeeFreeTransfer') text = bonus.description || bonus.type;
                            
                            return (
                              <div key={bonus.id} style={{ color: '#fbbf24' }}>
                                • {text} {bonus.deadline ? `(Ends ${bonus.deadline})` : ''}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
