# Expense Tracker

A modern expense tracking web application built with React, TypeScript, and Tailwind CSS.

## Features

### Core Features ✅
- **Add/Edit/Delete Expenses**: Complete CRUD operations for expense management
- **Expense Categorization**: Organize expenses into predefined categories (Food, Transport, Bills, Entertainment, etc.)
- **Dashboard Overview**: View total expenses, monthly/weekly totals, and recent transactions
- **Search & Filter**: Find expenses by description, category, or date range
- **Local Storage**: All data persists locally in your browser

### Categories
- Food
- Transport  
- Bills
- Entertainment
- Shopping
- Healthcare
- Education
- Travel
- Housing
- Other

### Dashboard Statistics
- Total expenses across all time
- This month's spending
- This week's spending
- Total expense count
- Top spending categories
- Recent transactions

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development
- **State Management**: React hooks (useState, useEffect, custom hooks)
- **Data Persistence**: Browser localStorage
- **Icons**: Heroicons (via Tailwind CSS)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd expense-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard with stats
│   ├── ExpenseForm.tsx  # Add/edit expense form
│   ├── ExpenseList.tsx  # Expense list with filters
│   └── Layout.tsx       # Main app layout
├── hooks/              # Custom React hooks
│   └── useExpenses.ts  # Expense management hook
├── types/              # TypeScript type definitions
│   └── expense.ts      # Expense-related types
├── utils/              # Utility functions
│   └── localStorage.ts # Local storage utilities
├── App.tsx             # Main app component
├── main.tsx           # App entry point
└── index.css          # Tailwind CSS imports
```

## Future Enhancements

- **Kotak Bank API Integration**: Automatic transaction import
- **Tax Calculations**: Income tax and GST tracking
- **Receipt OCR**: Photo upload with text extraction
- **Budget Management**: Spending limits and alerts
- **Advanced Analytics**: Charts and detailed reporting
- **Data Export**: CSV/Excel export functionality
- **Multi-currency Support**: Handle multiple currencies
- **Bill Reminders**: Automated expense reminders
- **Cloud Sync**: Backend integration for data synchronization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.