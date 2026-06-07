import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath);

const categories = db.prepare('SELECT id, name FROM common_categories ORDER BY name').all();
console.log(JSON.stringify(categories, null, 2));
