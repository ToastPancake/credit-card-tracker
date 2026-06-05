import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const cards = db.prepare(`
      SELECT c.*, i.loginUrl as issuerLoginUrl
      FROM cards c
      LEFT JOIN issuers i ON c.issuer = i.name
    `).all();
    
    const categories = db.prepare('SELECT * FROM categories').all();
    const introBonuses = db.prepare('SELECT * FROM intro_bonuses').all();
    
    const cardsWithData = cards.map(card => {
      let qCats = null;
      if (card.quarterlyCategories) {
        try { qCats = JSON.parse(card.quarterlyCategories); } catch(e) {}
      }

      return {
        ...card,
        quarterlyCategories: qCats,
        categories: categories.filter(c => c.cardId === card.id).map(c => ({
          categoryName: c.categoryName,
          multiplier: c.multiplier
        })),
        introBonuses: introBonuses.filter(ib => ib.cardId === card.id)
      };
    });
    
    return NextResponse.json(cardsWithData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    
    const actualAccountId = body.actualAccountId || null;
    const color = body.color || '#3b82f6';
    const productUrl = body.productUrl || null;
    const quarterlyCategories = body.quarterlyCategories ? JSON.stringify(body.quarterlyCategories) : null;
    
    const categories = body.categories || [];
    const introBonuses = body.introBonuses || [];

    const insertCard = db.prepare(`
      INSERT INTO cards (id, name, issuer, actualAccountId, color, productUrl, quarterlyCategories)
      VALUES (@id, @name, @issuer, @actualAccountId, @color, @productUrl, @quarterlyCategories)
    `);
    
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, cardId, categoryName, multiplier)
      VALUES (@catId, @cardId, @categoryName, @multiplier)
    `);

    const insertIntroBonus = db.prepare(`
      INSERT INTO intro_bonuses (id, cardId, type, description, deadline, spendRequirement, rewardAmount, modifierValue, categoryId)
      VALUES (@bonusId, @cardId, @type, @description, @deadline, @spendRequirement, @rewardAmount, @modifierValue, @categoryId)
    `);

    const transaction = db.transaction(() => {
      insertCard.run({ 
        id, 
        name: body.name, 
        issuer: body.issuer, 
        actualAccountId, 
        color,
        productUrl,
        quarterlyCategories
      });

      for (const cat of categories) {
        insertCategory.run({
          catId: crypto.randomUUID(),
          cardId: id,
          categoryName: cat.categoryName,
          multiplier: cat.multiplier
        });
      }

      for (const bonus of introBonuses) {
        insertIntroBonus.run({
          bonusId: crypto.randomUUID(),
          cardId: id,
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
    
    transaction();
    
    return NextResponse.json({ id, ...body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing card ID" }, { status: 400 });

    const body = await request.json();
    const actualAccountId = body.actualAccountId || null;
    const color = body.color || '#3b82f6';
    const productUrl = body.productUrl || null;
    const quarterlyCategories = body.quarterlyCategories ? JSON.stringify(body.quarterlyCategories) : null;
    
    const categories = body.categories || [];
    const introBonuses = body.introBonuses || [];

    const updateCard = db.prepare(`
      UPDATE cards 
      SET name = @name, issuer = @issuer, actualAccountId = @actualAccountId, color = @color, productUrl = @productUrl, quarterlyCategories = @quarterlyCategories
      WHERE id = @id
    `);

    const deleteCategories = db.prepare(`DELETE FROM categories WHERE cardId = ?`);
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, cardId, categoryName, multiplier)
      VALUES (@catId, @cardId, @categoryName, @multiplier)
    `);

    const deleteIntroBonuses = db.prepare(`DELETE FROM intro_bonuses WHERE cardId = ?`);
    const insertIntroBonus = db.prepare(`
      INSERT INTO intro_bonuses (id, cardId, type, description, deadline, spendRequirement, rewardAmount, modifierValue, categoryId)
      VALUES (@bonusId, @cardId, @type, @description, @deadline, @spendRequirement, @rewardAmount, @modifierValue, @categoryId)
    `);

    const transaction = db.transaction(() => {
      updateCard.run({ 
        id, 
        name: body.name, 
        issuer: body.issuer, 
        actualAccountId, 
        color,
        productUrl,
        quarterlyCategories
      });
      
      deleteCategories.run(id);

      for (const cat of categories) {
        insertCategory.run({
          catId: crypto.randomUUID(),
          cardId: id,
          categoryName: cat.categoryName,
          multiplier: parseFloat(cat.multiplier) || 1
        });
      }

      deleteIntroBonuses.run(id);

      for (const bonus of introBonuses) {
        insertIntroBonus.run({
          bonusId: crypto.randomUUID(),
          cardId: id,
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
    
    transaction();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing card ID" }, { status: 400 });

    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
