import { useMemo } from 'react';
import { InvestmentItem, CreditLine, FinancialAnalysis, Alert, CreditType } from '@/types/investment';

export const useInvestmentCalculations = (
  items: InvestmentItem[],
  estimatedMonthlyIncome: number = 0,
  grossMarginPercentage: number = 30
) => {
  return useMemo(() => {
    const selectedItems = items.filter(item => item.isSelected);
    
    const totalInvestment = selectedItems.reduce((sum, item) => sum + item.amount, 0);
    const totalAdvances = selectedItems.reduce((sum, item) => sum + item.advanceAmount, 0);
    const totalFinanced = selectedItems.reduce((sum, item) => sum + item.financeBalance, 0);

    // Group by credit type
    const creditLines: Record<CreditType, { items: InvestmentItem[], total: number }> = {
      personal: { items: [], total: 0 },
      capital: { items: [], total: 0 },
      mortgage: { items: [], total: 0 }
    };

    selectedItems.forEach(item => {
      if (item.financeBalance > 0) {
        creditLines[item.creditType].items.push(item);
        creditLines[item.creditType].total += item.financeBalance;
      }
    });

    // Calculate monthly payments (default rates)
    const calculateMonthlyPayment = (amount: number, rate: number, months: number): number => {
      if (rate === 0) return Math.round(amount / months);
      const monthlyRate = rate / 100 / 12;
      return Math.round(amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
             (Math.pow(1 + monthlyRate, months) - 1));
    };

    const defaultRates: Record<CreditType, { rate: number, term: number }> = {
      personal: { rate: 35, term: 24 },
      capital: { rate: 25, term: 60 },
      mortgage: { rate: 12, term: 240 }
    };

    let monthlyPaymentTotal = 0;
    const creditLinesData: CreditLine[] = [];

    Object.entries(creditLines).forEach(([type, data]) => {
      if (data.total > 0) {
        const { rate, term } = defaultRates[type as CreditType];
        const monthlyPayment = calculateMonthlyPayment(data.total, rate, term);
        monthlyPaymentTotal += monthlyPayment;
        
        creditLinesData.push({
          type: type as CreditType,
          totalAmount: data.total,
          interestRate: rate,
          termMonths: term,
          monthlyPayment
        });
      }
    });

    // Financial analysis
    const netMonthlyIncome = estimatedMonthlyIncome * (grossMarginPercentage / 100);
    const breakEvenMonths = netMonthlyIncome > 0 ? totalInvestment / netMonthlyIncome : 0;
    const paybackPeriod = totalAdvances > 0 && netMonthlyIncome > 0 ? totalAdvances / netMonthlyIncome : 0;
    const roi = estimatedMonthlyIncome > 0 ? (netMonthlyIncome * 12 / totalInvestment) * 100 : 0;

    // Generate alerts
    const alerts: Alert[] = [];
    
    const debtToIncomeRatio = estimatedMonthlyIncome > 0 ? (monthlyPaymentTotal / estimatedMonthlyIncome) * 100 : 0;
    if (debtToIncomeRatio > 40) {
      alerts.push({
        type: 'error',
        message: `La carga financiera mensual (${debtToIncomeRatio.toFixed(1)}%) supera el 40% de los ingresos estimados. Riesgo de sobreendeudamiento.`
      });
    }

    selectedItems.forEach(item => {
      const financingPercentage = item.amount > 0 ? (item.financeBalance / item.amount) * 100 : 0;
      if (financingPercentage > 80) {
        alerts.push({
          type: 'warning',
          message: `${item.name} se financia en ${financingPercentage.toFixed(1)}%. Considere aumentar el adelanto.`
        });
      }
    });

    const remodelingItems = selectedItems.filter(item => 
      item.name.toLowerCase().includes('remodelación') || 
      item.name.toLowerCase().includes('remodelacion')
    );
    const remodelingTotal = remodelingItems.reduce((sum, item) => sum + item.amount, 0);
    const remodelingPercentage = totalInvestment > 0 ? (remodelingTotal / totalInvestment) * 100 : 0;
    
    if (remodelingPercentage > 30) {
      alerts.push({
        type: 'info',
        message: `Los costos de remodelación representan ${remodelingPercentage.toFixed(1)}% de la inversión total. Considere revisar el alcance.`
      });
    }

    const analysis: FinancialAnalysis = {
      totalInvestment,
      totalAdvances,
      totalFinanced,
      monthlyPaymentTotal,
      breakEvenMonths,
      roi,
      paybackPeriod
    };

    return {
      selectedItems,
      creditLines: creditLinesData,
      analysis,
      alerts,
      debtToIncomeRatio
    };
  }, [items, estimatedMonthlyIncome, grossMarginPercentage]);
};