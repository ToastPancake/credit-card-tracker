import db from './lib/db.js';

try { db.prepare('ALTER TABLE issuers ADD COLUMN loginUrl TEXT').run(); console.log('Added loginUrl to issuers'); } catch(e) {}
try { db.prepare('ALTER TABLE cards ADD COLUMN productUrl TEXT').run(); console.log('Added productUrl to cards'); } catch(e) {}
try { db.prepare('ALTER TABLE templates ADD COLUMN productUrl TEXT').run(); console.log('Added productUrl to templates'); } catch(e) {}
try { db.prepare('ALTER TABLE cards ADD COLUMN quarterlyCategories TEXT').run(); console.log('Added quarterlyCategories to cards'); } catch(e) {}
try { db.prepare('ALTER TABLE templates ADD COLUMN quarterlyCategories TEXT').run(); console.log('Added quarterlyCategories to templates'); } catch(e) {}
