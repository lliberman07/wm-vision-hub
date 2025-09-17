export interface FranchiseData {
  // Información general
  franchiseName: string;
  businessSector: string;
  franchiseManager: string;
  
  // Datos financieros
  entryFee: number;
  constructionAndRemodel: number;
  equipment: number;
  variousFees: number;
  realEstateExpenses: number;
  launchExpenses: number;
  staffTraining: number;
  initialStock: number;
  localRent: number;
  localDeposit: number;
  others: number;
  
  // Ubicación del local
  province: string;
  city: string;
  neighborhood: string;
  address: string;
  squareMeters: number;
}

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
  isFranchise?: boolean;
  franchiseData?: FranchiseData;
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
    name: 'Franquicia',
    nameKey: 'simulator.item.franchise',
    isSelected: false,
    amount: 0,
    advancePercentage: 0,
    advanceAmount: 0,
    financeBalance: 0,
    creditType: 'capital',
    isFranchise: true,
    franchiseData: {
      franchiseName: '',
      businessSector: '',
      franchiseManager: '',
      entryFee: 0,
      constructionAndRemodel: 0,
      equipment: 0,
      variousFees: 0,
      realEstateExpenses: 0,
      launchExpenses: 0,
      staffTraining: 0,
      initialStock: 0,
      localRent: 0,
      localDeposit: 0,
      others: 0,
      province: '',
      city: '',
      neighborhood: '',
      address: '',
      squareMeters: 0
    }
  },
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
  }
];