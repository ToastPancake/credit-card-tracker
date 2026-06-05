import db from '../lib/db.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMON_CATEGORIES = [
  'Dining', 'Groceries', 'Gas', 'Travel', 'Drugstores', 
  'Streaming', 'Home Improvement', 'Online Shopping', 'Transit',
  'Everything', 'Top Category', 'Quarterly Rotating'
];

// 1. Insert Categories
console.log("Migrating Categories...");
const insertCategory = db.prepare('INSERT OR IGNORE INTO common_categories (id, name) VALUES (?, ?)');
const categoryMap = {}; // name -> id

for (const name of COMMON_CATEGORIES) {
  const id = crypto.randomUUID();
  insertCategory.run(id, name);
}

// Map back what's in the DB to get IDs
const dbCats = db.prepare('SELECT id, name FROM common_categories').all();
for (const cat of dbCats) {
  categoryMap[cat.name] = cat.id;
}

// 2. Insert Templates & Issuers from JSON
const templatesPath = path.join(__dirname, '..', 'lib', 'card-templates.json');
if (fs.existsSync(templatesPath)) {
  console.log("Migrating Templates and Issuers...");
  const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
  
  const insertIssuer = db.prepare('INSERT OR IGNORE INTO issuers (id, name) VALUES (?, ?)');
  const getIssuer = db.prepare('SELECT id FROM issuers WHERE name = ?');
  const insertTemplate = db.prepare('INSERT OR IGNORE INTO templates (id, name, issuerId, color) VALUES (?, ?, ?, ?)');
  const insertTemplateCategory = db.prepare('INSERT INTO template_categories (id, templateId, categoryId, multiplier) VALUES (?, ?, ?, ?)');

  for (const t of templates) {
    // Handle Issuer
    if (t.issuer) {
      const existingIssuer = getIssuer.get(t.issuer);
      let issuerId;
      if (!existingIssuer) {
        issuerId = crypto.randomUUID();
        insertIssuer.run(issuerId, t.issuer);
      } else {
        issuerId = existingIssuer.id;
      }

      // Handle Template
      insertTemplate.run(t.id, t.name, issuerId, t.color || '#4a61bd');
      
      // Handle Template Categories
      db.prepare('DELETE FROM template_categories WHERE templateId = ?').run(t.id);
      
      for (const cat of t.categories) {
        let catId = categoryMap[cat.categoryName];
        if (!catId) {
          // If a category from the template isn't in common_categories, add it!
          catId = crypto.randomUUID();
          insertCategory.run(catId, cat.categoryName);
          categoryMap[cat.categoryName] = catId;
        }
        
        insertTemplateCategory.run(crypto.randomUUID(), t.id, catId, cat.multiplier);
      }
    }
  }
}

console.log("Migration Complete!");
