import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { connectActual, getTransactions, shutdownActual } from '@/lib/actual-api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const cards = db.prepare(`SELECT id, name, issuer, actualAccountId, openDate, isBusiness, color FROM cards`).all();
    
    let needsDbUpdate = false;
    let actualConnected = false;

    // Check if any card needs an openDate inferred from ActualBudget
    for (const card of cards) {
      if (!card.openDate && card.actualAccountId) {
        if (!actualConnected) {
          await connectActual();
          actualConnected = true;
        }

        try {
          const transactions = await getTransactions(card.actualAccountId);
          if (transactions && transactions.length > 0) {
            // Find earliest transaction
            const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
            const firstDate = sorted[0].date;
            
            card.openDate = firstDate;
            db.prepare(`UPDATE cards SET openDate = ? WHERE id = ?`).run(firstDate, card.id);
            needsDbUpdate = true;
          }
        } catch (e) {
          console.error(`Failed to fetch transactions for ${card.name}:`, e);
        }
      }
    }

    // Sort cards by openDate descending
    cards.sort((a, b) => {
      if (!a.openDate) return 1;
      if (!b.openDate) return -1;
      return new Date(b.openDate) - new Date(a.openDate);
    });

    // Calculate Rules
    const now = new Date();
    
    // Chase 5/24
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(now.getMonth() - 24);
    
    const chase524Cards = cards.filter(c => {
      if (!c.openDate) return false;
      const opened = new Date(c.openDate);
      if (opened < twentyFourMonthsAgo) return false;
      
      // Business cards don't count, except CapOne and Discover
      if (c.isBusiness) {
        if (!c.issuer.includes('Capital One') && !c.issuer.includes('Discover')) {
          return false;
        }
      }
      return true;
    });

    // Amex 2/90
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const amex290Cards = cards.filter(c => {
      if (!c.openDate || !c.issuer.includes('Amex')) return false;
      return new Date(c.openDate) >= ninetyDaysAgo;
    });

    // Citi 8/65
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(now.getDate() - 8);
    const sixtyFiveDaysAgo = new Date();
    sixtyFiveDaysAgo.setDate(now.getDate() - 65);
    
    const citiCards = cards.filter(c => c.issuer.includes('Citi') && c.openDate);
    const citi8Days = citiCards.filter(c => new Date(c.openDate) >= eightDaysAgo);
    const citi65Days = citiCards.filter(c => new Date(c.openDate) >= sixtyFiveDaysAgo);

    return NextResponse.json({
      cards,
      rules: {
        chase524: {
          count: chase524Cards.length,
          cards: chase524Cards,
          limit: 5
        },
        amex290: {
          count: amex290Cards.length,
          limit: 2
        },
        citi865: {
          count8: citi8Days.length,
          count65: citi65Days.length,
          limit8: 1,
          limit65: 2
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
