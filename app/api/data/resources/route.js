import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const sections = db.prepare('SELECT * FROM resource_sections ORDER BY orderIndex ASC').all();
    const resources = db.prepare('SELECT * FROM resources ORDER BY orderIndex ASC').all();

    const sectionsWithResources = sections.map(s => ({
      ...s,
      resources: resources.filter(r => r.sectionId === s.id)
    }));

    return NextResponse.json(sectionsWithResources);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sections = await request.json();

    const insertSection = db.prepare('INSERT INTO resource_sections (id, name, orderIndex) VALUES (?, ?, ?)');
    const insertResource = db.prepare('INSERT INTO resources (id, sectionId, name, url, description, orderIndex) VALUES (?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
      // Clear existing to perform bulk replace
      db.prepare('DELETE FROM resources').run();
      db.prepare('DELETE FROM resource_sections').run();

      sections.forEach((s, sIdx) => {
        const sectionId = s.id || uuidv4();
        insertSection.run(sectionId, s.name, sIdx);

        if (s.resources && Array.isArray(s.resources)) {
          s.resources.forEach((r, rIdx) => {
            insertResource.run(r.id || uuidv4(), sectionId, r.name, r.url, r.description || '', rIdx);
          });
        }
      });
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
