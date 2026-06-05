import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  const categories = db.prepare('SELECT * FROM common_categories ORDER BY name ASC').all();
  return NextResponse.json(categories);
}

export async function POST(req) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO common_categories (id, name) VALUES (?, ?)').run(id, name);
  return NextResponse.json({ id, name });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM common_categories WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
