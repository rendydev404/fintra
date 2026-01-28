// Currency conversion utilities

export interface ExchangeRates {
  rates: Record<string, number>;
  base: string;
  cached: boolean;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  cached: boolean;
}

/**
 * Fetch exchange rates from the API
 */
export async function getExchangeRates(base: string = 'IDR'): Promise<ExchangeRates> {
  const res = await fetch(`/api/exchange-rates?base=${base}`);
  if (!res.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  return res.json();
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<ConversionResult> {
  const res = await fetch(
    `/api/exchange-rates?from=${from}&to=${to}&amount=${amount}&base=${from}`
  );
  if (!res.ok) {
    throw new Error('Failed to convert currency');
  }
  return res.json();
}

/**
 * Convert multiple amounts at once using a single rate fetch
 */
export async function convertMultipleAmounts(
  amounts: number[],
  from: string,
  to: string
): Promise<number[]> {
  if (from === to) return amounts;
  
  // Fetch rates once
  const ratesData = await getExchangeRates(from);
  const rate = ratesData.rates[to] || 1;
  
  // Convert all amounts
  return amounts.map(amount => Math.round(amount * rate * 100) / 100);
}

/**
 * Get the exchange rate between two currencies
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  const conversion = await convertCurrency(1, from, to);
  return conversion.rate;
}
