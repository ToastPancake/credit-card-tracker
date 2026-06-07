'use client';
import { useState, useEffect, useMemo } from 'react';
import Dropdown from '@/components/Dropdown';
import PageLayout from '@/components/PageLayout';
import SidebarFilter, { FilterSection } from '@/components/SidebarFilter';
import TriStateCheckbox from '@/components/TriStateCheckbox';

function getCurrentPeriod(credit, date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  
  if (credit.resetType === 'Calendar') {
    if (credit.frequency === 'Monthly') {
      return `${y}-${m.toString().padStart(2, '0')}`;
    }
    if (credit.frequency === 'Quarterly') {
      const q = Math.ceil(m / 3);
      return `${y}-Q${q}`;
    }
    if (credit.frequency === 'Semi-Annual') {
      const h = m <= 6 ? 1 : 2;
      return `${y}-H${h}`;
    }
    if (credit.frequency === 'Annual') {
      return `${y}`;
    }
    if (credit.frequency === 'Every 4 Years') {
      return `${Math.floor(y / 4) * 4}-${Math.floor(y / 4) * 4 + 3}`;
    }
  } else if (credit.resetType === 'Custom' && credit.resetAnchorDate) {
    const parts = credit.resetAnchorDate.split('-');
    if (parts.length === 2) {
      const [anchorM, anchorD] = parts.map(Number);
      const anchorThisYear = new Date(y, anchorM - 1, anchorD);
      let start;
      if (date < anchorThisYear) {
        start = new Date(y - 1, anchorM - 1, anchorD);
      } else {
        start = new Date(y, anchorM - 1, anchorD);
      }

      if (credit.frequency === 'Monthly') {
        let cycleStart = new Date(y, m - 1, anchorD);
        if (date < cycleStart) {
          cycleStart = new Date(y, m - 2, anchorD);
        }
        return `Custom_${cycleStart.getFullYear()}-${(cycleStart.getMonth()+1).toString().padStart(2, '0')}`;
      }
      
      return `Custom_${start.getFullYear()}-${(start.getMonth()+1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}_${credit.frequency}`;
    }
  }
  
  return `${y}-Unknown`;
}

