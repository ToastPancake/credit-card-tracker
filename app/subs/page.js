'use client';
import { useState, useEffect, useMemo } from 'react';

function getElapsedTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${(diffDays / 365).toFixed(1)} years ago`;
}

function formatReward(rewardStr) {
  if (!rewardStr) return '';
  const lower = rewardStr.toLowerCase();
  if (lower.includes('dollars') || lower.includes('cashback')) {
    const amount = rewardStr.replace(/dollars/i, '').replace(/cashback/i, '').trim();
    return `$${amount}`;
  }
  return rewardStr;
}

export default function SubTrackerPage() {
  const [cards, setCards] = useState([]);
  const [cardProgress, setCardProgress] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [showCompleted, setShowCompleted] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [collapsedInProgress, setCollapsedInProgress] = useState(false);
  const [collapsedCompleted, setCollapsedCompleted] = useState(false);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const subCards = data.filter(c => (c.introBonuses || []).some(b => b.type === 'SpendReward' && b.spendRequirement > 0));
          setCards(subCards);
          
          subCards.forEach(card => {
            const sub = card.introBonuses.find(b => b.type === 'SpendReward' && b.spendRequirement > 0);
            if (card.actualAccountId && sub) {
              fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: card.actualAccountId, subSpendReq: sub.spendRequirement })
              })
              .then(res => res.json())
              .then(tData => {
                setCardProgress(prev => ({
                  ...prev,
                  [card.id]: {
                    totalSpend: tData.totalSpend || 0,
                    completionDate: tData.completionDate || null
                  }
                }));
              });
            } else {
              setCardProgress(prev => ({
                ...prev,
                [card.id]: { totalSpend: 0, completionDate: null }
              }));
            }
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const { inProgress, completed } = useMemo(() => {
    const ip = [];
    const comp = [];
    cards.forEach(card => {
      const sub = card.introBonuses.find(b => b.type === 'SpendReward' && b.spendRequirement > 0);
      const progress = cardProgress[card.id];
      const isCompleted = progress && progress.totalSpend >= sub.spendRequirement;
      if (isCompleted) comp.push({ ...card, ...progress, sub });
      else ip.push({ ...card, ...progress, sub });
    });
    comp.sort((a, b) => new Date(b.completionDate || 0) - new Date(a.completionDate || 0));
    return { inProgress: ip, completed: comp };
  }, [cards, cardProgress]);

  if (loading) return <main><p>Loading tracker...</p></main>;

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>SUB Tracker</h1>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          <label className="toggle-label-wrap">
            <div className="toggle-switch">
              <input type="checkbox" checked={showInProgress} onChange={e => setShowInProgress(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
            In Progress
          </label>
          <label className="toggle-label-wrap">
            <div className="toggle-switch">
              <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
            Completed
          </label>
        </div>
      </div>

      {showInProgress && (
        <section style={{ marginBottom: '40px' }}>
          <h2 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}
            onClick={() => setCollapsedInProgress(!collapsedInProgress)}
          >
            {collapsedInProgress ? '▶' : '▼'} In Progress ({inProgress.length})
          </h2>
          
          {!collapsedInProgress && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {inProgress.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active SUBs to track.</p>}
              
              {inProgress.map(card => {
                const spend = card.totalSpend || 0;
                const percent = Math.min(100, Math.round((spend / card.sub.spendRequirement) * 100)) || 0;
                
                return (
                  <div key={card.id} className="glass-panel" style={{ borderTop: `4px solid ${card.color || 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{card.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{card.issuer}</p>
                      </div>
                      {card.sub.rewardAmount && (
                        <div style={{ background: 'rgba(255, 215, 0, 0.1)', color: '#fbbf24', padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                          {formatReward(card.sub.rewardAmount)}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                        <span>${spend.toLocaleString()} spent</span>
                        <span>Goal: ${card.sub.spendRequirement.toLocaleString()}</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: card.color, transition: 'width 1s ease' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                        <span>{percent}% Complete</span>
                        {card.sub.deadline && <span>Deadline: {card.sub.deadline}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {showCompleted && (
        <section style={{ opacity: 0.8 }}>
          <h2 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}
            onClick={() => setCollapsedCompleted(!collapsedCompleted)}
          >
            {collapsedCompleted ? '▶' : '▼'} Completed ({completed.length})
          </h2>
          
          {!collapsedCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completed.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No completed SUBs yet.</p>}
              
              {completed.map(card => (
                <div key={card.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderLeft: `4px solid #22c55e` }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{card.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 'normal' }}>({card.issuer})</span></h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <span>Completed on: <strong style={{ color: 'var(--text-main)' }}>{card.completionDate || 'Unknown'}</strong></span>
                      <span>({getElapsedTime(card.completionDate)})</span>
                    </div>
                  </div>
                  
                  {card.sub.rewardAmount && (
                    <div style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 'bold' }}>
                      {formatReward(card.sub.rewardAmount)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
