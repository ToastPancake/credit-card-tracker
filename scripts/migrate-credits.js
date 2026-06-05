const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath);

console.log('Migrating credits table...');

// Drop the existing credits table since the user has no data in it anyway
db.prepare('DROP TABLE IF EXISTS credits').run();

// The new schema will automatically be created when the app runs or we can just require db.js
// Wait, to be safe, I'll execute the CREATE TABLE here just in case.
db.exec(`
  CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY,
    cardId TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    allowPartial BOOLEAN DEFAULT 0,
    frequency TEXT NOT NULL,
    resetType TEXT NOT NULL DEFAULT 'Calendar',
    resetAnchorDate TEXT,
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS credit_usage (
    id TEXT PRIMARY KEY,
    creditId TEXT NOT NULL,
    period TEXT NOT NULL,
    usedAmount REAL DEFAULT 0,
    isFullyUsed BOOLEAN DEFAULT 0,
    FOREIGN KEY (creditId) REFERENCES credits(id) ON DELETE CASCADE
  );
`);

console.log('Done!');
