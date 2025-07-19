export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

export interface IncomeTaxCalculation {
  totalIncome: number;
  taxableIncome: number;
  totalTax: number;
  effectiveRate: number;
  slabWiseBreakdown: {
    slab: TaxSlab;
    taxableAmount: number;
    tax: number;
  }[];
}

export interface TaxDeduction {
  id: string;
  type: '80C' | 'HRA' | 'MEDICAL_INSURANCE' | 'OTHER';
  amount: number;
  description: string;
  category: string;
  financialYear: string;
  createdAt: string;
}

export interface TaxDeductionFormData {
  type: '80C' | 'HRA' | 'MEDICAL_INSURANCE' | 'OTHER';
  amount: string;
  description: string;
  category: string;
  financialYear: string;
}

export interface TaxableExpense {
  expenseId: string;
  gstAmount: number;
  gstType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  gstRate: number;
  isDeductible: boolean;
  deductionType?: 'BUSINESS' | 'MEDICAL' | 'EDUCATION' | 'OTHER';
}

export interface TaxReport {
  financialYear: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  gstCollected: number;
  gstPaid: number;
  deductionSummary: {
    type: string;
    amount: number;
  }[];
  generatedAt: string;
}

export const TAX_SLABS_OLD_REGIME: TaxSlab[] = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: null, rate: 30 }
];

export const TAX_SLABS_NEW_REGIME: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 700000, rate: 5 },
  { min: 700001, max: 1000000, rate: 10 },
  { min: 1000001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: null, rate: 30 }
];

// Backward compatibility
export const TAX_SLABS_2024_25 = TAX_SLABS_NEW_REGIME;

export const DEDUCTION_LIMITS = {
  '80C': 150000,
  'HRA': 0, // Calculated based on salary
  'MEDICAL_INSURANCE': 25000,
  'SENIOR_CITIZEN_MEDICAL': 50000
};

export const GST_RATES = {
  EXEMPT: 0,
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28
};

export interface Investment {
  id: string;
  type: 'ELSS' | 'PPF' | 'NSC' | 'ULIP' | 'LIC' | 'FD' | 'SUKANYA' | 'NPS';
  name: string;
  amount: number;
  startDate: string;
  maturityDate?: string;
  taxSection: '80C' | '80D' | '80CCD' | 'OTHER';
  expectedReturns?: number;
  currentValue?: number;
  isActive: boolean;
  financialYear: string;
  createdAt: string;
}

export interface InvestmentFormData {
  type: Investment['type'];
  name: string;
  amount: string;
  startDate: string;
  maturityDate?: string;
  taxSection: Investment['taxSection'];
  expectedReturns?: string;
  financialYear: string;
}

export interface TaxNotification {
  id: string;
  type: 'DEADLINE' | 'OPTIMIZATION' | 'COMPLIANCE' | 'REMINDER';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  actionRequired: boolean;
  dueDate?: string;
  isRead: boolean;
  createdAt: string;
}

export interface TaxRegimeComparison {
  oldRegime: IncomeTaxCalculation & { standardDeduction: number; availableDeductions: number };
  newRegime: IncomeTaxCalculation & { standardDeduction: number; availableDeductions: number };
  recommendation: 'OLD' | 'NEW';
  savings: number;
}

export interface TaxPlanningData {
  currentIncome: number;
  currentDeductions: number;
  currentInvestments: number;
  targetSavings: number;
  recommendedInvestments: {
    type: string;
    amount: number;
    taxBenefit: number;
    section: string;
  }[];
}

export interface TaxProjection {
  remainingMonths: number;
  projectedIncome: number;
  projectedTax: number;
  suggestedInvestments: number;
  potentialSavings: number;
  monthlyRecommendation: number;
}

export interface TDSRecord {
  id: string;
  source: 'SALARY' | 'BANK_INTEREST' | 'FD' | 'PROFESSIONAL' | 'OTHER';
  amount: number;
  tdsDeducted: number;
  quarter: string;
  financialYear: string;
  tanNumber?: string;
  certificateNumber?: string;
  deductorName: string;
  createdAt: string;
}

export interface CapitalGain {
  id: string;
  assetType: 'EQUITY' | 'MUTUAL_FUND' | 'PROPERTY' | 'BOND' | 'GOLD';
  purchaseDate: string;
  saleDate: string;
  purchasePrice: number;
  salePrice: number;
  indexationBenefit?: number;
  isLongTerm: boolean;
  exemptionClaimed?: number;
  exemptionSection?: '54' | '54EC' | '54F';
  gainAmount: number;
  taxableGain: number;
  financialYear: string;
  createdAt: string;
}

export interface TaxScenario {
  id: string;
  name: string;
  income: number;
  deductions: Record<string, number>;
  investments: Record<string, number>;
  totalTax: number;
  effectiveRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface MultiYearComparison {
  year: string;
  income: number;
  deductions: number;
  taxPaid: number;
  investments: number;
  effectiveRate: number;
}

export const INVESTMENT_TYPES = {
  ELSS: 'Equity Linked Savings Scheme',
  PPF: 'Public Provident Fund',
  NSC: 'National Savings Certificate',
  ULIP: 'Unit Linked Insurance Plan',
  LIC: 'Life Insurance Premium',
  FD: 'Fixed Deposit (5 year)',
  SUKANYA: 'Sukanya Samriddhi Yojana',
  NPS: 'National Pension System'
} as const;

export const TAX_DEADLINES = [
  { date: '2024-07-31', description: 'ITR Filing for Individuals', type: 'FILING' },
  { date: '2024-10-31', description: 'ITR Filing for Audit Cases', type: 'FILING' },
  { date: '2024-06-15', description: 'Advance Tax Q1', type: 'PAYMENT' },
  { date: '2024-09-15', description: 'Advance Tax Q2', type: 'PAYMENT' },
  { date: '2024-12-15', description: 'Advance Tax Q3', type: 'PAYMENT' },
  { date: '2025-03-15', description: 'Advance Tax Q4', type: 'PAYMENT' }
];