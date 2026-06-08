import { NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const seedFilePath = path.join(process.cwd(), 'data', 'seed.json');
    if (!fs.existsSync(seedFilePath)) {
      return NextResponse.json({ error: 'seed.json not found at ' + seedFilePath }, { status: 404 });
    }

    const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    
    const tablesToSeed = [
      'issuers',
      'common_categories',
      'templates',
      'template_categories',
      'template_intro_bonuses',
      'template_credits',
      'resource_sections',
      'resources'
    ];

    let seededCount = 0;

    db.transaction(() => {
      tablesToSeed.forEach(tableName => {
        if (seedData[tableName] && seedData[tableName].length > 0) {
          const rows = seedData[tableName];
          const keys = Object.keys(rows[0]);
          const columns = keys.join(', ');
          const placeholders = keys.map(() => '?').join(', ');
          
          const insertStmt = db.prepare(`INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES (${placeholders})`);
          for (const row of rows) {
            insertStmt.run(keys.map(k => row[k]));
            seededCount++;
          }
        }
      });
    })();

    return NextResponse.json({ success: true, seededCount, message: 'Database seeded successfully.' });
  } catch (error) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
