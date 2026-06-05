const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath);

console.log('Migrating resources...');

db.exec(`
  CREATE TABLE IF NOT EXISTS resource_sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    orderIndex INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    sectionId TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (sectionId) REFERENCES resource_sections(id) ON DELETE CASCADE
  );
`);

const existingSections = db.prepare('SELECT COUNT(*) as count FROM resource_sections').get().count;

if (existingSections === 0) {
  console.log('Seeding initial resources...');
  
  const blogsSectionId = uuidv4();
  const toolsSectionId = uuidv4();

  db.prepare('INSERT INTO resource_sections (id, name, orderIndex) VALUES (?, ?, ?)')
    .run(blogsSectionId, 'Blogs & News', 0);
    
  db.prepare('INSERT INTO resource_sections (id, name, orderIndex) VALUES (?, ?, ?)')
    .run(toolsSectionId, 'Tools & Apps', 1);

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

  const insertResource = db.prepare('INSERT INTO resources (id, sectionId, name, url, description, orderIndex) VALUES (?, ?, ?, ?, ?, ?)');

  blogs.forEach((b, idx) => {
    insertResource.run(uuidv4(), blogsSectionId, b.name, b.url, b.description, idx);
  });

  tools.forEach((t, idx) => {
    insertResource.run(uuidv4(), toolsSectionId, t.name, t.url, t.description, idx);
  });

  console.log('Seeding complete.');
} else {
  console.log('Resources already exist. Skipping seed.');
}
