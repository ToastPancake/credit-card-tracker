import db from '../lib/db.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure templates table has the necessary columns
try { db.exec('ALTER TABLE templates ADD COLUMN productUrl TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE templates ADD COLUMN quarterlyCategories TEXT'); } catch (e) {}

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
  const insertTemplate = db.prepare('INSERT OR REPLACE INTO templates (id, name, issuerId, color, productUrl, quarterlyCategories) VALUES (?, ?, ?, ?, ?, ?)');
  const insertTemplateCategory = db.prepare('INSERT INTO template_categories (id, templateId, categoryId, multiplier) VALUES (?, ?, ?, ?)');
  
  const insertCredit = db.prepare(`
    INSERT INTO template_credits (id, templateId, name, amount, allowPartial, frequency, resetType, resetAnchorDate)
    VALUES (@id, @templateId, @name, @amount, @allowPartial, @frequency, @resetType, @resetAnchorDate)
  `);

  const insertBonus = db.prepare(`
    INSERT INTO template_intro_bonuses (id, templateId, type, description, deadline, spendRequirement, rewardAmount, modifierValue, categoryId)
    VALUES (@bonusId, @templateId, @type, @description, @deadline, @spendRequirement, @rewardAmount, @modifierValue, @categoryId)
  `);

  for (const t of templates) {
    if (t.issuer) {
      const existingIssuer = getIssuer.get(t.issuer);
      let issuerId;
      if (!existingIssuer) {
        issuerId = crypto.randomUUID();
        insertIssuer.run(issuerId, t.issuer);
      } else {
        issuerId = existingIssuer.id;
      }

      insertTemplate.run(
        t.id, 
        t.name, 
        issuerId, 
        t.color || '#4a61bd', 
        t.productUrl || null, 
        t.quarterlyCategories ? JSON.stringify(t.quarterlyCategories) : null
      );
      
      // Clear existing child records
      db.prepare('DELETE FROM template_categories WHERE templateId = ?').run(t.id);
      db.prepare('DELETE FROM template_credits WHERE templateId = ?').run(t.id);
      db.prepare('DELETE FROM template_intro_bonuses WHERE templateId = ?').run(t.id);
      
      if (t.categories) {
        for (const cat of t.categories) {
          let catId = categoryMap[cat.categoryName];
          if (!catId) {
            catId = crypto.randomUUID();
            insertCategory.run(catId, cat.categoryName);
            categoryMap[cat.categoryName] = catId;
          }
          insertTemplateCategory.run(crypto.randomUUID(), t.id, catId, cat.multiplier);
        }
      }

      if (t.credits) {
        for (const credit of t.credits) {
          insertCredit.run({
            id: crypto.randomUUID(),
            templateId: t.id,
            name: credit.name,
            amount: credit.amount,
            allowPartial: credit.allowPartial ? 1 : 0,
            frequency: credit.frequency || 'Annual',
            resetType: credit.resetType || 'Calendar',
            resetAnchorDate: credit.resetAnchorDate || null
          });
        }
      }

      if (t.introBonuses) {
        for (const bonus of t.introBonuses) {
          insertBonus.run({
            bonusId: crypto.randomUUID(),
            templateId: t.id,
            type: bonus.type,
            description: bonus.description || null,
            deadline: bonus.deadline || null,
            spendRequirement: bonus.spendRequirement || null,
            rewardAmount: bonus.rewardAmount || null,
            modifierValue: bonus.modifierValue || null,
            categoryId: bonus.categoryId || null
          });
        }
      }
    }
  }
}

console.log("Migration Complete! The database is now synced with lib/card-templates.json.");
