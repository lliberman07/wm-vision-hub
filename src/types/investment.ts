export interface InvestmentItem {
  id: string;
  name: string;
  isSelected: boolean;
  amount: number;
  advancePercentage: number;
  advanceAmount: number;
  financeBalance: number;
  creditType: CreditType;
  isCustom?: boolean;
}

export type CreditType = 'personal' | 'capital' | 'mortgage';

export interface CreditLine {
  type: CreditType;
  totalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
}

export interface FinancialAnalysis {
  totalInvestment: number;
  totalAdvances: number;
  totalFinanced: number;
  monthlyPaymentTotal: number;
  breakEvenMonths: number;
  roi: number;
  paybackPeriod: number;
}

export interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
}

export interface Scenario {
  id: string;
  name: string;
  items: InvestmentItem[];
  creditLines: CreditLine[];
  estimatedMonthlyIncome: number;
  grossMarginPercentage: number;
}

export const DEFAULT_ITEMS: Omit<InvestmentItem, 'id'>[] = [
  {
    name: 'Alquiler de Local Comercial',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Alquiler de Oficina',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Alquiler de Depósito',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Compra de Propiedad',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'mortgage'
  },
  {
    name: 'Remodelación de Propiedad',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'capital'
  },
  {
    name: 'Equipamiento y Activos',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'capital'
  },
  {
    name: 'Capital de Trabajo',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Gastos Legales / Licencias',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Marketing y Lanzamiento',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  }
];