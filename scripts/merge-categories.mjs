import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath);

const merges = [
  { primary: "Groceries", duplicates: ["Grocery Stores", "Supermarkets"] },
  { primary: "Dining", duplicates: ["Restaurants"] },
  { primary: "Gas Stations", duplicates: ["Gas"] },
  { primary: "Hotels", duplicates: ["Hotel Stays"] },
  { primary: "Marriott", duplicates: ["Marriott Bonvoy Hotels"] },
  { primary: "Streaming", duplicates: ["Popular Streaming", "Select Streaming Services"] },
  { primary: "Quarterly Rotating", duplicates: ["Rotating Quarterly Categories"] }
];

console.log("Starting category merges...");

const getCatId = db.prepare('SELECT id FROM common_categories WHERE name = ?');
const updateIntroBonuses = db.prepare('UPDATE intro_bonuses SET categoryId = ? WHERE categoryId = ?');
const updateTemplateCats = db.prepare('UPDATE template_categories SET categoryId = ? WHERE categoryId = ?');
const updateTemplateIntroBonuses = db.prepare('UPDATE template_intro_bonuses SET categoryId = ? WHERE categoryId = ?');
const deleteCommonCat = db.prepare('DELETE FROM common_categories WHERE id = ?');
const updateCategories = db.prepare('UPDATE categories SET categoryName = ? WHERE id = ?');

const getAllCategories = db.prepare('SELECT id, categoryName FROM categories').all();

db.transaction(() => {
  for (const merge of merges) {
    const primaryRow = getCatId.get(merge.primary);
    if (!primaryRow) {
      console.warn(`Primary category "${merge.primary}" not found, skipping...`);
      continue;
    }
    const primaryId = primaryRow.id;

    for (const dupName of merge.duplicates) {
      const dupRow = getCatId.get(dupName);
      if (!dupRow) {
        console.warn(`Duplicate category "${dupName}" not found, skipping...`);
        continue;
      }
      const dupId = dupRow.id;

      // 1. Update intro bonuses and templates
      updateIntroBonuses.run(primaryId, dupId);
      updateTemplateCats.run(primaryId, dupId);
      updateTemplateIntroBonuses.run(primaryId, dupId);

      // 2. Delete duplicate common category
      deleteCommonCat.run(dupId);

      // 3. Update categories table (categoryName column)
      for (const cat of getAllCategories) {
        let newName = null;
        if (cat.categoryName === dupName) {
          newName = merge.primary;
        } else if (cat.categoryName.endsWith(`: ${dupName}`)) {
          newName = cat.categoryName.replace(`: ${dupName}`, `: ${merge.primary}`);
        }
        
        if (newName) {
          updateCategories.run(newName, cat.id);
        }
      }

      console.log(`Merged "${dupName}" into "${merge.primary}".`);
    }
  }
})();

console.log("Merge complete!");
