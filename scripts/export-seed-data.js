import db from '../lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tablesToExport = [
  'issuers',
  'common_categories',
  'templates',
  'template_categories',
  'template_intro_bonuses',
  'template_credits',
  'resource_sections',
  'resources'
];

const seedData = {};

try {
  tablesToExport.forEach(tableName => {
    console.log(`Exporting ${tableName}...`);
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    seedData[tableName] = rows;
  });

  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2), 'utf-8');
  console.log(`Successfully exported seed data to ${outputPath}`);

} catch (error) {
  console.error('Error exporting seed data:', error);
}
