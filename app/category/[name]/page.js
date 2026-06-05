'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

import CardList from '@/components/CardList';

export default function CategoryPage() {
  const params = useParams();
  const categoryName = decodeURIComponent(params.name);
  
  const [cards, setCards] = useState([]);
  const [commonCategoryObjs, setCommonCategoryObjs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCards(data);
      })
      .catch(err => console.error(err));

    fetch('/api/data/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCommonCategoryObjs(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categoryCards = useMemo(() => {
    const list = [];
    
    const getCatNameById = (id) => {
      const found = commonCategoryObjs.find(c => c.id === id);
      return found ? found.name : '';
    };

    cards.forEach(card => {
      (card.categories || []).forEach(cat => {
        let name = cat.categoryName;
        
        if (name.startsWith('Top Category: ') || name.startsWith('Quarterly Rotating: ')) {
          name = name.split(': ')[1];
        }

        if (name === categoryName) {
          let effectiveMult = cat.multiplier;
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

          list.push({ card, multiplier: effectiveMult, isBoosted });
        }
      });
    });
    
    return list.sort((a, b) => b.multiplier - a.multiplier);
  }, [cards, categoryName, commonCategoryObjs]);

  const formattedCards = useMemo(() => {
    return categoryCards.map((item, idx) => ({
      ...item.card,
      name: `${idx + 1}. ${item.card.name}`,
      highlightMultiplier: item.isBoosted ? `🔥 ${item.multiplier}` : item.multiplier
    }));
  }, [categoryCards]);

  if (loading) return <main><p>Loading...</p></main>;

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Category: {categoryName}</h1>
        <button className="btn-secondary" onClick={() => window.history.back()}>
          &larr; Back
        </button>
      </div>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Here are all your cards that earn rewards for <strong>{categoryName}</strong>, ranked from best to worst.
      </p>

      <CardList 
        cards={formattedCards}
        noCardsMessage="No cards found for this category."
      />
    </main>
  );
}
