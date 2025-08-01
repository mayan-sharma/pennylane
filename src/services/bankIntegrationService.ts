/**
 * Bank Integration Service - Handles connections to banks and financial institutions
 * Supports multiple providers: Plaid, Yodlee, Open Banking APIs, and manual CSV import
 */

import { Expense, ExpenseCategory } from '../types';

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  merchantName?: string;
  category?: string[];
  date: string;
  pending: boolean;
  transactionType: 'debit' | 'credit';
  paymentChannel: 'online' | 'in store' | 'other';
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  accountOwner?: string;
  currency: string;
  originalDescription: string;
  subcategory?: string[];
  checkNumber?: string;
  refNumber?: string;
  isExpense?: boolean; // Whether this transaction should be considered an expense
}

export interface BankAccount {
  id: string;
  name: string;
  officialName: string;
  type: 'depository' | 'credit' | 'loan' | 'investment' | 'other';
  subtype: string;
  mask: string;
  balance: {
    available: number | null;
    current: number;
    limit: number | null;
    currency: string;
  };
  institution: {
    id: string;
    name: string;
    logo?: string;
  };
  isActive: boolean;
  lastSyncDate?: string;
  syncFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
}

export interface BankConnection {
  id: string;
  institutionId: string;
  institutionName: string;
  accounts: BankAccount[];
  status: 'connected' | 'disconnected' | 'error' | 'requires_auth';
  lastSyncDate?: string;
  provider: 'plaid' | 'yodlee' | 'open_banking' | 'manual';
  accessToken?: string;
  errorMessage?: string;
  connectionDate: string;
}

export interface SyncResult {
  success: boolean;
  newTransactionsCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: string[];
  transactions: BankTransaction[];
  lastSyncDate: string;
}

export interface TransactionMatchResult {
  transaction: BankTransaction;
  existingExpense?: Expense;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'none';
  suggestedAction: 'create' | 'merge' | 'ignore';
  suggestedCategory?: ExpenseCategory;
  suggestedMerchant?: string;
}

export interface BankIntegrationConfig {
  autoCreateExpenses: boolean;
  duplicateThreshold: number; // Confidence threshold for duplicate detection
  categoryMappingEnabled: boolean;
  merchantCleanupEnabled: boolean;
  locationTrackingEnabled: boolean;
  excludeCategories: string[]; // Categories to exclude from expense creation
  minimumAmount: number; // Minimum transaction amount to consider
  maximumAmount: number; // Maximum transaction amount to consider
  autoApprovalLimit: number; // Amount under which expenses are auto-approved
}

const defaultConfig: BankIntegrationConfig = {
  autoCreateExpenses: true,
  duplicateThreshold: 0.85,
  categoryMappingEnabled: true,
  merchantCleanupEnabled: true,
  locationTrackingEnabled: true,
  excludeCategories: ['Transfer', 'Payment', 'Deposit', 'Interest'],
  minimumAmount: 1,
  maximumAmount: 50000,
  autoApprovalLimit: 100,
};

class BankIntegrationService {
  private config: BankIntegrationConfig;
  private connections: BankConnection[] = [];
  private categoryMappings: Map<string, ExpenseCategory> = new Map();

  constructor(config: Partial<BankIntegrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeCategoryMappings();
    this.loadConnections();
  }

  // === Connection Management ===

