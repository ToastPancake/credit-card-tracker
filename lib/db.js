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
    color TEXT,
    productUrl TEXT,
    quarterlyCategories TEXT,
    annualFee REAL DEFAULT 0,
    openDate TEXT,
    isBusiness BOOLEAN DEFAULT 0
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
    allowPartial BOOLEAN DEFAULT 0,
    frequency TEXT NOT NULL,
    resetType TEXT NOT NULL DEFAULT 'Calendar',
    resetAnchorDate TEXT,
    type TEXT DEFAULT 'General',
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
    productUrl TEXT,
    annualFee REAL DEFAULT 0,
    isBusiness BOOLEAN DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS template_credits (
    id TEXT PRIMARY KEY,
    templateId TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    allowPartial BOOLEAN DEFAULT 0,
    frequency TEXT NOT NULL,
    resetType TEXT NOT NULL DEFAULT 'Calendar',
    resetAnchorDate TEXT,
    type TEXT DEFAULT 'General',
    FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
  );

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

export default db;
