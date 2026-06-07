'use client';
import { useState, useEffect, useMemo } from 'react';
import PageLayout from '@/components/PageLayout';
import SidebarFilter, { FilterSection } from '@/components/SidebarFilter';
import TriStateCheckbox from '@/components/TriStateCheckbox';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssuers, setSelectedIssuers] = useState({});

  const toggleFilter = (setFn, item) => {
    setFn(prev => {
      const current = prev[item];
      if (!current) return { ...prev, [item]: 'include' };
      if (current === 'include') return { ...prev, [item]: 'exclude' };
      const next = { ...prev };
      delete next[item];
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedIssuers({});
  };

  useEffect(() => {
    const cachedCards = localStorage.getItem('subTrackerCards');
    const cachedProgress = localStorage.getItem('subTrackerProgress');
    if (cachedCards && cachedProgress) {
      try {
        setCards(JSON.parse(cachedCards));
        setCardProgress(JSON.parse(cachedProgress));
        setLoading(false);
      } catch (e) {}
    }

    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const subCards = data.filter(c => (c.introBonuses || []).some(b => b.type === 'SpendReward' && b.spendRequirement > 0));
          setCards(subCards);
          localStorage.setItem('subTrackerCards', JSON.stringify(subCards));
          
          const requests = subCards.map(card => {
            const sub = card.introBonuses.find(b => b.type === 'SpendReward' && b.spendRequirement > 0);
            if (card.actualAccountId && sub) {
              return { accountId: card.actualAccountId, subSpendReq: sub.spendRequirement };
            }
            return null;
          }).filter(Boolean);

          if (requests.length > 0) {
            fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requests })
            })
            .then(res => res.json())
            .then(results => {
              const newProgress = {};
              subCards.forEach(card => {
                if (card.actualAccountId && results[card.actualAccountId]) {
                  newProgress[card.id] = results[card.actualAccountId];
                } else {
                  newProgress[card.id] = { totalSpend: 0, completionDate: null };
                }
              });
              setCardProgress(prev => {
                const next = { ...prev, ...newProgress };
                localStorage.setItem('subTrackerProgress', JSON.stringify(next));
                return next;
              });
            });
          } else {
            const newProgress = {};
            subCards.forEach(card => {
              newProgress[card.id] = { totalSpend: 0, completionDate: null };
            });
            setCardProgress(prev => {
              const next = { ...prev, ...newProgress };
              localStorage.setItem('subTrackerProgress', JSON.stringify(next));
              return next;
            });
          }
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

  const { filteredInProgress, filteredCompleted, issuers } = useMemo(() => {
    const allIssuers = [...new Set(cards.map(c => c.issuer))].sort();

    const includeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'include');
    const excludeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'exclude');

    const filterFn = (item) => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.issuer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (includeIssuers.length > 0 && !includeIssuers.includes(item.issuer)) return false;
      if (excludeIssuers.length > 0 && excludeIssuers.includes(item.issuer)) return false;
      return true;
    };

    return {
      filteredInProgress: inProgress.filter(filterFn),
      filteredCompleted: completed.filter(filterFn),
      issuers: allIssuers
    };
  }, [inProgress, completed, cards, searchQuery, selectedIssuers]);

  if (loading) return <main><p>Loading tracker...</p></main>;

  return (
    <PageLayout
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
      }
      leftSidebar={
        <SidebarFilter 
          title="Filters" 
          onClearAll={handleClearFilters} 
          showClearAll={Object.keys(selectedIssuers).length > 0 || searchQuery}
        >
          <FilterSection title="Search">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
              style={{ width: '100%', marginBottom: '8px' }}
            />
          </FilterSection>

          <FilterSection title="Issuers" isScrollable>
            {issuers.map(i => (
              <TriStateCheckbox 
                key={i} 
                label={i} 
                state={selectedIssuers[i]} 
                onClick={() => toggleFilter(setSelectedIssuers, i)} 
              />
            ))}
          </FilterSection>
        </SidebarFilter>
      }
    >

      {showInProgress && (
        <section style={{ marginBottom: '40px' }}>
          <h2 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}
            onClick={() => setCollapsedInProgress(!collapsedInProgress)}
          >
            {collapsedInProgress ? '▶' : '▼'} In Progress ({filteredInProgress.length})
          </h2>
          
          {!collapsedInProgress && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {filteredInProgress.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active SUBs to track.</p>}
              
              {filteredInProgress.map(card => {
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
            {collapsedCompleted ? '▶' : '▼'} Completed ({filteredCompleted.length})
          </h2>
          
          {!collapsedCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredCompleted.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No completed SUBs yet.</p>}
              
              {filteredCompleted.map(card => (
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
    </PageLayout>
  );
}
