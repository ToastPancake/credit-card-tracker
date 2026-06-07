'use client';
import { useState, useEffect, useMemo } from 'react';
import Dropdown from '@/components/Dropdown';
import PageLayout from '@/components/PageLayout';
import SidebarFilter, { FilterSection } from '@/components/SidebarFilter';
import TriStateCheckbox from '@/components/TriStateCheckbox';
import Modal from '@/components/Modal';

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', issuer: '', productUrl: '', color: '#4a61bd', templateCategories: [], introBonuses: [], credits: [],
    quarterlyCategories: { Q1: [], Q2: [], Q3: [], Q4: [] }, annualFee: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssuers, setSelectedIssuers] = useState({});
  const [annualFeeFilter, setAnnualFeeFilter] = useState('all');

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
    setAnnualFeeFilter('all');
  };

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    if (searchQuery) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    const includeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'include');
    const excludeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'exclude');
    if (includeIssuers.length > 0) filtered = filtered.filter(c => includeIssuers.includes(c.issuer));
    if (excludeIssuers.length > 0) filtered = filtered.filter(c => !excludeIssuers.includes(c.issuer));

    if (annualFeeFilter === 'no_fee') filtered = filtered.filter(c => !c.annualFee || c.annualFee === 0);
    if (annualFeeFilter === 'has_fee') filtered = filtered.filter(c => c.annualFee > 0);

    return filtered;
  }, [templates, searchQuery, selectedIssuers, annualFeeFilter]);


  const fetchData = () => {
    fetch('/api/data/templates').then(res => res.json()).then(setTemplates);
    fetch('/api/data/issuers').then(res => res.json()).then(setIssuers);
    fetch('/api/data/categories').then(res => res.json()).then(setCategories);
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({
      name: t.name || '',
      issuer: t.issuer || '',
      productUrl: t.productUrl || '',
      color: t.color || '#4a61bd',
      templateCategories: t.categories || [],
      quarterlyCategories: t.quarterlyCategories || { Q1: [], Q2: [], Q3: [], Q4: [] },
      annualFee: t.annualFee || 0,
      credits: t.credits || [],
      introBonuses: t.introBonuses ? t.introBonuses.map(ib => {
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
         return {
           ...ib,
           subRewardAmount,
           subRewardType
         };
      }) : []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await fetch(`/api/data/templates?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', issuer: '', productUrl: '', color: '#4a61bd', templateCategories: [], introBonuses: [], credits: [], quarterlyCategories: { Q1: [], Q2: [], Q3: [], Q4: [] }, annualFee: 0 });
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      templateCategories: [...prev.templateCategories, { categoryName: '', multiplier: 1 }]
    }));
  };

  const updateCategory = (index, field, value) => {
    const newCats = [...formData.templateCategories];
    newCats[index][field] = value;
    setFormData(prev => ({ ...prev, templateCategories: newCats }));
  };

  const removeCategory = (index) => {
    const newCats = formData.templateCategories.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, templateCategories: newCats }));
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
    const newBonuses = formData.introBonuses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, introBonuses: newBonuses }));
  };

  const addCredit = () => {
    setFormData(prev => ({
      ...prev,
      credits: [...prev.credits, { name: '', amount: 0, allowPartial: false, frequency: 'Annual', resetType: 'Calendar', resetAnchorDate: '', type: 'General' }]
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
    setFormData(prev => ({
      ...prev,
      quarterlyCategories: { ...prev.quarterlyCategories, [q]: val }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: editingId,
      name: formData.name,
      issuer: formData.issuer,
      productUrl: formData.productUrl,
      color: formData.color,
      categories: formData.templateCategories,
      quarterlyCategories: formData.quarterlyCategories,
      annualFee: formData.annualFee,
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

    await fetch('/api/data/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    cancelEdit();
    fetchData();
  };

  const hasRotating = formData.templateCategories.some(c => c.categoryName.startsWith('Quarterly Rotating'));
  const categoryOptions = categories.map(c => ({ label: c.name, value: c.id }));

  return (
    <PageLayout
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Manage Card Templates</h2>
          {!showForm && <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Template</button>}
        </div>
      }
      leftSidebar={
        <SidebarFilter 
          title="Filters" 
          onClearAll={handleClearFilters} 
          showClearAll={Object.keys(selectedIssuers).length > 0 || annualFeeFilter !== 'all' || searchQuery}
        >
          <FilterSection title="Search">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
              style={{ width: '100%', marginBottom: '8px' }}
            />
          </FilterSection>

          <FilterSection title="Annual Fee">
            <Dropdown
              options={[
                { label: 'All Templates', value: 'all' },
                { label: 'No Annual Fee', value: 'no_fee' },
                { label: 'Has Annual Fee', value: 'has_fee' }
              ]}
              value={annualFeeFilter}
              onChange={setAnnualFeeFilter}
            />
          </FilterSection>

          <FilterSection title="Issuers" isScrollable>
            {issuers.map(i => (
              <TriStateCheckbox 
                key={i.name} 
                label={i.name} 
                state={selectedIssuers[i.name]} 
                onClick={() => toggleFilter(setSelectedIssuers, i.name)} 
              />
            ))}
          </FilterSection>
        </SidebarFilter>
      }
    >
      <Modal isOpen={showForm} onClose={cancelEdit} title={editingId ? 'Edit Template' : 'New Template'} maxWidth="800px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Template Name</label>
              <input className="input-glass" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
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
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Annual Fee ($)</label>
              <input className="input-glass" type="number" step="0.01" placeholder="e.g. 95" value={formData.annualFee} onChange={e => setFormData({...formData, annualFee: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0 }}>Category Multipliers</h4>
              <button type="button" onClick={addCategory} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>+ Add Category</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.templateCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 2 }}>
                    <Dropdown 
                      options={categories.map(c => c.name)}
                      value={cat.categoryName}
                      onChange={val => updateCategory(idx, 'categoryName', val)}
                      placeholder="-- Select Category --"
                    />
                  </div>
                  <input className="input-glass" style={{ flex: 1, padding: '10px 14px' }} type="number" step="0.5" value={cat.multiplier} onChange={e => updateCategory(idx, 'multiplier', e.target.value)} required />
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
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Configure the default schedule. Any card created from this template will start with this calendar.</p>
              
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
                    <div style={{ width: '150px' }}>
                      <Dropdown options={['General', 'Travel', 'Dining', 'Incidental', 'Streaming', 'Gaming', 'Shopping', 'Fitness']} value={credit.type || 'General'} onChange={val => updateCredit(idx, 'type', val)} />
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
                          <Dropdown options={categories.map(c => ({ label: c.name, value: c.id }))} value={bonus.categoryId || ''} onChange={val => updateIntroBonus(idx, 'categoryId', val)} placeholder="Select Category" />
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

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Card Color:
              <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={{ height: '36px', width: '36px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', padding: '0' }} />
            </label>
            <div style={{ flex: 1 }}></div>
            <button type="button" className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={cancelEdit}>Cancel</button>
            <button type="submit" className="btn-primary">Save Template</button>
          </div>
        </form>
      </Modal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', width: '100%' }}>
        {filteredTemplates.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No templates found.</p>
        )}
        {filteredTemplates.map(t => (
          <div key={t.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: `4px solid ${t.color}` }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{t.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 'normal' }}>({t.issuer})</span></div>
              
              {t.categories && t.categories.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {t.categories.map((c, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {c.categoryName}: {c.multiplier}x
                    </span>
                  ))}
                </div>
              )}

              {t.credits && t.credits.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {t.credits.map((c, i) => (
                    <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      ${c.amount} {c.frequency} {c.name}
                    </span>
                  ))}
                </div>
              )}

              {t.introBonuses && t.introBonuses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.75rem', color: '#fbbf24' }}>
                  {t.introBonuses.map(bonus => {
                    let text = bonus.type;
                    if (bonus.type === 'SpendReward') text = `${bonus.rewardAmount} after $${bonus.spendRequirement}`;
                    if (bonus.type === 'GlobalMultiplierMatch') text = `Match all categories by ${bonus.modifierValue}x`;
                    if (bonus.type === 'GlobalFlatIncrease') text = `+${bonus.modifierValue}x on all categories`;
                    if (bonus.type === 'CategoryFlatIncrease') text = `+${bonus.modifierValue}x on category`;
                    if (bonus.type === 'CategoryOverride') text = `${bonus.modifierValue}x on category`;
                    if (bonus.type === 'FreeItem' || bonus.type === 'ReducedAPR' || bonus.type === 'FeeFreeTransfer') text = bonus.description || bonus.type;
                    
                    return (
                      <div key={bonus.id}>• {text}</div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button className="btn-primary" style={{ background: 'var(--surface-hover)', padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => handleEdit(t)}>Edit</button>
                <button className="btn-primary" style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                color: t.annualFee > 0 ? '#f87171' : '#10b981', 
                background: t.annualFee > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${t.annualFee > 0 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                padding: '4px 10px', 
                borderRadius: '12px',
                marginTop: 'auto'
              }}>
                {t.annualFee > 0 ? `$${t.annualFee} AF` : 'No AF'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
