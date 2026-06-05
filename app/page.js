'use client';
import { useState, useEffect, useMemo } from 'react';
import Dropdown from '../components/Dropdown';

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [commonCategories, setCommonCategories] = useState([]);
  const [commonCategoryObjs, setCommonCategoryObjs] = useState([]);

  const fetchData = () => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCards(data);
      })
      .catch(err => console.error("Error fetching cards:", err));

    fetch('/api/data/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCommonCategories(data.map(c => c.name));
          setCommonCategoryObjs(data);
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateFlexibleCategory = async (card, catIndex, baseName, newValue) => {
    const updatedCard = { ...card, categories: [...card.categories] };
    updatedCard.categories[catIndex].categoryName = `${baseName}: ${newValue}`;

    try {
      const res = await fetch(`/api/cards?id=${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCard)
      });
      if (res.ok) {
        fetchData(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { categoryGroups, everythingGroup, flexibleCategories } = useMemo(() => {
    const catMap = {};
    const everything = [];
    const flex = [];

    const getCatNameById = (id) => {
      const found = commonCategoryObjs.find(c => c.id === id);
      return found ? found.name : '';
    };

    const processCategory = (card, name, baseMultiplier, flexMeta) => {
        if (flexMeta) {
          flex.push(flexMeta);
        }

        let effectiveMult = baseMultiplier;
        let isBoosted = false;

        const activeBonuses = (card.introBonuses || []).filter(b => {
          if (!b.deadline) return true;
          return new Date(b.deadline) >= new Date();
        });

        // 1. Category Overrides
        const overrides = activeBonuses.filter(b => b.type === 'CategoryOverride' && getCatNameById(b.categoryId) === name);
        if (overrides.length > 0) {
          effectiveMult = overrides[0].modifierValue;
          isBoosted = true;
        }

        // 2. Category Flat Increase
        const catIncreases = activeBonuses.filter(b => b.type === 'CategoryFlatIncrease' && getCatNameById(b.categoryId) === name);
        for (const b of catIncreases) {
          effectiveMult += b.modifierValue;
          isBoosted = true;
        }

        // 3. Global Flat Increase
        const globalIncreases = activeBonuses.filter(b => b.type === 'GlobalFlatIncrease');
        for (const b of globalIncreases) {
          effectiveMult += b.modifierValue;
          isBoosted = true;
        }

        // 4. Global Multiplier Match
        const globalMatches = activeBonuses.filter(b => b.type === 'GlobalMultiplierMatch');
        for (const b of globalMatches) {
          effectiveMult *= b.modifierValue;
          isBoosted = true;
        }

        if (name === 'Everything') {
          everything.push({ card, multiplier: effectiveMult, isBoosted });
        } else {
          if (!catMap[name]) catMap[name] = [];
          catMap[name].push({ card, multiplier: effectiveMult, isBoosted });
        }
    };

    cards.forEach(card => {
      (card.categories || []).forEach((cat, idx) => {
        let name = cat.categoryName;
        
        const isTop = name.startsWith('Top Category');
        const isRotating = name.startsWith('Quarterly Rotating');
        
        if (isTop || isRotating) {
          const baseName = isTop ? 'Top Category' : 'Quarterly Rotating';
          let currentValue = name.includes(': ') ? name.split(': ')[1] : '';

          if (isRotating && card.quarterlyCategories) {
            const month = new Date().getMonth();
            const quarter = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4';
            let automatedCatIds = card.quarterlyCategories[quarter];
            
            // Backward compatibility: Convert string to array
            if (typeof automatedCatIds === 'string') {
                automatedCatIds = automatedCatIds ? [automatedCatIds] : [];
            }
            
            if (automatedCatIds && Array.isArray(automatedCatIds) && automatedCatIds.length > 0) {
              automatedCatIds.forEach(automatedCatId => {
                const automatedCatName = getCatNameById(automatedCatId);
                if (automatedCatName) {
                  processCategory(card, automatedCatName, cat.multiplier, {
                    card,
                    catIndex: idx,
                    baseName,
                    currentValue: automatedCatName,
                    multiplier: cat.multiplier,
                    isAutomated: true
                  });
                }
              });
              return; // Skip standard processing since we expanded the multiple categories
            }
          }
          
          if (!currentValue) return;

          // Manual category override (single)
          processCategory(card, currentValue, cat.multiplier, {
            card,
            catIndex: idx,
            baseName,
            currentValue,
            multiplier: cat.multiplier,
            isAutomated: false
          });
          return;
        }

        // Process standard category
        processCategory(card, name, cat.multiplier, null);
      });
    });

    for (const cat in catMap) {
      catMap[cat].sort((a, b) => b.multiplier - a.multiplier);
    }
    everything.sort((a, b) => b.multiplier - a.multiplier);

    const groupsArr = Object.entries(catMap)
      .map(([catName, cardsInCat]) => ({ categoryName: catName, cards: cardsInCat }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    return { categoryGroups: groupsArr, everythingGroup: everything, flexibleCategories: flex };
  }, [cards, commonCategoryObjs]);

  const toggleCategory = (catName) => {
    if (expandedCategory === catName) setExpandedCategory(null);
    else setExpandedCategory(catName);
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Wallet Overview</h1>
      </div>

      {cards.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '32px' }}>
          No cards added yet. Go to the Cards tab to add your first card!
        </div>
      ) : (
        <>
          {flexibleCategories.length > 0 && (
            <div className="glass-panel" style={{ marginBottom: '32px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <h3 style={{ marginBottom: '16px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Special Category Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {flexibleCategories.map((flex, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{flex.card.name}</strong> 
                      <span style={{ color: 'var(--text-muted)' }}> ({flex.baseName} - {flex.multiplier}x)</span>
                      {flex.isAutomated && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>⚡ Auto-Scheduled</span>}
                    </div>
                    {flex.isAutomated ? (
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {flex.currentValue || 'No Category Scheduled for this Quarter'}
                      </div>
                    ) : (
                      <Dropdown
                        options={commonCategories}
                        value={flex.currentValue}
                        onChange={(val) => handleUpdateFlexibleCategory(flex.card, flex.catIndex, flex.baseName, val)}
                        placeholder="-- Select Active Category --"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" color="#fbbf24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Card Recommender
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {categoryGroups.map((group, idx) => {
                const bestCard = group.cards[0];
                const ties = group.cards.filter(c => c.multiplier === bestCard.multiplier).length;
                const isExpanded = expandedCategory === group.categoryName;
                
                return (
                  <div key={idx} className="glass-panel" style={{ padding: '16px', borderLeft: `4px solid ${bestCard.card.color || 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ cursor: group.cards.length > 1 ? 'pointer' : 'default', flex: 1 }} onClick={() => group.cards.length > 1 && toggleCategory(group.categoryName)}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {group.categoryName} 
                          {group.cards.length > 1 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>
                          {bestCard.card.name}
                          {ties > 1 && <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>(Tied: {ties})</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {bestCard.isBoosted && <span title="Boosted by active Intro Offer">🔥</span>}
                          {bestCard.multiplier}x
                        </div>
                        <button 
                          className="btn-outline btn-sm"
                          onClick={(e) => { e.stopPropagation(); window.location.href = `/category/${encodeURIComponent(group.categoryName)}`; }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && group.cards.length > 1 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>OTHER CARDS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {group.cards.slice(1, 6).map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                              <span>{item.card.name}</span>
                              <span style={{ color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {item.isBoosted && <span title="Boosted by active Intro Offer">🔥</span>}
                                {item.multiplier}x
                              </span>
                            </div>
                          ))}
                          {group.cards.length > 6 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: '4px' }}>
                              + {group.cards.length - 6} more cards
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {everythingGroup.length > 0 && (() => {
                const bestCard = everythingGroup[0];
                const ties = everythingGroup.filter(c => c.multiplier === bestCard.multiplier).length;
                const isExpanded = expandedCategory === 'Everything Else';
                
                return (
                  <div className="glass-panel" style={{ padding: '16px', borderLeft: `4px solid ${bestCard.card.color || 'var(--primary)'}`, background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ cursor: everythingGroup.length > 1 ? 'pointer' : 'default', flex: 1 }} onClick={() => everythingGroup.length > 1 && toggleCategory('Everything Else')}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Everything Else
                          {everythingGroup.length > 1 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>
                          {bestCard.card.name}
                          {ties > 1 && <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>(Tied: {ties})</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {bestCard.isBoosted && <span title="Boosted by active Intro Offer">🔥</span>}
                          {bestCard.multiplier}x
                        </div>
                        <button 
                          className="btn-outline btn-sm"
                          onClick={(e) => { e.stopPropagation(); window.location.href = `/category/Everything`; }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && everythingGroup.length > 1 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>OTHER CARDS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {everythingGroup.slice(1, 6).map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                              <span>{item.card.name}</span>
                              <span style={{ color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {item.isBoosted && <span title="Boosted by active Intro Offer">🔥</span>}
                                {item.multiplier}x
                              </span>
                            </div>
                          ))}
                          {everythingGroup.length > 6 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: '4px' }}>
                              + {everythingGroup.length - 6} more cards
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
