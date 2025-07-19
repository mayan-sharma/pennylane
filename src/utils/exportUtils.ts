import type { Expense } from '../types/expense';
import type { AnalyticsData } from './analyticsUtils';

export interface ExportOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  format: 'csv' | 'pdf';
  includeCharts?: boolean;
}

export const exportToCSV = (expenses: Expense[], filename: string = 'expenses.csv') => {
  const headers = ['Date', 'Amount', 'Category', 'Description', 'Payment Method', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      expense.date,
      expense.amount.toString(),
      expense.category,
      `"${expense.description.replace(/"/g, '""')}"`,
      '',
      new Date(expense.createdAt).toLocaleDateString('en-IN')
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportAnalyticsToCSV = (analyticsData: AnalyticsData, filename: string = 'analytics-report.csv'): void => {
  const sections = [];

  // Monthly trends
  sections.push('Monthly Trends');
  sections.push('Month,Amount,Transaction Count');
  analyticsData.monthlyTrends.forEach(trend => {
    sections.push(`${trend.label},${trend.amount},${trend.count}`);
  });
  sections.push('');

  // Category insights
  sections.push('Category Insights');
  sections.push('Category,Amount,Percentage,Trend,Trend %,Avg Transaction');
  analyticsData.categoryInsights.forEach(insight => {
    sections.push(`${insight.category},${insight.amount},${insight.percentage.toFixed(2)},${insight.trend},${insight.trendPercentage.toFixed(2)},${insight.avgTransactionSize.toFixed(2)}`);
  });
  sections.push('');

  // Summary stats
  sections.push('Summary Statistics');
  sections.push('Metric,Value');
  sections.push(`Total Spent,${analyticsData.totalSpent}`);
  sections.push(`Average Monthly Spending,${analyticsData.avgMonthlySpending.toFixed(2)}`);
  sections.push(`Most Expensive Month,${analyticsData.mostExpensiveMonth}`);
  sections.push(`Top Spending Day,${analyticsData.topSpendingDay}`);
  sections.push(`Spending Personality,${analyticsData.spendingPersonality.title}`);

  const csvContent = sections.join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const generatePDFReport = async (analyticsData: AnalyticsData, expenses: Expense[]): Promise<void> => {
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Expense Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 200px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .personality { background-color: #f8f9fa; padding: 20px; border-radius: 10px; }
        @media print { 
          .section { page-break-inside: avoid; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Expense Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Total Transactions: ${expenses.length}</p>
      </div>

      <div class="section">
        <h2>Summary Statistics</h2>
        <div class="metric">
          <strong>Total Spent:</strong><br>
          ₹${analyticsData.totalSpent.toLocaleString('en-IN')}
        </div>
        <div class="metric">
          <strong>Average Monthly:</strong><br>
          ₹${analyticsData.avgMonthlySpending.toLocaleString('en-IN')}
        </div>
        <div class="metric">
          <strong>Most Expensive Month:</strong><br>
          ${analyticsData.mostExpensiveMonth}
        </div>
        <div class="metric">
          <strong>Top Spending Day:</strong><br>
          ${analyticsData.topSpendingDay}
        </div>
      </div>

      <div class="section">
        <h2>Monthly Trends</h2>
        <table>
          <tr><th>Month</th><th>Amount</th><th>Transactions</th><th>Avg per Transaction</th></tr>
          ${analyticsData.monthlyTrends.map(trend => 
            `<tr><td>${trend.label}</td><td>₹${trend.amount.toLocaleString('en-IN')}</td><td>${trend.count}</td><td>₹${(trend.amount/trend.count).toFixed(0)}</td></tr>`
          ).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Category Breakdown</h2>
        <table>
          <tr><th>Category</th><th>Amount</th><th>Percentage</th><th>Trend</th><th>Avg Transaction</th></tr>
          ${analyticsData.categoryInsights.map(insight => 
            `<tr><td>${insight.category}</td><td>₹${insight.amount.toLocaleString('en-IN')}</td><td>${insight.percentage.toFixed(1)}%</td><td>${insight.trend} ${insight.trendPercentage.toFixed(1)}%</td><td>₹${insight.avgTransactionSize.toFixed(0)}</td></tr>`
          ).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Spending Personality Analysis</h2>
        <div class="personality">
          <h3>${analyticsData.spendingPersonality.title} (Score: ${analyticsData.spendingPersonality.score.toFixed(0)})</h3>
          <p><strong>Type:</strong> ${analyticsData.spendingPersonality.type.charAt(0).toUpperCase() + analyticsData.spendingPersonality.type.slice(1)}</p>
          <p><strong>Description:</strong> ${analyticsData.spendingPersonality.description}</p>
          <h4>Personalized Recommendations:</h4>
          <ul>
            ${analyticsData.spendingPersonality.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>Report Summary</h2>
        <p>This report provides a comprehensive analysis of your spending patterns over ${analyticsData.monthlyTrends.length} months of data. 
        Your spending personality analysis is based on transaction frequency, amount variability, and category preferences.</p>
        <p><em>Generated by PennyLane Analytics on ${new Date().toLocaleString()}</em></p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

export const filterExpensesByDateRange = (
  expenses: Expense[], 
  startDate: Date, 
  endDate: Date
): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
};

export const filterExpensesByCategories = (
  expenses: Expense[], 
  categories: string[]
): Expense[] => {
  if (categories.length === 0) return expenses;
  return expenses.filter(expense => categories.includes(expense.category));
};

export const filterExpensesByAmount = (
  expenses: Expense[], 
  minAmount?: number, 
  maxAmount?: number
): Expense[] => {
  return expenses.filter(expense => {
    if (minAmount !== undefined && expense.amount < minAmount) return false;
    if (maxAmount !== undefined && expense.amount > maxAmount) return false;
    return true;
  });
};

export const exportToJSON = (expenses: Expense[], filename: string = 'expenses.json') => {
  const jsonContent = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};