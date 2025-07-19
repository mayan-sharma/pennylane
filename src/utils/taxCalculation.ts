import { 
  TAX_SLABS_OLD_REGIME, 
  TAX_SLABS_NEW_REGIME, 
  type TaxSlab, 
  type IncomeTaxCalculation,
  type TaxRegimeComparison,
  type TaxNotification,
  TAX_DEADLINES
} from '../types/tax';

export const calculateIncomeTax = (
  totalIncome: number,
  deductions: number = 0,
  taxSlabs: TaxSlab[] = TAX_SLABS_NEW_REGIME
): IncomeTaxCalculation => {
  const taxableIncome = Math.max(0, totalIncome - deductions);
  let totalTax = 0;
  const slabWiseBreakdown = [];

  for (const slab of taxSlabs) {
    if (taxableIncome <= slab.min) break;

    const slabMax = slab.max || Infinity;
    const taxableInThisSlab = Math.min(taxableIncome, slabMax) - slab.min;
    
    if (taxableInThisSlab > 0) {
      const taxInThisSlab = taxableInThisSlab * (slab.rate / 100);
      totalTax += taxInThisSlab;
      
      slabWiseBreakdown.push({
        slab,
        taxableAmount: taxableInThisSlab,
        tax: taxInThisSlab
      });
    }
  }

  // Add 4% Health and Education Cess on total tax
  const cessAmount = totalTax * 0.04;
  totalTax += cessAmount;

  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
    taxableIncome,
    totalTax,
    effectiveRate,
    slabWiseBreakdown
  };
};

export const calculateGST = (amount: number, gstRate: number): number => {
  return (amount * gstRate) / 100;
};

export const calculateHRADeduction = (
  salary: number,
  hraReceived: number,
  rentPaid: number,
  isMetroCity: boolean = false
): number => {
  const salaryPercentage = isMetroCity ? 0.5 : 0.4;
  const exemptionLimit = Math.min(
    hraReceived,
    salary * salaryPercentage,
    Math.max(0, rentPaid - (salary * 0.1))
  );
  return exemptionLimit;
};

export const getFinancialYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const isExpenseDeductible = (category: string, description: string): boolean => {
  const deductibleCategories = ['HEALTHCARE', 'EDUCATION', 'BILLS'];
  const deductibleKeywords = ['medical', 'hospital', 'doctor', 'medicine', 'school', 'college', 'course', 'training'];
  
  if (deductibleCategories.includes(category.toUpperCase())) {
    return true;
  }
  
  return deductibleKeywords.some(keyword => 
    description.toLowerCase().includes(keyword)
  );
};

export const compareTaxRegimes = (
  totalIncome: number,
  oldRegimeDeductions: number = 0
): TaxRegimeComparison => {
  // Old Regime calculation with standard deduction of ₹50,000
  const oldRegimeStandardDeduction = Math.min(50000, totalIncome);
  const oldRegimeTotalDeductions = oldRegimeDeductions + oldRegimeStandardDeduction;
  const oldRegimeCalculation = calculateIncomeTax(totalIncome, oldRegimeTotalDeductions, TAX_SLABS_OLD_REGIME);

  // New Regime calculation (limited deductions allowed)
  const newRegimeStandardDeduction = Math.min(50000, totalIncome);
  const newRegimeLimitedDeductions = newRegimeStandardDeduction; // Only standard deduction in new regime
  const newRegimeCalculation = calculateIncomeTax(totalIncome, newRegimeLimitedDeductions, TAX_SLABS_NEW_REGIME);

  const savings = oldRegimeCalculation.totalTax - newRegimeCalculation.totalTax;
  const recommendation = savings > 0 ? 'NEW' : 'OLD';

  return {
    oldRegime: {
      ...oldRegimeCalculation,
      standardDeduction: oldRegimeStandardDeduction,
      availableDeductions: oldRegimeDeductions
    },
    newRegime: {
      ...newRegimeCalculation,
      standardDeduction: newRegimeStandardDeduction,
      availableDeductions: 0 // New regime doesn't allow most deductions
    },
    recommendation,
    savings: Math.abs(savings)
  };
};

