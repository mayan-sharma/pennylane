import type { Expense } from '../types/expense';

export const exportToCSV = (expenses: Expense[], filename: string = 'expenses.csv') => {
  const headers = ['Date', 'Amount', 'Category', 'Description', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      expense.date,
      expense.amount.toString(),
      expense.category,
      `"${expense.description.replace(/"/g, '""')}"`,
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