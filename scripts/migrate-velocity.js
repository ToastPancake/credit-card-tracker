import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../tracker.db');

const db = new Database(dbPath);

console.log('Migrating database for Velocity Tracker...');

// Add columns to cards
try {
  db.exec(`ALTER TABLE cards ADD COLUMN openDate TEXT`);
  console.log('Added openDate to cards.');
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error(e);
}

try {
  db.exec(`ALTER TABLE cards ADD COLUMN isBusiness BOOLEAN DEFAULT 0`);
  console.log('Added isBusiness to cards.');
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error(e);
}

// Add column to templates
try {
  db.exec(`ALTER TABLE templates ADD COLUMN isBusiness BOOLEAN DEFAULT 0`);
  console.log('Added isBusiness to templates.');
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error(e);
}

// Auto-flag business cards based on name
console.log('Auto-flagging business cards...');
const resultCards = db.exec(`UPDATE cards SET isBusiness = 1 WHERE name LIKE '%Business%' OR name LIKE '%Biz%'`);
const resultTemplates = db.exec(`UPDATE templates SET isBusiness = 1 WHERE name LIKE '%Business%' OR name LIKE '%Biz%'`);

console.log('Migration Complete!');
db.close();
