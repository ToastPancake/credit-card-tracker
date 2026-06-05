import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const usages = db.prepare('SELECT * FROM credit_usage').all().map(u => ({
      ...u,
      isFullyUsed: u.isFullyUsed === 1
    }));
    return NextResponse.json(usages);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { creditId, period, usedAmount, isFullyUsed } = body;

    if (!creditId || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM credit_usage WHERE creditId = ? AND period = ?').get(creditId, period);

    if (existing) {
      db.prepare(`
        UPDATE credit_usage 
        SET usedAmount = @usedAmount, isFullyUsed = @isFullyUsed
        WHERE id = @id
      `).run({ 
        id: existing.id, 
        usedAmount: usedAmount || 0, 
        isFullyUsed: isFullyUsed ? 1 : 0 
      });
    } else {
      db.prepare(`
        INSERT INTO credit_usage (id, creditId, period, usedAmount, isFullyUsed)
        VALUES (@id, @creditId, @period, @usedAmount, @isFullyUsed)
      `).run({ 
        id: crypto.randomUUID(), 
        creditId, 
        period, 
        usedAmount: usedAmount || 0, 
        isFullyUsed: isFullyUsed ? 1 : 0 
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
