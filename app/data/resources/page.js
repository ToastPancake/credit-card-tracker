export default function ResourcesPage() {
  const blogs = [
    { name: 'Doctor of Credit', url: 'https://www.doctorofcredit.com/', description: 'The premier source for credit card sign-up bonuses, bank account bonuses, and deals.' },
    { name: 'US Credit Card Guide', url: 'https://www.uscreditcardguide.com/', description: 'Detailed reviews, application rules, and historical high sign-up bonus tracking.' },
    { name: 'The Points Guy', url: 'https://thepointsguy.com/', description: 'General travel and credit card news, beginner-friendly guides.' },
    { name: 'Frequent Miler', url: 'https://frequentmiler.com/', description: 'Advanced strategies for maximizing points and miles.' }
  ];

  const tools = [
    { name: "AwardWallet's Merchant Lookup", url: 'https://awardwallet.com/merchants', description: 'Search how a specific merchant codes across different networks.' },
    { name: 'CardPointers', url: 'https://cardpointers.com/', description: 'App to help you maximize credit card rewards and track Amex/Chase offers.' },
    { name: 'MaxRewards', url: 'https://maxrewards.com/', description: 'Automates activating quarterly categories and adding credit card offers.' },
    { name: 'TravelFreely', url: 'https://travelfreely.com/', description: 'Free app to track 5/24 status and card application timing.' }
  ];

  const renderCard = (link) => (
    <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.name} className="glass-panel" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '24px', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}>
      <h3 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {link.name}
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>{link.description}</p>
    </a>
  );

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        A collection of helpful tools and blogs for the credit card and award travel community.
      </p>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Blogs & News
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {blogs.map(renderCard)}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" stroke="#fbbf24" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Tools & Apps
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {tools.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
