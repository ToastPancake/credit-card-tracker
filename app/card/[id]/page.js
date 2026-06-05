'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CardDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [card, setCard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    fetch('/api/cards')
      .then(res => res.json())
      .then(cards => {
        const found = cards.find(c => c.id === id);
        if (found) {
          setCard(found);
          if (found.actualAccountId) {
            fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accountId: found.actualAccountId })
            })
            .then(res => res.json())
            .then(data => {
              if (data.error) throw new Error(data.error);
              setTransactions(data.transactions || []);
              setTotalSpend(data.totalSpend || 0);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        } else {
          setError("Card not found");
          setLoading(false);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (error) return <main className="layout-container"><p style={{color: '#ef4444'}}>{error}</p></main>;
  if (!card) return <main className="layout-container"><p>Loading...</p></main>;

  const progress = card.subSpendRequirement > 0 ? Math.min(100, (totalSpend / card.subSpendRequirement) * 100) : 0;

  return (
    <main>
      <button onClick={() => router.push('/')} className="btn-secondary" style={{ marginBottom: '24px' }}>
        &larr; Back to Dashboard
      </button>

      <div className="glass-panel" style={{ borderTop: `4px solid ${card.color || 'var(--primary)'}` }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>{card.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{card.issuer}</p>

        {card.subSpendRequirement > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Sign-Up Bonus Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>${totalSpend.toFixed(2)} spent</span>
              <span>Goal: ${card.subSpendRequirement}</span>
            </div>
            <div style={{ width: '100%', height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: card.color, transition: 'width 1s ease-out' }}></div>
            </div>
            {progress >= 100 && <p style={{ color: '#10b981', marginTop: '8px', fontWeight: 'bold' }}>🎉 Sign-Up Bonus achieved!</p>}
          </div>
        )}

        {card.actualAccountId ? (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Recent Transactions</h3>
            {loading ? <p>Syncing with ActualBudget...</p> : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 0' }}>Date</th>
                    <th style={{ padding: '12px 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{t.date}</td>
                      <td style={{ padding: '12px 0', color: t.amount < 0 ? '#f87171' : '#4ade80' }}>
                        ${Math.abs(t.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No ActualBudget account linked. Edit this card to link an account and track SUB progress.</p>
        )}
      </div>
    </main>
  );
}
