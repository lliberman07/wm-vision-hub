import { useMemo } from 'react';

export interface AmortizationRow {
  mes: number;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

/**
 * Hook to calculate amortization table using French system (Sistema Francés)
 * Standard formula used in Argentine mortgage market
 */
export const useAmortizationTable = (
  montoInicial: number,
  tasaMensual: number,
  plazoMeses: number
) => {
  const table = useMemo((): AmortizationRow[] => {
    if (!montoInicial || !tasaMensual || !plazoMeses) return [];

    const result: AmortizationRow[] = [];
    
    // Calculate fixed monthly installment (Sistema Francés - French System)
    const factor = Math.pow(1 + tasaMensual, plazoMeses);
    const cuotaFija = (montoInicial * tasaMensual * factor) / (factor - 1);
    
    let saldoRestante = montoInicial;

    for (let mes = 1; mes <= plazoMeses; mes++) {
      // Interest for this month is calculated on remaining balance
      const interes = saldoRestante * tasaMensual;
      
      // Capital amortization is the difference between fixed installment and interest
      const capital = cuotaFija - interes;
      
      // Update remaining balance
      saldoRestante = saldoRestante - capital;
      
      // Handle rounding errors in last installment
      if (mes === plazoMeses && Math.abs(saldoRestante) < 0.01) {
        saldoRestante = 0;
      }

      result.push({
        mes,
        cuota: cuotaFija,
        capital,
        interes,
        saldo: Math.max(0, saldoRestante)
      });
    }

    return result;
  }, [montoInicial, tasaMensual, plazoMeses]);

  return table;
};
