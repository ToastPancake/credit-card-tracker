import { NextResponse } from 'next/server';
import { connectActual, getTransactions, shutdownActual } from '@/lib/actual-api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Bulk mode
    if (body.requests && Array.isArray(body.requests)) {
      await connectActual();
      const results = {};
      
      for (const req of body.requests) {
        const { accountId, subSpendReq = 0 } = req;
        const transactions = await getTransactions(accountId);
        
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let totalSpend = 0;
        let completionDate = null;

        sorted.forEach(t => {
          if (t.amount < 0 && !t.is_transfer && !t.is_parent && !t.starting_balance_flag) {
            totalSpend += Math.abs(t.amount / 100);
            if (subSpendReq > 0 && !completionDate && totalSpend >= subSpendReq) {
              completionDate = t.date;
            }
          }
        });
        
        results[accountId] = { totalSpend, completionDate };
      }
      
      return NextResponse.json(results);
    }
    
    // Single mode
    const { accountId, subSpendReq = 0 } = body;
    
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const transactions = await getTransactions(accountId);

    // Sort ascending (oldest first) to find exact completion date
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalSpend = 0;
    let completionDate = null;

    sorted.forEach(t => {
      // ActualBudget amounts are stored as integers multiplied by 100. Negative = outflow
      if (t.amount < 0 && !t.is_transfer && !t.is_parent && !t.starting_balance_flag) {
        totalSpend += Math.abs(t.amount / 100);
        
        if (subSpendReq > 0 && !completionDate && totalSpend >= subSpendReq) {
          completionDate = t.date;
        }
      }
    });

    return NextResponse.json({ 
      transactionCount: transactions.length,
      totalSpend,
      completionDate,
      // return recent 50 for UI display
      transactions: sorted.reverse().slice(0, 50) 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
