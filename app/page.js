'use client';
import { useState, useEffect, useMemo } from 'react';
import Dropdown from '../components/Dropdown';

const TriStateCheckbox = ({ label, state, onClick }) => {
  let icon = null;
  let bg = 'transparent';
  let border = '1px solid var(--border)';
  if (state === 'include') {
    bg = 'var(--primary)';
    border = '1px solid var(--primary)';
    icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;
  } else if (state === 'exclude') {
    bg = '#ef4444';
    border = '1px solid #ef4444';
    icon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
  }

  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 0', userSelect: 'none' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: bg, border: border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ color: state ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.2' }}>{label}</span>
    </div>
  );
};

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [commonCategories, setCommonCategories] = useState([]);
  const [commonCategoryObjs, setCommonCategoryObjs] = useState([]);
  const [issuers, setIssuers] = useState([]);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssuers, setSelectedIssuers] = useState({}); // { 'IssuerName': 'include' | 'exclude' }
  const [selectedCategories, setSelectedCategories] = useState({}); // { 'CatName': 'include' | 'exclude' }
  const [subStatus, setSubStatus] = useState('all'); // 'all', 'working_towards', 'no_sub'
  const [tiebreaker, setTiebreaker] = useState('default'); // 'default', 'maximize_spread'

  const fetchData = () => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCards(data);
          const uniqueIssuers = [...new Set(data.map(c => c.issuer).filter(Boolean))].sort();
          setIssuers(uniqueIssuers);
        }
      })
      .catch(err => console.error("Error fetching cards:", err));

    fetch('/api/data/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCommonCategories(data.map(c => c.name).sort());
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

  const { categoryGroups, everythingGroup, flexibleCategories } = useMemo(() => {
    const getSubInfo = (card) => {
      const activeBonuses = (card.introBonuses || []).filter(b => !b.deadline || new Date(b.deadline) >= new Date());
      const sub = activeBonuses.find(b => b.type === 'SpendReward');
      return sub ? { hasSub: true, spendRequirement: sub.spendRequirement || 0 } : { hasSub: false, spendRequirement: 0 };
    };

    const includeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'include');
    const excludeIssuers = Object.keys(selectedIssuers).filter(k => selectedIssuers[k] === 'exclude');

    const filteredCards = cards.filter(card => {
      if (includeIssuers.length > 0 && !includeIssuers.includes(card.issuer)) return false;
      if (excludeIssuers.length > 0 && excludeIssuers.includes(card.issuer)) return false;

      const subInfo = getSubInfo(card);
      if (subStatus === 'working_towards' && !subInfo.hasSub) return false;
      if (subStatus === 'no_sub' && subInfo.hasSub) return false;

      return true;
    });

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

        const overrides = activeBonuses.filter(b => b.type === 'CategoryOverride' && getCatNameById(b.categoryId) === name);
        if (overrides.length > 0) {
          effectiveMult = overrides[0].modifierValue;
          isBoosted = true;
        }

        const catIncreases = activeBonuses.filter(b => b.type === 'CategoryFlatIncrease' && getCatNameById(b.categoryId) === name);
        for (const b of catIncreases) {
          effectiveMult += b.modifierValue;
          isBoosted = true;
        }

        const globalIncreases = activeBonuses.filter(b => b.type === 'GlobalFlatIncrease');
        for (const b of globalIncreases) {
          effectiveMult += b.modifierValue;
          isBoosted = true;
        }

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

    filteredCards.forEach(card => {
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
            if (typeof automatedCatIds === 'string') automatedCatIds = automatedCatIds ? [automatedCatIds] : [];
            
            if (automatedCatIds && Array.isArray(automatedCatIds) && automatedCatIds.length > 0) {
              automatedCatIds.forEach(automatedCatId => {
                const automatedCatName = getCatNameById(automatedCatId);
                if (automatedCatName) {
                  processCategory(card, automatedCatName, cat.multiplier, {
                    card, catIndex: idx, baseName, currentValue: automatedCatName, multiplier: cat.multiplier, isAutomated: true
                  });
                }
              });
              return;
            }
          }
          
          if (!currentValue) return;

          processCategory(card, currentValue, cat.multiplier, {
            card, catIndex: idx, baseName, currentValue, multiplier: cat.multiplier, isAutomated: false
          });
          return;
        }

        processCategory(card, name, cat.multiplier, null);
      });
    });

    let assignedSubCards = new Set();

    const sortCardsArray = (arr) => {
      arr.sort((a, b) => {
        if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;

        const subA = getSubInfo(a.card);
        const subB = getSubInfo(b.card);

        if (tiebreaker === 'maximize_spread') {
          const aAssigned = assignedSubCards.has(a.card.id);
          const bAssigned = assignedSubCards.has(b.card.id);
          
          if (subA.hasSub && subB.hasSub) {
             if (aAssigned && !bAssigned) return 1; 
             if (!aAssigned && bAssigned) return -1; 
          }
        }

        if (subA.hasSub && !subB.hasSub) return -1;
        if (!subA.hasSub && subB.hasSub) return 1;
        if (subA.hasSub && subB.hasSub) {
          return subB.spendRequirement - subA.spendRequirement;
        }
        return 0;
      });

      if (arr.length > 0 && getSubInfo(arr[0].card).hasSub) {
        assignedSubCards.add(arr[0].card.id);
      }
    };

    const sortedCatNames = Object.keys(catMap).sort((a, b) => a.localeCompare(b));
    const groupsArr = [];
    
    const includeCats = Object.keys(selectedCategories).filter(k => selectedCategories[k] === 'include');
    const excludeCats = Object.keys(selectedCategories).filter(k => selectedCategories[k] === 'exclude');

    for (const cat of sortedCatNames) {
      if (includeCats.length > 0 && !includeCats.includes(cat)) continue;
      if (excludeCats.length > 0 && excludeCats.includes(cat)) continue;
      if (searchQuery && !cat.toLowerCase().includes(searchQuery.toLowerCase())) continue;

      const cardsInCat = catMap[cat];
      sortCardsArray(cardsInCat);
      groupsArr.push({ categoryName: cat, cards: cardsInCat });
    }

    if (everything.length > 0) {
      sortCardsArray(everything);
    }

    return { categoryGroups: groupsArr, everythingGroup: everything, flexibleCategories: flex };
  }, [cards, commonCategoryObjs, selectedIssuers, selectedCategories, subStatus, tiebreaker, searchQuery]);

  const toggleCategory = (catName) => {
    if (expandedCategory === catName) setExpandedCategory(null);
    else setExpandedCategory(catName);
  };

  const handleClearFilters = () => {
    setSelectedIssuers({});
    setSelectedCategories({});
    setSubStatus('all');
    setSearchQuery('');
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
        <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* LEFT SIDEBAR (Filters) */}
          <div className="glass-panel" style={{ flex: '0 0 280px', position: 'sticky', top: '24px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </h3>
              {(Object.keys(selectedIssuers).length > 0 || Object.keys(selectedCategories).length > 0 || subStatus !== 'all' || tiebreaker !== 'default') && (
                <button onClick={handleClearFilters} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Sign-Up Bonus Status</label>
                <Dropdown
                  options={[
                    { label: 'All Cards', value: 'all' },
                    { label: 'Working Towards SUB', value: 'working_towards' },
                    { label: 'No Active SUB', value: 'no_sub' }
                  ]}
                  value={subStatus}
                  onChange={setSubStatus}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Issuers</label>
                <div className="custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>
                  {issuers.map(issuer => (
                    <TriStateCheckbox 
                      key={issuer} 
                      label={issuer} 
                      state={selectedIssuers[issuer]} 
                      onClick={() => toggleFilter(setSelectedIssuers, issuer)} 
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Categories</label>
                <div className="custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>
                  {commonCategories.map(c => (
                    <TriStateCheckbox 
                      key={c} 
                      label={c} 
                      state={selectedCategories[c]} 
                      onClick={() => toggleFilter(setSelectedCategories, c)} 
                    />
                  ))}
                </div>
              </div>
              
              <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Tie-Breaker Behavior</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                  When multiple cards share the highest multiplier for a category, how should we break the tie?
                </p>
                <Dropdown
                  options={[
                    { label: 'Prioritize Highest SUB Goal', value: 'default' },
                    { label: 'Maximize Unique SUB Cards', value: 'maximize_spread' }
                  ]}
                  value={tiebreaker}
                  onChange={setTiebreaker}
                />
              </div>
            </div>
          </div>

          {/* MAIN CONTENT (Recommender) */}
          <div style={{ flex: '1 1 500px', minWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" color="#fbbf24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Card Recommender
              </h2>
              <div style={{ position: 'relative', width: '250px' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search Categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass"
                  style={{ width: '100%', paddingLeft: '32px' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {categoryGroups.length === 0 && !everythingGroup.length && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No categories match your filters.</div>
              )}

              {categoryGroups.map((group, idx) => {
                const bestCard = group.cards[0];
                if (!bestCard) return null;
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

          {/* RIGHT SIDEBAR (Special Categories) */}
          {flexibleCategories.length > 0 && (
            <div className="glass-panel" style={{ flex: '0 0 320px', position: 'sticky', top: '24px', width: '100%', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <h3 style={{ marginBottom: '16px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Special Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {flexibleCategories.map((flex, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{flex.card.name}</strong> 
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{flex.baseName} - {flex.multiplier}x</span>
                      {flex.isAutomated && <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>⚡ Auto-Scheduled</span>}
                    </div>
                    {flex.isAutomated ? (
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        {flex.currentValue || 'No Category Scheduled'}
                      </div>
                    ) : (
                      <Dropdown
                        options={commonCategories}
                        value={flex.currentValue}
                        onChange={(val) => handleUpdateFlexibleCategory(flex.card, flex.catIndex, flex.baseName, val)}
                        placeholder="-- Select Category --"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
