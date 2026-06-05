'use client';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ResourcesPage() {
  const [sections, setSections] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResources();
    
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setDevMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (devMode) {
      setJsonInput(JSON.stringify(sections, null, 2));
    }
  }, [devMode]); // Intentionally don't want sections here to prevent overwriting user input while editing

  const fetchResources = async () => {
    setIsLoading(true);
    const res = await fetch('/api/data/resources');
    const data = await res.json();
    setSections(data);
    setIsLoading(false);
  };

  const saveResources = async (newSections) => {
    await fetch('/api/data/resources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSections)
    });
    setSections(newSections);
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      await saveResources(parsed);
      setDevMode(false);
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  };

  const moveSection = (sIdx, dir) => {
    const newSections = [...sections];
    if (dir === 'up' && sIdx > 0) {
      [newSections[sIdx - 1], newSections[sIdx]] = [newSections[sIdx], newSections[sIdx - 1]];
    } else if (dir === 'down' && sIdx < newSections.length - 1) {
      [newSections[sIdx + 1], newSections[sIdx]] = [newSections[sIdx], newSections[sIdx + 1]];
    }
    setSections(newSections);
  };

  const moveResource = (sIdx, rIdx, dir) => {
    const newSections = [...sections];
    const section = { ...newSections[sIdx] };
    const resources = [...section.resources];
    
    if (dir === 'up' && rIdx > 0) {
      [resources[rIdx - 1], resources[rIdx]] = [resources[rIdx], resources[rIdx - 1]];
    } else if (dir === 'down' && rIdx < resources.length - 1) {
      [resources[rIdx + 1], resources[rIdx]] = [resources[rIdx], resources[rIdx + 1]];
    }
    
    section.resources = resources;
    newSections[sIdx] = section;
    setSections(newSections);
  };

  const addSection = () => {
    const name = prompt('Section Name:');
    if (!name) return;
    setSections([...sections, { id: uuidv4(), name, resources: [] }]);
  };

  const editSection = (sIdx) => {
    const name = prompt('New Section Name:', sections[sIdx].name);
    if (!name) return;
    const newSections = [...sections];
    newSections[sIdx].name = name;
    setSections(newSections);
  };

  const deleteSection = (sIdx) => {
    if (!confirm('Delete this section and all its resources?')) return;
    const newSections = [...sections];
    newSections.splice(sIdx, 1);
    setSections(newSections);
  };

  const addResource = (sIdx) => {
    const name = prompt('Resource Name:');
    if (!name) return;
    const url = prompt('URL:');
    if (!url) return;
    const description = prompt('Description:');
    
    const newSections = [...sections];
    newSections[sIdx].resources.push({ id: uuidv4(), name, url, description });
    setSections(newSections);
  };

  const editResource = (sIdx, rIdx) => {
    const resource = sections[sIdx].resources[rIdx];
    const name = prompt('Resource Name:', resource.name);
    if (!name) return;
    const url = prompt('URL:', resource.url);
    if (!url) return;
    const description = prompt('Description:', resource.description);
    
    const newSections = [...sections];
    newSections[sIdx].resources[rIdx] = { ...resource, name, url, description };
    setSections(newSections);
  };

  const deleteResource = (sIdx, rIdx) => {
    if (!confirm('Delete this resource?')) return;
    const newSections = [...sections];
    newSections[sIdx].resources.splice(rIdx, 1);
    setSections(newSections);
  };

  const renderCard = (link, sIdx, rIdx) => (
    <div key={link.id || link.name} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '24px', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
        <h3 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {link.name}
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>{link.description}</p>
      </a>
      
      {isEditing && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => moveResource(sIdx, rIdx, 'up')} disabled={rIdx === 0} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: rIdx === 0 ? 'default' : 'pointer', fontSize: '1.2rem' }}>↑</button>
          <button onClick={() => moveResource(sIdx, rIdx, 'down')} disabled={rIdx === sections[sIdx].resources.length - 1} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: rIdx === sections[sIdx].resources.length - 1 ? 'default' : 'pointer', fontSize: '1.2rem' }}>↓</button>
          <button onClick={() => editResource(sIdx, rIdx)} style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
          <button onClick={() => deleteResource(sIdx, rIdx)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
        </div>
      )}
    </div>
  );

  if (isLoading) return <p>Loading...</p>;

  if (devMode) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#fbbf24' }}>Developer Mode (JSON Editor)</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" style={{ background: 'var(--surface-hover)' }} onClick={() => setDevMode(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveJson}>Save JSON</button>
          </div>
        </div>
        <textarea
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          className="input-glass"
          style={{ width: '100%', height: '600px', fontFamily: 'monospace', fontSize: '0.875rem' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          A collection of helpful tools and blogs for the credit card and award travel community.<br/>
          <small>(Press <code>Ctrl+Shift+E</code> for Developer JSON Editor)</small>
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditing && (
            <button className="btn-primary" onClick={() => { saveResources(sections); setIsEditing(false); }}>
              Save Changes
            </button>
          )}
          <button className="btn-primary" style={{ background: isEditing ? 'var(--surface-hover)' : 'var(--primary)' }} onClick={() => { if(isEditing) fetchResources(); setIsEditing(!isEditing); }}>
            {isEditing ? 'Cancel Edit' : 'Edit Resources'}
          </button>
        </div>
      </div>

      {sections.map((section, sIdx) => (
        <div key={section.id} style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <svg width="20" height="20" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              {section.name}
            </h2>
            
            {isEditing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => moveSection(sIdx, 'up')} disabled={sIdx === 0} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: sIdx === 0 ? 'default' : 'pointer', fontSize: '1.2rem' }}>↑</button>
                <button onClick={() => moveSection(sIdx, 'down')} disabled={sIdx === sections.length - 1} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: sIdx === sections.length - 1 ? 'default' : 'pointer', fontSize: '1.2rem' }}>↓</button>
                <button onClick={() => editSection(sIdx)} style={{ background: 'var(--surface-hover)', border: 'none', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Edit Name</button>
                <button onClick={() => deleteSection(sIdx)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Delete Section</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {section.resources.map((link, rIdx) => renderCard(link, sIdx, rIdx))}
            
            {isEditing && (
              <div 
                onClick={() => addResource(sIdx)}
                className="glass-panel" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'pointer', border: '1px dashed var(--border)', background: 'transparent' }}
              >
                <span style={{ color: 'var(--primary)' }}>+ Add Resource</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {isEditing && (
        <button className="btn-primary" onClick={addSection} style={{ background: 'var(--surface-hover)' }}>
          + Add New Section
        </button>
      )}
    </div>
  );
}
