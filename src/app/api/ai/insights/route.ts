import { NextResponse } from 'next/server';
import { generateSpendingInsights } from '@/lib/groq/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalIncome, totalExpense, categoryBreakdown, monthlyTrend } = body;

    const insights = await generateSpendingInsights({
      totalIncome,
      totalExpense,
      categoryBreakdown,
      monthlyTrend,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
