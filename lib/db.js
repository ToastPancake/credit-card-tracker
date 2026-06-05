import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    actualAccountId TEXT,
    subSpendRequirement REAL DEFAULT 0,
    subReward TEXT,
    subDeadline TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    cardId TEXT NOT NULL,
    categoryName TEXT NOT NULL,
    multiplier REAL NOT NULL,
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS intro_bonuses (
    id TEXT PRIMARY KEY,
    cardId TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    spendRequirement REAL,
    rewardAmount TEXT,
    modifierValue REAL,
    categoryId TEXT,
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES common_categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY,
    cardId TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL, -- 'Monthly', 'Annual', etc.
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS issuers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS common_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    issuerId TEXT,
    color TEXT,
    FOREIGN KEY (issuerId) REFERENCES issuers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS template_categories (
    id TEXT PRIMARY KEY,
    templateId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    multiplier REAL NOT NULL,
    FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES common_categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS template_intro_bonuses (
    id TEXT PRIMARY KEY,
    templateId TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    spendRequirement REAL,
    rewardAmount TEXT,
    modifierValue REAL,
    categoryId TEXT,
    FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES common_categories(id) ON DELETE SET NULL
  );
`);

export default db;
