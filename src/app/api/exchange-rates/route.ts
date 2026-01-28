import { NextResponse } from 'next/server';

// Cache for exchange rates (1 hour)
let ratesCache: { rates: Record<string, number>; base: string; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || 'IDR';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = parseFloat(searchParams.get('amount') || '0');

    // Check if we have cached rates for this base currency
    const now = Date.now();
    if (
      ratesCache &&
      ratesCache.base === base &&
      now - ratesCache.timestamp < CACHE_DURATION
    ) {
      // Use cached rates
      if (from && to && amount) {
        const convertedAmount = convertAmount(amount, from, to, ratesCache.rates, base);
        return NextResponse.json({
          from,
          to,
          amount,
          result: convertedAmount,
          rate: getRate(from, to, ratesCache.rates, base),
          cached: true,
        });
      }
      return NextResponse.json({ rates: ratesCache.rates, base, cached: true });
    }

    // Fetch fresh rates from ExchangeRate-API (free tier)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Update cache
    ratesCache = {
      rates: data.rates,
      base: data.base,
      timestamp: now,
    };

    // If conversion requested, calculate it
    if (from && to && amount) {
      const convertedAmount = convertAmount(amount, from, to, data.rates, base);
      return NextResponse.json({
        from,
        to,
        amount,
        result: convertedAmount,
        rate: getRate(from, to, data.rates, base),
        cached: false,
      });
    }

    return NextResponse.json({ rates: data.rates, base: data.base, cached: false });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

function getRate(
  from: string,
  to: string,
  rates: Record<string, number>,
  base: string
): number {
  if (from === base) {
    return rates[to] || 1;
  }
  if (to === base) {
    return 1 / (rates[from] || 1);
  }
  // Cross rate: FROM -> BASE -> TO
  const fromToBase = 1 / (rates[from] || 1);
  const baseToTo = rates[to] || 1;
  return fromToBase * baseToTo;
}

function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
  base: string
): number {
  if (from === to) return amount;
  const rate = getRate(from, to, rates, base);
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
}