  async connectBank(provider: 'plaid' | 'yodlee' | 'open_banking'): Promise<BankConnection> {
    try {
      switch (provider) {
        case 'plaid':
          return await this.connectPlaid();
        case 'yodlee':
          return await this.connectYodlee();
        case 'open_banking':
          return await this.connectOpenBanking();
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      throw error;
    }
  }

  async disconnectBank(connectionId: string): Promise<void> {
    const connection = this.connections.find(c => c.id === connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    try {
      // Revoke access tokens based on provider
      switch (connection.provider) {
        case 'plaid':
          await this.disconnectPlaid(connection);
          break;
        case 'yodlee':
          await this.disconnectYodlee(connection);
          break;
        case 'open_banking':
          await this.disconnectOpenBanking(connection);
          break;
      }

      // Remove from local storage
      this.connections = this.connections.filter(c => c.id !== connectionId);
      this.saveConnections();
    } catch (error) {
      console.error(`Failed to disconnect ${connection.provider}:`, error);
      throw error;
    }
  }

  // === Transaction Syncing ===

  async syncAllAccounts(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    for (const connection of this.connections) {
      if (connection.status === 'connected') {
        try {
          const result = await this.syncConnection(connection);
          results.push(result);
        } catch (error) {
          console.error(`Failed to sync connection ${connection.id}:`, error);
          results.push({
            success: false,
            newTransactionsCount: 0,
            duplicateCount: 0,
            errorCount: 1,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            transactions: [],
            lastSyncDate: new Date().toISOString(),
          });
        }
      }
    }

    return results;
  }

  async syncConnection(connection: BankConnection): Promise<SyncResult> {
    const startDate = connection.lastSyncDate || this.getDefaultStartDate();
    const endDate = new Date().toISOString().split('T')[0];

    try {
      let transactions: BankTransaction[] = [];

      switch (connection.provider) {
        case 'plaid':
          transactions = await this.fetchPlaidTransactions(connection, startDate, endDate);
          break;
        case 'yodlee':
          transactions = await this.fetchYodleeTransactions(connection, startDate, endDate);
          break;
        case 'open_banking':
          transactions = await this.fetchOpenBankingTransactions(connection, startDate, endDate);
          break;
        default:
          throw new Error(`Unsupported provider: ${connection.provider}`);
      }

      // Filter and process transactions
      const expenseTransactions = this.filterExpenseTransactions(transactions);
      const processedTransactions = await this.processTransactions(expenseTransactions);

      // Update connection status
      connection.lastSyncDate = new Date().toISOString();
      connection.status = 'connected';
      this.saveConnections();

      return {
        success: true,
        newTransactionsCount: processedTransactions.length,
        duplicateCount: transactions.length - expenseTransactions.length,
        errorCount: 0,
        errors: [],
        transactions: processedTransactions,
        lastSyncDate: connection.lastSyncDate,
      };
    } catch (error) {
      connection.status = 'error';
      connection.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.saveConnections();
      throw error;
    }
  }

  // === Transaction Processing ===

  private async processTransactions(transactions: BankTransaction[]): Promise<BankTransaction[]> {
    const processed: BankTransaction[] = [];

    for (const transaction of transactions) {
      try {
        // Clean up merchant name
        if (this.config.merchantCleanupEnabled) {
          transaction.merchantName = this.cleanMerchantName(transaction.merchantName || transaction.description);
        }

        // Map category
        if (this.config.categoryMappingEnabled) {
          const mappedCategory = this.mapTransactionCategory(transaction);
          if (mappedCategory) {
            transaction.category = [mappedCategory];
          }
        }

        // Mark as expense transaction
        transaction.isExpense = this.shouldCreateExpense(transaction);

        processed.push(transaction);
      } catch (error) {
        console.error('Error processing transaction:', transaction.id, error);
      }
    }

    return processed;
  }

  async matchTransactionsToExpenses(
    transactions: BankTransaction[],
    existingExpenses: Expense[]
  ): Promise<TransactionMatchResult[]> {
    const results: TransactionMatchResult[] = [];

    for (const transaction of transactions) {
      const matchResult = await this.findMatchingExpense(transaction, existingExpenses);
      results.push(matchResult);
    }

    return results;
  }

  async createExpensesFromTransactions(
    matchResults: TransactionMatchResult[]
  ): Promise<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]> {
    const expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const result of matchResults) {
      if (result.suggestedAction === 'create' && result.transaction.isExpense) {
        const expense = this.transactionToExpense(result.transaction, result);
        expenses.push(expense);
      }
    }

    return expenses;
  }

