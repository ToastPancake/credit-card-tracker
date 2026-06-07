import db from '../lib/db.js';

console.log("Migrating new fields...");

try { 
  db.exec('ALTER TABLE cards ADD COLUMN annualFee REAL DEFAULT 0'); 
  console.log("Added annualFee to cards");
} catch (e) {
  console.log("cards.annualFee might already exist: " + e.message);
}

try { 
  db.exec('ALTER TABLE templates ADD COLUMN annualFee REAL DEFAULT 0'); 
  console.log("Added annualFee to templates");
} catch (e) {
  console.log("templates.annualFee might already exist: " + e.message);
}

try { 
  db.exec('ALTER TABLE credits ADD COLUMN type TEXT DEFAULT "General"'); 
  console.log("Added type to credits");
} catch (e) {
  console.log("credits.type might already exist: " + e.message);
}

try { 
  db.exec('ALTER TABLE template_credits ADD COLUMN type TEXT DEFAULT "General"'); 
  console.log("Added type to template_credits");
} catch (e) {
  console.log("template_credits.type might already exist: " + e.message);
}

// Check for quarterlyCategories and productUrl in cards
try {
  db.exec('ALTER TABLE cards ADD COLUMN quarterlyCategories TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE cards ADD COLUMN productUrl TEXT');
} catch (e) {}

console.log("Migration complete!");
