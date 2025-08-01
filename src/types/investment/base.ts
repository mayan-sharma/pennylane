export interface DebtPayoffGoal {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  targetDate?: string;
  strategy: 'snowball' | 'avalanche' | 'custom';
  priority: number;
  paymentHistory: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  category: 'retirement' | 'emergency' | 'education' | 'house' | 'vacation' | 'custom';
  autoInvest: boolean;
  linkedBudgetId?: string;
  milestones: InvestmentMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentMilestone {
  id: string;
  targetAmount: number;
  targetDate: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  reward?: string;
}