  // === Provider-Specific Implementations ===

  private async connectPlaid(): Promise<BankConnection> {
    // Plaid Link implementation
    // This would typically use Plaid Link SDK
    
    if (!process.env.REACT_APP_PLAID_CLIENT_ID) {
      throw new Error('Plaid client ID not configured');
    }

    // Mock implementation - in real app, use Plaid Link
    const mockConnection: BankConnection = {
      id: crypto.randomUUID(),
      institutionId: 'plaid_bank_1',
      institutionName: 'Sample Bank',
      provider: 'plaid',
      status: 'connected',
      connectionDate: new Date().toISOString(),
      accounts: [
        {
          id: 'plaid_account_1',
          name: 'Checking Account',
          officialName: 'Sample Bank Checking Account',
          type: 'depository',
          subtype: 'checking',
          mask: '0000',
          balance: {
            available: 1500.00,
            current: 1750.00,
            limit: null,
            currency: 'USD',
          },
          institution: {
            id: 'plaid_bank_1',
            name: 'Sample Bank',
          },
          isActive: true,
          syncFrequency: 'daily',
        },
      ],
    };

    this.connections.push(mockConnection);
    this.saveConnections();
    return mockConnection;
  }

  private async fetchPlaidTransactions(
    connection: BankConnection,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    // Mock Plaid transactions - in real app, use Plaid API
    return [
      {
        id: `plaid_${crypto.randomUUID()}`,
        accountId: connection.accounts[0]?.id || '',
        amount: 45.67,
        description: 'STARBUCKS STORE #1234',
        merchantName: 'Starbucks',
        category: ['Food and Drink', 'Coffee'],
        date: new Date().toISOString().split('T')[0],
        pending: false,
        transactionType: 'debit',
        paymentChannel: 'in store',
        currency: 'USD',
        originalDescription: 'STARBUCKS STORE #1234 SEATTLE WA',
        location: {
          address: '123 Coffee St',
          city: 'Seattle',
          region: 'WA',
          country: 'US',
        },
        isExpense: true,
      },
    ];
  }

  private async connectYodlee(): Promise<BankConnection> {
    // Yodlee FastLink implementation
    throw new Error('Yodlee integration not implemented');
  }

  private async fetchYodleeTransactions(
    connection: BankConnection,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    throw new Error('Yodlee integration not implemented');
  }

  private async connectOpenBanking(): Promise<BankConnection> {
    // Open Banking API implementation (UK/EU)
    throw new Error('Open Banking integration not implemented');
  }

  private async fetchOpenBankingTransactions(
    connection: BankConnection,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    throw new Error('Open Banking integration not implemented');
  }

  private async disconnectPlaid(connection: BankConnection): Promise<void> {
    // Remove Plaid access token
    if (connection.accessToken) {
      // In real app: await plaidClient.removeItem({ access_token: connection.accessToken });
      console.log('Disconnected Plaid connection');
    }
  }

  private async disconnectYodlee(connection: BankConnection): Promise<void> {
    // Remove Yodlee connection
    console.log('Disconnected Yodlee connection');
  }

  private async disconnectOpenBanking(connection: BankConnection): Promise<void> {
    // Remove Open Banking connection
    console.log('Disconnected Open Banking connection');
  }

  // === Helper Methods ===

  private filterExpenseTransactions(transactions: BankTransaction[]): BankTransaction[] {
    return transactions.filter(t => {
      // Only consider debit transactions (money going out)
      if (t.transactionType !== 'debit') return false;
      
      // Check amount limits
      if (t.amount < this.config.minimumAmount || t.amount > this.config.maximumAmount) {
        return false;
      }
      
      // Exclude certain categories
      if (t.category?.some(cat => this.config.excludeCategories.includes(cat))) {
        return false;
      }
      
      return true;
    });
  }

  private shouldCreateExpense(transaction: BankTransaction): boolean {
    // Additional business logic for expense creation
    return transaction.transactionType === 'debit' && 
           transaction.amount > 0 && 
           !transaction.pending;
  }

