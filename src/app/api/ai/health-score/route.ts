import { NextResponse } from 'next/server';
import { calculateHealthScore } from '@/lib/groq/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalIncome, totalExpense, totalSavings, budgetAdherence, emergencyFundMonths } = body;

    const healthScore = await calculateHealthScore({
      totalIncome,
      totalExpense,
      totalSavings,
      budgetAdherence,
      emergencyFundMonths,
    });

    return NextResponse.json(healthScore);
  } catch (error) {
    console.error('Health Score error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    );
  }
}
