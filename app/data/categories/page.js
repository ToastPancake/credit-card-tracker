'use client';
import { useState, useEffect } from 'react';

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const fetchItems = () => {
    fetch('/api/data/categories').then(res => res.json()).then(setItems);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await fetch('/api/data/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItem.trim() })
    });
    setNewItem('');
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/data/categories?id=${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Manage Categories</h2>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px', maxWidth: '400px' }}>
        <input className="input-glass" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New Category Name (e.g. Dining)" required />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
        {items.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.name}</span>
            <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
