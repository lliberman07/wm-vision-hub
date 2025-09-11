export const formatNumber = (value: number, language: 'en' | 'es'): string => {
  const rounded = Math.round(value);
  
  if (language === 'es') {
    // Spanish format: 1.000.000
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // English format: 1,000,000
    return rounded.toLocaleString('en-US');
  }
};

export const formatCurrency = (value: number, language: 'en' | 'es'): string => {
  return `$${formatNumber(value, language)}`;
};

export const parseFormattedNumber = (value: string): number => {
  // Remove all non-digit characters except the minus sign
  const cleaned = value.replace(/[^\d-]/g, '');
  return parseInt(cleaned) || 0;
};