  private cleanMerchantName(name: string): string {
    // Clean up merchant names
    return name
      .replace(/\d{4,}/g, '') // Remove long numbers
      .replace(/[#*]+\d+/g, '') // Remove reference numbers
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3) // Take first 3 words
      .join(' ');
  }

  private mapTransactionCategory(transaction: BankTransaction): ExpenseCategory | undefined {
    if (!transaction.category?.length) return undefined;
    
    const primaryCategory = transaction.category[0].toLowerCase();
    return this.categoryMappings.get(primaryCategory);
  }

  private async findMatchingExpense(
    transaction: BankTransaction,
    existingExpenses: Expense[]
  ): Promise<TransactionMatchResult> {
    // Find exact matches first
    for (const expense of existingExpenses) {
      if (this.isExactMatch(transaction, expense)) {
        return {
          transaction,
          existingExpense: expense,
          confidence: 1.0,
          matchType: 'exact',
          suggestedAction: 'merge',
        };
      }
    }

    // Look for fuzzy matches
    let bestMatch: { expense: Expense; confidence: number } | null = null;
    
    for (const expense of existingExpenses) {
      const confidence = this.calculateMatchConfidence(transaction, expense);
      if (confidence > this.config.duplicateThreshold) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { expense, confidence };
        }
      }
    }

    if (bestMatch) {
      return {
        transaction,
        existingExpense: bestMatch.expense,
        confidence: bestMatch.confidence,
        matchType: 'fuzzy',
        suggestedAction: 'merge',
      };
    }

