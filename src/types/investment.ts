export interface InvestmentItem {
  id: string;
  name: string;
  // i18n key to display localized item name
  nameKey?: string;
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
    nameKey: 'simulator.item.retailLease',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Alquiler de Oficina',
    nameKey: 'simulator.item.officeLease',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Alquiler de Depósito',
    nameKey: 'simulator.item.warehouseLease',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Compra de Propiedad',
    nameKey: 'simulator.item.propertyPurchase',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'mortgage'
  },
  {
    name: 'Remodelación de Propiedad',
    nameKey: 'simulator.item.propertyRemodel',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'capital'
  },
  {
    name: 'Equipamiento y Activos',
    nameKey: 'simulator.item.equipmentAssets',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'capital'
  },
  {
    name: 'Capital de Trabajo',
    nameKey: 'simulator.item.workingCapital',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Gastos Legales / Licencias',
    nameKey: 'simulator.item.legalLicenses',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  },
  {
    name: 'Marketing y Lanzamiento',
    nameKey: 'simulator.item.marketingLaunch',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'personal'
  }
];