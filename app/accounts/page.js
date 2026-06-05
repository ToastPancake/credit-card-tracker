'use client';
import { useState, useEffect } from 'react';
import Dropdown from '@/components/Dropdown';
import CardList from '@/components/CardList';

const BONUS_TYPES = [
  { label: 'Standard SUB', value: 'SpendReward' },
  { label: 'Global Multiplier Match', value: 'GlobalMultiplierMatch' },
  { label: 'Global Flat Increase', value: 'GlobalFlatIncrease' },
  { label: 'Category Flat Increase', value: 'CategoryFlatIncrease' },
  { label: 'Category Override', value: 'CategoryOverride' },
  { label: 'Free Item', value: 'FreeItem' },
  { label: 'Reduced APR', value: 'ReducedAPR' },
  { label: 'Fee-Free Transfer', value: 'FeeFreeTransfer' }
];

export default function AccountsPage() {
  const [actualAccounts, setActualAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [commonCategories, setCommonCategories] = useState([]);
  
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', issuer: '', actualAccountId: '', productUrl: '',
    color: '#4a61bd', categories: [], introBonuses: [], credits: [],
    quarterlyCategories: { Q1: [], Q2: [], Q3: [], Q4: [] }
  });

  const fetchData = () => {
    fetch('/api/cards').then(res => res.json()).then(data => { if (Array.isArray(data)) setCards(data); });
    fetch('/api/data/templates').then(res => res.json()).then(setTemplates);
    fetch('/api/data/issuers').then(res => res.json()).then(setIssuers);
    fetch('/api/data/categories').then(res => res.json()).then(setCommonCategories);

    setLoadingAccounts(true);
    setAccountsError(null);
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => {
        if (data.error) setAccountsError(data.error);
        else if (Array.isArray(data)) setActualAccounts(data);
      })
      .catch(err => setAccountsError(err.message))
      .finally(() => setLoadingAccounts(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleTemplateSelect = (val) => {
    const templateId = val;
    if (!templateId) return;
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        issuer: template.issuer,
        color: template.color,
        productUrl: template.productUrl || '',
        quarterlyCategories: template.quarterlyCategories || { Q1: [], Q2: [], Q3: [], Q4: [] },
        categories: [...template.categories],
        credits: template.credits ? [...template.credits] : []
      }));
    }
  };

  const addCategory = () => {
    setFormData(prev => ({ ...prev, categories: [...prev.categories, { categoryName: '', multiplier: 1 }] }));
  };
  const updateCategory = (index, field, value) => {
    const newCats = [...formData.categories];
    newCats[index][field] = value;
    setFormData(prev => ({ ...prev, categories: newCats }));
  };
  const removeCategory = (index) => {
    setFormData(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  };

  const addIntroBonus = () => {
    setFormData(prev => ({
      ...prev,
      introBonuses: [...prev.introBonuses, { type: 'SpendReward', description: '', deadline: '', spendRequirement: 0, subRewardAmount: '', subRewardType: 'Points', modifierValue: '', categoryId: '' }]
    }));
  };
  const updateIntroBonus = (index, field, value) => {
    const newBonuses = [...formData.introBonuses];
    newBonuses[index][field] = value;
    setFormData(prev => ({ ...prev, introBonuses: newBonuses }));
  };
  const removeIntroBonus = (index) => {
    setFormData(prev => ({ ...prev, introBonuses: prev.introBonuses.filter((_, i) => i !== index) }));
  };

  const addCredit = () => {
    setFormData(prev => ({
      ...prev,
      credits: [...prev.credits, { name: '', amount: 0, allowPartial: false, frequency: 'Annual', resetType: 'Calendar', resetAnchorDate: '' }]
    }));
  };
  const updateCredit = (index, field, value) => {
    const newCredits = [...formData.credits];
    newCredits[index][field] = value;
    setFormData(prev => ({ ...prev, credits: newCredits }));
  };
  const removeCredit = (index) => {
    setFormData(prev => ({ ...prev, credits: prev.credits.filter((_, i) => i !== index) }));
  };

  const updateQuarterly = (q, val) => {
    setFormData(prev => ({ ...prev, quarterlyCategories: { ...prev.quarterlyCategories, [q]: val } }));
  };

  const handleEdit = (card) => {
    setEditingId(card.id);

    setFormData({
      name: card.name || '', issuer: card.issuer || '', actualAccountId: card.actualAccountId || '', productUrl: card.productUrl || '',
      color: card.color || '#4a61bd', categories: card.categories || [],
      quarterlyCategories: card.quarterlyCategories || { Q1: [], Q2: [], Q3: [], Q4: [] },
      credits: card.credits || [],
      introBonuses: card.introBonuses ? card.introBonuses.map(ib => {
         let subRewardAmount = '';
         let subRewardType = 'Points';
         if (ib.type === 'SpendReward' && ib.rewardAmount) {
           const lower = ib.rewardAmount.toLowerCase();
           if (lower.includes('dollars') || lower.includes('cashback')) {
             subRewardType = 'Dollars';
             subRewardAmount = ib.rewardAmount.replace(/dollars/i, '').replace(/cashback/i, '').trim();
           } else {
             subRewardType = 'Points';
             subRewardAmount = ib.rewardAmount.replace(/points/i, '').trim();
           }
         }
         return { ...ib, subRewardAmount, subRewardType };
      }) : []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    const res = await fetch(`/api/cards?id=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); if (editingId === id) cancelEdit(); }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', issuer: '', actualAccountId: '', productUrl: '', color: '#4a61bd', categories: [], introBonuses: [], credits: [], quarterlyCategories: { Q1: [], Q2: [], Q3: [], Q4: [] } });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSuccess(false);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/cards?id=${editingId}` : '/api/cards';
    
    const submitData = {
      ...formData,
      introBonuses: formData.introBonuses.map(ib => {
        const payload = { ...ib };
        if (ib.type === 'SpendReward') {
          payload.rewardAmount = ib.subRewardAmount ? `${ib.subRewardAmount} ${ib.subRewardType}` : '';
        }
        delete payload.subRewardAmount;
        delete payload.subRewardType;
        return payload;
      }),
      credits: formData.credits.map(c => ({
        ...c,
        amount: parseFloat(c.amount) || 0,
        resetAnchorDate: c.resetType === 'Calendar' ? '' : c.resetAnchorDate
      }))
    };
    
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) });
    if (res.ok) {
      setIsSuccess(true);
      cancelEdit();
      fetchData();
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  const hasRotating = formData.categories.some(c => c.categoryName.startsWith('Quarterly Rotating'));
  const categoryOptions = commonCategories.map(c => ({ label: c.name, value: c.id }));

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Cards</h1>
      </div>

      {showForm && (
        <form className="glass-panel" onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', marginBottom: '40px', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Edit Card' : 'Add New Card'}</h3>
            {!editingId && (
              <Dropdown 
                options={templates.map(t => ({ label: t.name, value: t.id }))}
                value=""
                onChange={handleTemplateSelect}
                placeholder="-- Load from Template --"
              />
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Card Name</label>
              <input className="input-glass" placeholder="e.g. Sapphire Reserve" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Issuer</label>
              <Dropdown 
                options={issuers.map(i => i.name)}
                value={formData.issuer}
                onChange={val => setFormData({...formData, issuer: val})}
                placeholder="-- Select Issuer --"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Product Page URL (Optional)</label>
              <input className="input-glass" type="url" placeholder="https://..." value={formData.productUrl} onChange={e => setFormData({...formData, productUrl: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Link to ActualBudget</label>
              {loadingAccounts ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading ActualBudget accounts...</p> : 
               accountsError ? <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>{accountsError}. (Check .env.local)</p> : 
              (
                <Dropdown 
                  options={[
                    { label: '-- No Account Linked --', value: '' },
                    ...actualAccounts.map(acc => ({ label: acc.type ? `${acc.name} (${acc.type})` : acc.name, value: acc.id }))
                  ]}
                  value={formData.actualAccountId}
                  onChange={val => setFormData({...formData, actualAccountId: val})}
                  placeholder="-- No Account Linked --"
                />
              )}
            </div>
          </div>
            
          <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Category Multipliers</h4>
              <button type="button" onClick={addCategory} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Category</button>
            </div>
            {formData.categories.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No categories added. Card will earn 1x on everything.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.categories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 2 }}>
                    <Dropdown 
                      options={commonCategories.map(c => c.name)}
                      value={cat.categoryName}
                      onChange={val => updateCategory(idx, 'categoryName', val)}
                      placeholder="-- Select Category --"
                    />
                  </div>
                  <input className="input-glass" style={{ flex: 1, padding: '10px 14px' }} type="number" step="0.5" placeholder="Multiplier (e.g. 3)" value={cat.multiplier} onChange={e => updateCategory(idx, 'multiplier', e.target.value)} required />
                  <button type="button" onClick={() => removeCategory(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem', padding: '0 8px' }}>&times;</button>
                </div>
              ))}
            </div>
          </div>

          {hasRotating && (
            <div style={{ marginTop: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: '#60a5fa', margin: 0 }}>Automated Quarterly Calendar</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Configure the schedule for this year. The Recommender Engine will automatically use the active quarter's category.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Q1 (Jan-Mar)</label>
                  <Dropdown isMulti={true} options={categoryOptions} value={formData.quarterlyCategories.Q1} onChange={val => updateQuarterly('Q1', val)} placeholder="-- Select Categories --" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Q2 (Apr-Jun)</label>
                  <Dropdown isMulti={true} options={categoryOptions} value={formData.quarterlyCategories.Q2} onChange={val => updateQuarterly('Q2', val)} placeholder="-- Select Categories --" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Q3 (Jul-Sep)</label>
                  <Dropdown isMulti={true} options={categoryOptions} value={formData.quarterlyCategories.Q3} onChange={val => updateQuarterly('Q3', val)} placeholder="-- Select Categories --" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Q4 (Oct-Dec)</label>
                  <Dropdown isMulti={true} options={categoryOptions} value={formData.quarterlyCategories.Q4} onChange={val => updateQuarterly('Q4', val)} placeholder="-- Select Categories --" />
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Coupons / Credits</h4>
              <button type="button" onClick={addCredit} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Credit</button>
            </div>
            {formData.credits.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No credits defined.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.credits.map((credit, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input className="input-glass" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={credit.name} onChange={e => updateCredit(idx, 'name', e.target.value)} placeholder="Credit Name (e.g. Uber Cash)" required />
                    </div>
                    <div style={{ width: '120px' }}>
                      <input className="input-glass" type="number" step="0.01" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={credit.amount} onChange={e => updateCredit(idx, 'amount', e.target.value)} placeholder="Value ($)" required />
                    </div>
                    <button type="button" onClick={() => removeCredit(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem', padding: '0 8px' }}>&times;</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Frequency</label>
                      <Dropdown options={['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'Every 4 Years']} value={credit.frequency} onChange={val => updateCredit(idx, 'frequency', val)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Reset Behavior</label>
                      <Dropdown options={[{label: 'Calendar (Standard)', value: 'Calendar'}, {label: 'Anniversary / Custom', value: 'Custom'}]} value={credit.resetType} onChange={val => updateCredit(idx, 'resetType', val)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                    {credit.resetType === 'Custom' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Reset Date (MM-DD)</label>
                        <input className="input-glass" style={{ padding: '6px 10px', fontSize: '0.875rem', width: '120px' }} value={credit.resetAnchorDate || ''} onChange={e => updateCredit(idx, 'resetAnchorDate', e.target.value)} placeholder="e.g. 08-01" required />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: credit.resetType === 'Custom' ? '18px' : '0' }}>
                      <input 
                        type="checkbox" 
                        id={`partial-${idx}`}
                        checked={credit.allowPartial} 
                        onChange={e => updateCredit(idx, 'allowPartial', e.target.checked)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <label htmlFor={`partial-${idx}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Allow Partial Usage</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Intro Offers & Bonuses</h4>
              <button type="button" onClick={addIntroBonus} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Bonus</button>
            </div>
            {formData.introBonuses.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No intro bonuses added.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.introBonuses.map((bonus, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <Dropdown 
                        options={BONUS_TYPES}
                        value={bonus.type}
                        onChange={val => updateIntroBonus(idx, 'type', val)}
                      />
                    </div>
                    <button type="button" onClick={() => removeIntroBonus(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem', padding: '0 8px' }}>&times;</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Description (Optional)</label>
                      <input className="input-glass" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={bonus.description || ''} onChange={e => updateIntroBonus(idx, 'description', e.target.value)} placeholder="e.g. 0% APR for 15 mo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Deadline</label>
                      <input className="input-glass" type="date" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={bonus.deadline || ''} onChange={e => updateIntroBonus(idx, 'deadline', e.target.value)} />
                    </div>
                  </div>

                  {bonus.type === 'SpendReward' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Spend Req ($)</label>
                        <input className="input-glass" type="number" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={bonus.spendRequirement || ''} onChange={e => updateIntroBonus(idx, 'spendRequirement', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Reward</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input className="input-glass" type="number" style={{ flex: 2, padding: '6px 10px', fontSize: '0.875rem' }} value={bonus.subRewardAmount || ''} onChange={e => updateIntroBonus(idx, 'subRewardAmount', e.target.value)} />
                          <div style={{ flex: 1 }}>
                            <Dropdown options={['Points', 'Dollars']} value={bonus.subRewardType || 'Points'} onChange={val => updateIntroBonus(idx, 'subRewardType', val)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(['GlobalMultiplierMatch', 'GlobalFlatIncrease', 'CategoryFlatIncrease', 'CategoryOverride'].includes(bonus.type)) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      {['CategoryFlatIncrease', 'CategoryOverride'].includes(bonus.type) && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Category</label>
                          <Dropdown options={categoryOptions} value={bonus.categoryId || ''} onChange={val => updateIntroBonus(idx, 'categoryId', val)} placeholder="Select Category" />
                        </div>
                      )}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Modifier Value (e.g. 2, 1.5, 5)</label>
                        <input className="input-glass" type="number" step="0.5" style={{ padding: '6px 10px', fontSize: '0.875rem' }} value={bonus.modifierValue || ''} onChange={e => updateIntroBonus(idx, 'modifierValue', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
            
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Card Color:
              <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={{ height: '36px', width: '36px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', padding: '0' }} />
            </label>
            <div style={{ flex: 1 }}></div>
            {isSuccess && <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>Card saved!</span>}
            <button type="button" className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={cancelEdit}>Cancel</button>
            <button type="submit" className="btn-primary">{editingId ? 'Update Card' : 'Save Card'}</button>
          </div>
        </form>
      )}

      <CardList 
        cards={cards} 
        actualAccounts={actualAccounts} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        showNoCardsMessage={!showForm}
        noCardsMessage="No cards found. Add one to get started!"
        headerRight={!showForm ? <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add New Card</button> : null}
      />
    </main>
  );
}
