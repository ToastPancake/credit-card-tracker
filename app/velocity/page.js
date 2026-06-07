'use client';
import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';

function getNextDropOffDate(cards, limit, months) {
  if (cards.length < limit) return 'Available Now';
  // Cards are sorted newest first. The card that will drop off first is the oldest one in the list.
  const oldestSlotCard = cards[limit - 1]; // the 5th card if limit is 5
  if (!oldestSlotCard || !oldestSlotCard.openDate) return 'Unknown';
  
  const d = new Date(oldestSlotCard.openDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export default function VelocityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editBusiness, setEditBusiness] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch('/api/velocity')
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (card) => {
    setEditingId(card.id);
    setEditDate(card.openDate || '');
    setEditBusiness(!!card.isBusiness);
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch('/api/velocity/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, openDate: editDate, isBusiness: editBusiness })
      });
      if (res.ok) {
        setEditingId(null);
        loadData(); // Reload to recalculate rules
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <main><p>Analyzing your card history...</p></main>;
  if (error) return <main><p>Error: {error}</p></main>;
  if (!data) return null;

  const { chase524, amex290, citi865 } = data.rules;

  return (
    <PageLayout
      header={<h1 className="page-title">Velocity & Application Rules</h1>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Chase 5/24 Panel */}
        <div className="glass-panel" style={{ borderTop: `4px solid ${chase524.count >= 5 ? '#ef4444' : '#3b82f6'}` }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            Chase 5/24 Rule
            <span style={{ 
              background: chase524.count >= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', 
              color: chase524.count >= 5 ? '#ef4444' : '#3b82f6',
              padding: '4px 12px', borderRadius: '12px', fontSize: '1rem'
            }}>
              {chase524.count} / 5
            </span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Under 5 personal cards opened across all issuers in the last 24 months.
          </p>
          <div style={{ marginBottom: '16px' }}>
            {chase524.cards.slice(0, 5).map(c => (
              <div key={c.id} style={{ fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '4px 0' }}>
                <span>{c.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.openDate}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
            Next slot opens: <span style={{ color: 'var(--text-main)' }}>{getNextDropOffDate(chase524.cards, 5, 24)}</span>
          </div>
        </div>

        {/* Amex 2/90 Panel */}
        <div className="glass-panel" style={{ borderTop: `4px solid ${amex290.count >= 2 ? '#ef4444' : '#10b981'}` }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            Amex 2/90 Rule
            <span style={{ 
              background: amex290.count >= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
              color: amex290.count >= 2 ? '#ef4444' : '#10b981',
              padding: '4px 12px', borderRadius: '12px', fontSize: '1rem'
            }}>
              {amex290.count} / 2
            </span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Maximum 2 American Express credit cards approved in a rolling 90-day period.
          </p>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: amex290.count >= 2 ? '#ef4444' : '#10b981' }}>
            {amex290.count >= 2 ? 'Cooldown Period' : 'Safe to Apply'}
          </div>
        </div>

        {/* Citi 8/65 Panel */}
        <div className="glass-panel" style={{ borderTop: `4px solid ${(citi865.count8 >= 1 || citi865.count65 >= 2) ? '#ef4444' : '#10b981'}` }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
            Citi 8/65 Rule
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Max 1 Citi card every 8 days, and max 2 Citi cards every 65 days.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span>Last 8 Days:</span>
            <strong style={{ color: citi865.count8 >= 1 ? '#ef4444' : '#10b981' }}>{citi865.count8} / 1</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.875rem' }}>
            <span>Last 65 Days:</span>
            <strong style={{ color: citi865.count65 >= 2 ? '#ef4444' : '#10b981' }}>{citi865.count65} / 2</strong>
          </div>
          
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: (citi865.count8 >= 1 || citi865.count65 >= 2) ? '#ef4444' : '#10b981' }}>
            {(citi865.count8 >= 1 || citi865.count65 >= 2) ? 'Cooldown Period' : 'Safe to Apply'}
          </div>
        </div>

      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Application Timeline</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.cards.map(card => (
          <div key={card.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderLeft: `4px solid ${card.color || 'var(--primary)'}` }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
              <div style={{ width: '150px' }}>
                {editingId === card.id ? (
                  <input 
                    type="date" 
                    value={editDate} 
                    onChange={e => setEditDate(e.target.value)}
                    className="input-glass"
                    style={{ padding: '4px 8px', width: '100%' }}
                  />
                ) : (
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: card.openDate ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {card.openDate || 'Unknown'}
                  </span>
                )}
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{card.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{card.issuer}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input 
                  type="checkbox" 
                  checked={editingId === card.id ? editBusiness : !!card.isBusiness}
                  onChange={e => {
                    if (editingId === card.id) setEditBusiness(e.target.checked);
                  }}
                  disabled={editingId !== card.id}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                Business Card
              </label>

              {editingId === card.id ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" onClick={() => handleSave(card.id)} disabled={saving}>Save</button>
                  <button className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <button className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={() => handleEdit(card)}>Edit</button>
              )}
            </div>

          </div>
        ))}
      </div>

    </PageLayout>
  );
}