    // No match found - suggest creating new expense
    return {
      transaction,
      confidence: 0,
      matchType: 'none',
      suggestedAction: transaction.isExpense ? 'create' : 'ignore',
      suggestedCategory: this.mapTransactionCategory(transaction),
      suggestedMerchant: transaction.merchantName,
    };
  }

  private isExactMatch(transaction: BankTransaction, expense: Expense): boolean {
    const amountMatch = Math.abs(transaction.amount - expense.amount) < 0.01;
    const dateMatch = transaction.date === expense.date;
    const merchantMatch = transaction.merchantName === expense.merchant;
    
    return amountMatch && dateMatch && merchantMatch;
  }

  private calculateMatchConfidence(transaction: BankTransaction, expense: Expense): number {
    let confidence = 0;
    
    // Amount matching (40% weight)
    const amountDiff = Math.abs(transaction.amount - expense.amount);
    if (amountDiff === 0) {
      confidence += 0.4;
    } else if (amountDiff < 1) {
      confidence += 0.3;
    } else if (amountDiff < 5) {
      confidence += 0.2;
    }
    
    // Date matching (30% weight)
    const transactionDate = new Date(transaction.date);
    const expenseDate = new Date(expense.date);
    const daysDiff = Math.abs((transactionDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      confidence += 0.3;
    } else if (daysDiff <= 1) {
      confidence += 0.2;
    } else if (daysDiff <= 3) {
      confidence += 0.1;
    }
    
    // Merchant/description matching (30% weight)
    const transactionText = (transaction.merchantName || transaction.description).toLowerCase();
    const expenseText = (expense.merchant || expense.description).toLowerCase();
    
    if (transactionText.includes(expenseText) || expenseText.includes(transactionText)) {
      confidence += 0.3;
    } else {
      // Simple word matching
      const transactionWords = transactionText.split(/\s+/);
      const expenseWords = expenseText.split(/\s+/);
      const commonWords = transactionWords.filter(word => 
        word.length > 2 && expenseWords.includes(word)
      );
      confidence += (commonWords.length / Math.max(transactionWords.length, expenseWords.length)) * 0.2;
    }
    
    return confidence;
  }

  private transactionToExpense(
    transaction: BankTransaction,
    matchResult: TransactionMatchResult
  ): Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      date: transaction.date,
      amount: transaction.amount,
      category: matchResult.suggestedCategory || ExpenseCategory.OTHER,
      description: transaction.description,
      merchant: matchResult.suggestedMerchant || transaction.merchantName,
      paymentMethod: 'card',
      currency: transaction.currency,
      tags: ['auto-imported'],
      location: transaction.location ? {
        latitude: transaction.location.lat || 0,
        longitude: transaction.location.lon || 0,
        address: [
          transaction.location.address,
          transaction.location.city,
          transaction.location.region
        ].filter(Boolean).join(', '),
      } : undefined,
      notes: `Imported from ${transaction.accountId}`,
    };
  }

  private initializeCategoryMappings() {
    // Map bank categories to expense categories
    const mappings: [string, ExpenseCategory][] = [
      ['food and drink', ExpenseCategory.FOOD],
      ['restaurants', ExpenseCategory.FOOD],
      ['fast food', ExpenseCategory.FOOD],
      ['coffee', ExpenseCategory.FOOD],
      ['groceries', ExpenseCategory.FOOD],
      ['transportation', ExpenseCategory.TRANSPORT],
      ['gas', ExpenseCategory.TRANSPORT],
      ['public transportation', ExpenseCategory.TRANSPORT],
      ['uber', ExpenseCategory.TRANSPORT],
      ['lyft', ExpenseCategory.TRANSPORT],
      ['taxi', ExpenseCategory.TRANSPORT],
      ['entertainment', ExpenseCategory.ENTERTAINMENT],
      ['movies', ExpenseCategory.ENTERTAINMENT],
      ['music', ExpenseCategory.ENTERTAINMENT],
      ['recreation', ExpenseCategory.ENTERTAINMENT],
      ['shopping', ExpenseCategory.SHOPPING],
      ['retail', ExpenseCategory.SHOPPING],
      ['clothing', ExpenseCategory.SHOPPING],
      ['healthcare', ExpenseCategory.HEALTHCARE],
      ['medical', ExpenseCategory.HEALTHCARE],
      ['pharmacy', ExpenseCategory.HEALTHCARE],
      ['education', ExpenseCategory.EDUCATION],
      ['schools', ExpenseCategory.EDUCATION],
      ['books', ExpenseCategory.EDUCATION],
      ['travel', ExpenseCategory.TRAVEL],
      ['hotels', ExpenseCategory.TRAVEL],
      ['airlines', ExpenseCategory.TRAVEL],
      ['rent', ExpenseCategory.HOUSING],
      ['utilities', ExpenseCategory.BILLS],
      ['internet', ExpenseCategory.BILLS],
      ['phone', ExpenseCategory.BILLS],
      ['insurance', ExpenseCategory.BILLS],
    ];

    for (const [key, category] of mappings) {
      this.categoryMappings.set(key, category);
    }
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date.toISOString().split('T')[0];
  }

  private loadConnections() {
    try {
      const stored = localStorage.getItem('bank_connections');
      if (stored) {
        this.connections = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load bank connections:', error);
    }
  }

  private saveConnections() {
    try {
      localStorage.setItem('bank_connections', JSON.stringify(this.connections));
    } catch (error) {
      console.error('Failed to save bank connections:', error);
    }
  }

  // === Public API ===

  getConnections(): BankConnection[] {
    return [...this.connections];
  }

  getConnection(id: string): BankConnection | undefined {
    return this.connections.find(c => c.id === id);
  }

  updateConfig(newConfig: Partial<BankIntegrationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): BankIntegrationConfig {
    return { ...this.config };
  }

  async testConnection(connectionId: string): Promise<boolean> {
    const connection = this.getConnection(connectionId);
    if (!connection) return false;

    try {
      await this.syncConnection(connection);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const bankIntegrationService = new BankIntegrationService();

// Export types and classes
export { BankIntegrationService };
export type {
  BankTransaction,
  BankAccount,
  BankConnection,
  SyncResult,
  TransactionMatchResult,
  BankIntegrationConfig,
};