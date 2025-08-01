export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  accountNumber: string; // masked
  balance: number;
  currency: string;
  lastSynced: string;
  isActive: boolean;
  linkedBudgets: string[];
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  merchant?: string;
  type: 'debit' | 'credit';
  isRecurring: boolean;
  linkedExpenseId?: string;
}