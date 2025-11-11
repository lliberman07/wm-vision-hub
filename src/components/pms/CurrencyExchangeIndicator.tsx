import { DollarSign, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/numberFormat';

interface CurrencyExchangeIndicatorProps {
  contractCurrency: string;
  paymentCurrency: string;
  exchangeRate?: number;
  originalAmount: number;
  convertedAmount?: number;
}

export function CurrencyExchangeIndicator({
  contractCurrency,
  paymentCurrency,
  exchangeRate,
  originalAmount,
  convertedAmount
}: CurrencyExchangeIndicatorProps) {
  if (contractCurrency === paymentCurrency) {
    return null; // No mostrar si no hay conversión
  }

  return (
    <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        <span className="font-medium text-blue-700 dark:text-blue-300">
          {formatCurrency(originalAmount, 'es', contractCurrency as 'ARS' | 'USD')}
        </span>
        <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
        <span className="font-medium text-blue-700 dark:text-blue-300">
          {formatCurrency(convertedAmount || 0, 'es', paymentCurrency as 'ARS' | 'USD')}
        </span>
      </div>
      {exchangeRate && (
        <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
          TC: {exchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Badge>
      )}
    </div>
  );
}
