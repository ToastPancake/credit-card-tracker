import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  const issuers = db.prepare('SELECT * FROM issuers ORDER BY name ASC').all();
  return NextResponse.json(issuers);
}

export async function POST(req) {
  const { id, name, loginUrl } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  
  if (id) {
    db.prepare('UPDATE issuers SET name = ?, loginUrl = ? WHERE id = ?').run(name, loginUrl || null, id);
    return NextResponse.json({ id, name, loginUrl });
  } else {
    const newId = crypto.randomUUID();
    db.prepare('INSERT INTO issuers (id, name, loginUrl) VALUES (?, ?, ?)').run(newId, name, loginUrl || null);
    return NextResponse.json({ id: newId, name, loginUrl });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM issuers WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