export const generateTaxNotifications = (): TaxNotification[] => {
  const today = new Date();
  const notifications: TaxNotification[] = [];

  TAX_DEADLINES.forEach((deadline, index) => {
    const deadlineDate = new Date(deadline.date);
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
      const priority = daysUntilDeadline <= 7 ? 'HIGH' : daysUntilDeadline <= 15 ? 'MEDIUM' : 'LOW';
      
      notifications.push({
        id: `deadline_${index}`,
        type: 'DEADLINE',
        priority,
        title: `Upcoming: ${deadline.description}`,
        message: `Due in ${daysUntilDeadline} days on ${deadline.date}`,
        actionRequired: true,
        dueDate: deadline.date,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  return notifications;
};

export const calculateInvestmentRecommendations = (
  currentIncome: number,
  currentDeductions: number,
  targetTaxSaving: number = 50000
) => {
  const remaining80C = Math.max(0, 150000 - currentDeductions);
  const recommendations = [];

  if (remaining80C > 0) {
    const elssAmount = Math.min(remaining80C, targetTaxSaving * 3.33); // Assume 30% tax bracket
    if (elssAmount >= 500) {
      recommendations.push({
        type: 'ELSS',
        amount: Math.round(elssAmount / 1000) * 1000, // Round to nearest thousand
        taxBenefit: Math.round(elssAmount * 0.3),
        section: '80C',
        priority: 'HIGH',
        returns: '12-15% expected',
        lockIn: '3 years'
      });
    }

    const ppfAmount = Math.min(remaining80C - elssAmount, 150000);
    if (ppfAmount >= 500) {
      recommendations.push({
        type: 'PPF',
        amount: Math.round(ppfAmount / 1000) * 1000,
        taxBenefit: Math.round(ppfAmount * 0.3),
        section: '80C',
        priority: 'MEDIUM',
        returns: '7-8% expected',
        lockIn: '15 years'
      });
    }
  }

  // NPS recommendation for additional 80CCD(1B) benefit
  if (currentIncome > 500000) {
    recommendations.push({
      type: 'NPS',
      amount: 50000,
      taxBenefit: 15000,
      section: '80CCD(1B)',
      priority: 'MEDIUM',
      returns: '10-12% expected',
      lockIn: 'Until retirement'
    });
  }

  return recommendations;
};

export const calculateTaxProjection = (
  currentIncome: number,
  currentDeductions: number,
  monthsElapsed: number = new Date().getMonth() >= 3 ? new Date().getMonth() - 3 : new Date().getMonth() + 9
) => {
  const totalMonths = 12;
  const remainingMonths = totalMonths - monthsElapsed;
  const monthlyIncome = currentIncome / totalMonths;
  
  const projectedYearlyIncome = currentIncome + (monthlyIncome * remainingMonths);
  const currentTaxCalc = calculateIncomeTax(projectedYearlyIncome, currentDeductions);
  
  const remaining80C = Math.max(0, 150000 - currentDeductions);
  const monthlyInvestmentNeeded = remaining80C / Math.max(1, remainingMonths);
  
  const optimizedDeductions = currentDeductions + remaining80C;
  const optimizedTaxCalc = calculateIncomeTax(projectedYearlyIncome, optimizedDeductions);
  
  return {
    remainingMonths,
    projectedIncome: projectedYearlyIncome,
    projectedTax: currentTaxCalc.totalTax,
    suggestedInvestments: remaining80C,
    potentialSavings: currentTaxCalc.totalTax - optimizedTaxCalc.totalTax,
    monthlyRecommendation: monthlyInvestmentNeeded
  };
};

export const calculateCapitalGains = (
  purchasePrice: number,
  salePrice: number,
  purchaseDate: string,
  saleDate: string,
  assetType: 'EQUITY' | 'MUTUAL_FUND' | 'PROPERTY' | 'BOND' | 'GOLD'
) => {
  const purchaseDateObj = new Date(purchaseDate);
  const saleDateObj = new Date(saleDate);
  const holdingPeriodMonths = (saleDateObj.getTime() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  const isLongTerm = assetType === 'PROPERTY' ? holdingPeriodMonths >= 24 : holdingPeriodMonths >= 12;
  const gainAmount = salePrice - purchasePrice;
  
  let taxRate = 0;
  let exemptionLimit = 0;
  
  if (isLongTerm) {
    if (assetType === 'EQUITY' || assetType === 'MUTUAL_FUND') {
      taxRate = gainAmount > 100000 ? 10 : 0; // LTCG on equity
      exemptionLimit = 100000;
    } else if (assetType === 'PROPERTY') {
      taxRate = 20; // With indexation benefit
    } else {
      taxRate = 20; // Other assets
    }
  } else {
    if (assetType === 'EQUITY' || assetType === 'MUTUAL_FUND') {
      taxRate = 15; // STCG on equity
    } else {
      taxRate = 30; // As per individual tax slab
    }
  }
  
  const taxableGain = Math.max(0, gainAmount - exemptionLimit);
  const taxAmount = (taxableGain * taxRate) / 100;
  
  return {
    gainAmount,
    taxableGain,
    taxAmount,
    taxRate,
    isLongTerm,
    exemptionLimit
  };
};

export const calculateAdvanceTax = (
  estimatedIncome: number,
  estimatedDeductions: number,
  tdsDeducted: number = 0
) => {
  const taxCalc = calculateIncomeTax(estimatedIncome, estimatedDeductions);
  const totalTaxLiability = taxCalc.totalTax;
  const netTaxPayable = Math.max(0, totalTaxLiability - tdsDeducted);
  
  if (netTaxPayable < 10000) {
    return {
      isAdvanceTaxRequired: false,
      totalLiability: totalTaxLiability,
      netPayable: netTaxPayable,
      installments: []
    };
  }
  
  const installments = [
    { quarter: 'Q1', dueDate: '2024-06-15', percentage: 15, amount: netTaxPayable * 0.15 },
    { quarter: 'Q2', dueDate: '2024-09-15', percentage: 45, amount: netTaxPayable * 0.45 },
    { quarter: 'Q3', dueDate: '2024-12-15', percentage: 75, amount: netTaxPayable * 0.75 },
    { quarter: 'Q4', dueDate: '2025-03-15', percentage: 100, amount: netTaxPayable }
  ];
  
  return {
    isAdvanceTaxRequired: true,
    totalLiability: totalTaxLiability,
    netPayable: netTaxPayable,
    installments
  };
};

export const optimizeTaxStrategy = (
  income: number,
  currentDeductions: Record<string, number>,
  goals: { riskAppetite: 'LOW' | 'MEDIUM' | 'HIGH'; timeHorizon: number }
) => {
  const totalCurrentDeductions = Object.values(currentDeductions).reduce((sum, val) => sum + val, 0);
  const currentTax = calculateIncomeTax(income, totalCurrentDeductions);
  
  const strategies = [];
  
  // 80C optimization
  const remaining80C = Math.max(0, 150000 - (currentDeductions['80C'] || 0));
  if (remaining80C > 0) {
    if (goals.riskAppetite === 'HIGH' && goals.timeHorizon >= 3) {
      strategies.push({
        type: 'ELSS Investment',
        amount: remaining80C,
        taxSaving: remaining80C * 0.3,
        expectedReturns: remaining80C * 0.15,
        risk: 'HIGH',
        liquidity: '3 years lock-in'
      });
    } else if (goals.riskAppetite === 'LOW') {
      strategies.push({
        type: 'PPF Investment',
        amount: Math.min(remaining80C, 150000),
        taxSaving: Math.min(remaining80C, 150000) * 0.3,
        expectedReturns: Math.min(remaining80C, 150000) * 0.08,
        risk: 'LOW',
        liquidity: '15 years lock-in'
      });
    }
  }
  
  // 80D optimization
  const remaining80D = Math.max(0, 25000 - (currentDeductions['80D'] || 0));
  if (remaining80D > 0) {
    strategies.push({
      type: 'Health Insurance',
      amount: remaining80D,
      taxSaving: remaining80D * 0.3,
      expectedReturns: 0, // Protection benefit
      risk: 'NONE',
      liquidity: 'Annual premium'
    });
  }
  
  return {
    currentTax: currentTax.totalTax,
    optimizedStrategies: strategies,
    totalPotentialSaving: strategies.reduce((sum, s) => sum + s.taxSaving, 0)
  };
};