'use client';
import { useState, useEffect } from 'react';

export default function IssuersPage() {
  const [items, setItems] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', loginUrl: '' });

  const fetchItems = () => {
    fetch('/api/data/issuers').then(res => res.json()).then(setItems);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    await fetch('/api/data/issuers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        name: formData.name.trim(),
        loginUrl: formData.loginUrl.trim() || null
      })
    });
    
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', loginUrl: '' });
    fetchItems();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, loginUrl: item.loginUrl || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/data/issuers?id=${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Manage Issuers</h2>
        {!showForm && <button className="btn-primary" onClick={() => { setEditingId(null); setFormData({ name: '', loginUrl: '' }); setShowForm(true); }}>+ Add Issuer</button>}
      </div>

      {showForm && (
        <form className="glass-panel" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', marginBottom: '32px', border: '1px solid var(--primary)' }}>
          <h3 style={{ margin: 0 }}>{editingId ? 'Edit Issuer' : 'New Issuer'}</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Issuer Name</label>
            <input className="input-glass" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Chase" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Login Portal URL (Optional)</label>
            <input className="input-glass" type="url" value={formData.loginUrl} onChange={e => setFormData({...formData, loginUrl: e.target.value})} placeholder="e.g. https://secure05b.chase.com/" />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
        {items.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.name}</div>
              {item.loginUrl && (
                <a href={item.loginUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Login Portal
                </a>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" style={{ background: 'var(--surface-hover)', padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => handleEdit(item)}>Edit</button>
              <button className="btn-primary" style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
