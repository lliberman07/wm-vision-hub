import { useMemo } from 'react';
import { InvestmentItem, CreditLine } from '@/types/investment';

interface SimulatorProgress {
  isConfigurationComplete: boolean;
  isFinancingComplete: boolean;
  isResultsReady: boolean;
  nextStep: string | null;
  progress: number;
}

export const useSimulatorProgress = (
  items: InvestmentItem[],
  creditLines: CreditLine[],
  estimatedMonthlyIncome: number
): SimulatorProgress => {
  return useMemo(() => {
    // Configuration is complete if at least one item is selected with valid data
    const selectedItems = items.filter(item => item.isSelected);
    const isConfigurationComplete = selectedItems.length > 0 && 
      selectedItems.every(item => item.amount > 0);

    // Financing is complete if credit lines have valid rates and terms
    const hasFinancing = creditLines.length > 0;
    const isFinancingComplete = hasFinancing && 
      creditLines.every(cl => cl.interestRate > 0 && cl.termMonths > 0);

    // Results are ready if we have income data
    const isResultsReady = isFinancingComplete && estimatedMonthlyIncome > 0;

    // Determine next step
    let nextStep: string | null = null;
    if (isConfigurationComplete && !isFinancingComplete) {
      nextStep = 'financing';
    } else if (isFinancingComplete && !isResultsReady) {
      nextStep = 'results';
    }

    // Calculate overall progress
    let progress = 0;
    if (isConfigurationComplete) progress += 33;
    if (isFinancingComplete) progress += 33;
    if (isResultsReady) progress += 34;

    return {
      isConfigurationComplete,
      isFinancingComplete,
      isResultsReady,
      nextStep,
      progress
    };
  }, [items, creditLines, estimatedMonthlyIncome]);
};