function formatPeriodLabel(periodStr) {
  if (periodStr.match(/^\d{4}-\d{2}$/)) {
    const [y, m] = periodStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m)-1]} ${y}`;
  }
  if (periodStr.match(/^\d{4}-Q\d$/)) {
    return periodStr.replace('-', ' ');
  }
  if (periodStr.match(/^\d{4}-H\d$/)) {
    return periodStr.replace('-', ' ');
  }
  if (periodStr.match(/^\d{4}$/)) {
    return `Year ${periodStr}`;
  }
  if (periodStr.startsWith('Custom_')) {
    return periodStr.replace('Custom_', '').replace(/_/g, ' ');
  }
  return periodStr;
}

export default function CreditsPage() {
  const [cards, setCards] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFrequencies, setSelectedFrequencies] = useState({});
  const [selectedTypes, setSelectedTypes] = useState({});

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
    setStatusFilter('all');
    setSelectedFrequencies({});
    setSelectedTypes({});
  };

  const fetchData = async () => {
    try {
      const [cardsRes, usageRes] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/credits/usage')
      ]);
      const cardsData = await cardsRes.json();
      const usageData = await usageRes.json();
      setCards(cardsData);
      setUsages(usageData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUsage = async (credit, period, currentIsUsed) => {
    try {
      const res = await fetch('/api/credits/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId: credit.id,
          period: period,
          isFullyUsed: !currentIsUsed,
          usedAmount: !currentIsUsed ? credit.amount : 0
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePartialUpdate = async (credit, period, usedAmount) => {
    try {
      const res = await fetch('/api/credits/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId: credit.id,
          period: period,
          isFullyUsed: parseFloat(usedAmount) >= credit.amount,
          usedAmount: parseFloat(usedAmount) || 0
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { filteredGrouped, uniqueTypes, uniqueFrequencies, hasAnyCredits } = useMemo(() => {
    const allCredits = [];
    cards.forEach(card => {
      if (card.credits && Array.isArray(card.credits)) {
        card.credits.forEach(credit => {
          allCredits.push({ ...credit, card });
        });
      }
    });

    const grouped = {
      'Monthly': [],
      'Quarterly': [],
      'Semi-Annual': [],
      'Annual': [],
      'Every 4 Years': []
    };

    allCredits.forEach(credit => {
      if (!grouped[credit.frequency]) grouped[credit.frequency] = [];
      const period = getCurrentPeriod(credit);
      const usage = usages.find(u => u.creditId === credit.id && u.period === period);
      grouped[credit.frequency].push({
        ...credit,
        currentPeriod: period,
        usage: usage || { usedAmount: 0, isFullyUsed: false }
      });
    });

    const uTypes = [...new Set(allCredits.map(c => c.type || 'General'))].sort();
    const uFreqs = [...new Set(allCredits.map(c => c.frequency))].sort();

    const res = {};
    const includeFreq = Object.keys(selectedFrequencies).filter(k => selectedFrequencies[k] === 'include');
    const excludeFreq = Object.keys(selectedFrequencies).filter(k => selectedFrequencies[k] === 'exclude');
    const includeType = Object.keys(selectedTypes).filter(k => selectedTypes[k] === 'include');
    const excludeType = Object.keys(selectedTypes).filter(k => selectedTypes[k] === 'exclude');

    Object.keys(grouped).forEach(freq => {
      res[freq] = grouped[freq].filter(item => {
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        if (statusFilter === 'used' && !item.usage.isFullyUsed) return false;
        if (statusFilter === 'unused' && item.usage.isFullyUsed) return false;

        if (includeFreq.length > 0 && !includeFreq.includes(item.frequency)) return false;
        if (excludeFreq.length > 0 && excludeFreq.includes(item.frequency)) return false;

        const cType = item.type || 'General';
        if (includeType.length > 0 && !includeType.includes(cType)) return false;
        if (excludeType.length > 0 && excludeType.includes(cType)) return false;

        return true;
      });
    });
    
    return { filteredGrouped: res, uniqueTypes: uTypes, uniqueFrequencies: uFreqs, hasAnyCredits: allCredits.length > 0 };
  }, [cards, usages, searchQuery, statusFilter, selectedFrequencies, selectedTypes]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading credits...</div>;

  return (
    <PageLayout
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Coupons & Credits</h1>
        </div>
      }
      emptyState={!hasAnyCredits ? (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No credits defined. Go to the Cards tab to edit a card and add coupons or statement credits!
        </div>
      ) : null}
      leftSidebar={
        <SidebarFilter 
          title="Filters" 
          onClearAll={handleClearFilters} 
          showClearAll={Object.keys(selectedFrequencies).length > 0 || Object.keys(selectedTypes).length > 0 || statusFilter !== 'all' || searchQuery}
        >
          <FilterSection title="Search">
            <input
              type="text"
              placeholder="Search credits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
              style={{ width: '100%', marginBottom: '8px' }}
            />
          </FilterSection>

          <FilterSection title="Status">
            <Dropdown
              options={[
                { label: 'All', value: 'all' },
                { label: 'Unused', value: 'unused' },
                { label: 'Used', value: 'used' }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </FilterSection>

          <FilterSection title="Frequency" isScrollable>
            {uniqueFrequencies.map(f => (
              <TriStateCheckbox 
                key={f} 
                label={f} 
                state={selectedFrequencies[f]} 
                onClick={() => toggleFilter(setSelectedFrequencies, f)} 
              />
            ))}
          </FilterSection>

          <FilterSection title="Type" isScrollable>
            {uniqueTypes.map(t => (
              <TriStateCheckbox 
                key={t} 
                label={t} 
                state={selectedTypes[t]} 
                onClick={() => toggleFilter(setSelectedTypes, t)} 
              />
            ))}
          </FilterSection>
        </SidebarFilter>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {Object.keys(filteredGrouped).map(freq => {
          const groupCredits = filteredGrouped[freq];
          if (groupCredits.length === 0) return null;

            return (
              <div key={freq}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{freq} Credits</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {groupCredits.map((item, idx) => {
                    const isUsed = item.usage.isFullyUsed;
                    return (
                      <div key={idx} className="glass-panel" style={{ 
                        padding: '20px', 
                        opacity: isUsed ? 0.5 : 1,
                        transition: 'opacity 0.2s ease',
                        borderLeft: `4px solid ${item.card.color || 'var(--primary)'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                              {item.card.name}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: isUsed ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {item.name}
                            </div>
                          </div>
                          <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.25rem' }}>
                            ${item.amount.toFixed(2)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Current Period</span>
                            {formatPeriodLabel(item.currentPeriod)}
                          </div>
                          
                          {item.allowPartial ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Used: $</span>
                              <input 
                                className="input-glass"
                                type="number" 
                                step="0.01"
                                style={{ width: '80px', padding: '6px 10px' }}
                                value={item.usage.usedAmount || ''}
                                placeholder="0.00"
                                onChange={(e) => handlePartialUpdate(item, item.currentPeriod, e.target.value)}
                              />
                            </div>
                          ) : (
                            <button 
                              className={`btn-${isUsed ? 'secondary' : 'primary'}`}
                              onClick={() => handleToggleUsage(item, item.currentPeriod, isUsed)}
                            >
                              {isUsed ? 'Used' : 'Mark as Used'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
    </PageLayout>
  );
}
