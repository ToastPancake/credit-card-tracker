import { NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
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

    tablesToExport.forEach(tableName => {
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      seedData[tableName] = rows;
    });

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'seed.json');
    fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully exported generic templates and resources to data/seed.json!',
      path: outputPath
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
