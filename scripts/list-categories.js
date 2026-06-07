const db = require('../lib/db');
const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
console.log(JSON.stringify(categories, null, 2));
