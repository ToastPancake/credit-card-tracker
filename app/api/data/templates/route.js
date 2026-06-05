import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  const templates = db.prepare(`
    SELECT t.id, t.name, t.color, t.productUrl, t.quarterlyCategories, i.name as issuer
    FROM templates t
    LEFT JOIN issuers i ON t.issuerId = i.id
    ORDER BY t.name ASC
  `).all();

  const getCats = db.prepare(`
    SELECT tc.multiplier, c.name as categoryName
    FROM template_categories tc
    JOIN common_categories c ON tc.categoryId = c.id
    WHERE tc.templateId = ?
  `);

  const getBonuses = db.prepare(`
    SELECT * FROM template_intro_bonuses
    WHERE templateId = ?
  `);

  for (const t of templates) {
    t.categories = getCats.all(t.id);
    t.introBonuses = getBonuses.all(t.id);
    if (t.quarterlyCategories) {
      try { t.quarterlyCategories = JSON.parse(t.quarterlyCategories); } catch(e) {}
    }
  }

  return NextResponse.json(templates);
}

export async function POST(req) {
  const t = await req.json();
  const id = t.id || crypto.randomUUID();
  
  const issuer = db.prepare('SELECT id FROM issuers WHERE name = ?').get(t.issuer);
  const issuerId = issuer ? issuer.id : null;
  const productUrl = t.productUrl || null;
  const quarterlyCategories = t.quarterlyCategories ? JSON.stringify(t.quarterlyCategories) : null;

  const tx = db.transaction(() => {
    db.prepare('INSERT OR REPLACE INTO templates (id, name, issuerId, color, productUrl, quarterlyCategories) VALUES (?, ?, ?, ?, ?, ?)').run(id, t.name, issuerId, t.color || '#4a61bd', productUrl, quarterlyCategories);
    db.prepare('DELETE FROM template_categories WHERE templateId = ?').run(id);
    db.prepare('DELETE FROM template_intro_bonuses WHERE templateId = ?').run(id);
    
    const insertCat = db.prepare('INSERT INTO template_categories (id, templateId, categoryId, multiplier) VALUES (?, ?, ?, ?)');
    for (const cat of t.categories) {
      const dbCat = db.prepare('SELECT id FROM common_categories WHERE name = ?').get(cat.categoryName);
      if (dbCat) {
        insertCat.run(crypto.randomUUID(), id, dbCat.id, cat.multiplier);
      }
    }

    const insertBonus = db.prepare(`
      INSERT INTO template_intro_bonuses (id, templateId, type, description, deadline, spendRequirement, rewardAmount, modifierValue, categoryId)
      VALUES (@bonusId, @templateId, @type, @description, @deadline, @spendRequirement, @rewardAmount, @modifierValue, @categoryId)
    `);

    for (const bonus of (t.introBonuses || [])) {
      insertBonus.run({
        bonusId: crypto.randomUUID(),
        templateId: id,
        type: bonus.type,
        description: bonus.description || null,
        deadline: bonus.deadline || null,
        spendRequirement: bonus.spendRequirement || null,
        rewardAmount: bonus.rewardAmount || null,
        modifierValue: bonus.modifierValue || null,
        categoryId: bonus.categoryId || null
      });
    }
  });
  
  tx();
  return NextResponse.json({ id });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
