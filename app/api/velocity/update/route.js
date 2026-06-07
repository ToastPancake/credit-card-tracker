import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { id, openDate, isBusiness } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Missing card ID" }, { status: 400 });
    }

    db.prepare(`UPDATE cards SET openDate = ?, isBusiness = ? WHERE id = ?`).run(
      openDate || null, 
      isBusiness ? 1 : 0, 
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
