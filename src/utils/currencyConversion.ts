/**
 * Currency conversion utilities for multi-currency reporting
 * Implements functional currency approach following IFRS standards
 */

export interface CurrencyFlows {
  [currency: string]: {
    income: number;
    expenses: number;
    net: number;
  };
}

export interface ConsolidatedResult {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  functionalCurrency: string;
  exchangeRate: number;
  breakdown: {
    currency: string;
    income: number;
    expenses: number;
    net: number;
  }[];
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @param exchangeRate Exchange rate (1 USD = X ARS)
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    return amount / exchangeRate;
  } else if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    return amount * exchangeRate;
  }
  
  return amount;
};

/**
 * Consolidate multi-currency flows into a single functional currency
 * @param flows Flows by currency
 * @param functionalCurrency Target currency for consolidation (default: USD)
 * @param exchangeRate Current exchange rate (1 USD = X ARS) - optional, defaults to 1450
 */
export const consolidateFlows = (
  flows: CurrencyFlows,
  functionalCurrency: string = 'USD',
  exchangeRate?: number
): ConsolidatedResult => {
  const effectiveRate = exchangeRate || 1450;
  let totalIncome = 0;
  let totalExpenses = 0;
  const breakdown: ConsolidatedResult['breakdown'] = [];

  Object.entries(flows).forEach(([currency, data]) => {
    const convertedIncome = convertCurrency(
      data.income,
      currency,
      functionalCurrency,
      effectiveRate
    );
    const convertedExpenses = convertCurrency(
      data.expenses,
      currency,
      functionalCurrency,
      effectiveRate
    );

    totalIncome += convertedIncome;
    totalExpenses += convertedExpenses;

    breakdown.push({
      currency,
      income: data.income,
      expenses: data.expenses,
      net: data.net
    });
  });

  return {
    totalIncome,
    totalExpenses,
    netResult: totalIncome - totalExpenses,
    functionalCurrency,
    exchangeRate: effectiveRate,
    breakdown
  };
};

/**
 * Calculate annual yield based on property value
 * @param monthlyNetIncome Monthly net income in functional currency
 * @param propertyValue Property market value in same currency
 */
export const calculateYield = (
  monthlyNetIncome: number,
  propertyValue: number
): {
  monthlyIncome: number;
  annualIncome: number;
  grossYield: number;
  estimatedCapRate: number;
} => {
  const annualIncome = monthlyNetIncome * 12;
  const grossYield = propertyValue > 0 ? (annualIncome / propertyValue) * 100 : 0;
  const estimatedCapRate = grossYield * 0.85; // Assuming 15% operating expenses

  return {
    monthlyIncome: monthlyNetIncome,
    annualIncome,
    grossYield,
    estimatedCapRate
  };
};

/**
 * Format currency with proper locale
 */
export const formatCurrencyAmount = (
  amount: number,
  currency: string,
  locale: string = 'es-AR'
): string => {
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${currency} ${formatted}`;
};
