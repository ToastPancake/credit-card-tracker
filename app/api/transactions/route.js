import { NextResponse } from 'next/server';
import { connectActual, getTransactions, shutdownActual } from '@/lib/actual-api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request) {
  try {
    const { accountId, subSpendReq = 0 } = await request.json();
    
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    await connectActual();
    
    const transactions = await getTransactions(accountId);
    
    await shutdownActual();

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
