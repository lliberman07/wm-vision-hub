interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number | null;
  requiresConversion: boolean;
}

export function useCurrencyConverter() {
  const convertPayment = (
    amountInPaymentCurrency: number,
    paymentCurrency: string,
    contractCurrency: string,
    exchangeRate?: number
  ): ConversionResult => {
    // Si las monedas son iguales, no hay conversión
    if (paymentCurrency === contractCurrency) {
      return {
        originalAmount: amountInPaymentCurrency,
        originalCurrency: paymentCurrency,
        convertedAmount: amountInPaymentCurrency,
        convertedCurrency: contractCurrency,
        exchangeRate: null,
        requiresConversion: false
      };
    }

    // Si hay conversión, requiere exchange rate
    if (!exchangeRate || exchangeRate <= 0) {
      throw new Error('Se requiere tipo de cambio válido');
    }

    // Convertir: si pago en ARS y contrato en USD -> dividir
    // Si pago en USD y contrato en ARS -> multiplicar
    const convertedAmount = paymentCurrency === 'ARS' && contractCurrency === 'USD'
      ? amountInPaymentCurrency / exchangeRate
      : paymentCurrency === 'USD' && contractCurrency === 'ARS'
      ? amountInPaymentCurrency * exchangeRate
      : amountInPaymentCurrency;

    return {
      originalAmount: amountInPaymentCurrency,
      originalCurrency: paymentCurrency,
      convertedAmount,
      convertedCurrency: contractCurrency,
      exchangeRate,
      requiresConversion: true
    };
  };

  return { convertPayment };
}
