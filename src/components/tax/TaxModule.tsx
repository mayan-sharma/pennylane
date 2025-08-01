import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useInvestments } from '../../hooks/useInvestments';
import { useNotifications } from '../../hooks/useNotifications';
import { useTax } from '../../hooks/useTax';
import { 
  calculateInvestmentRecommendations, 
  getFinancialYear, 
  calculateTaxProjection,
  calculateIncomeTax,
  compareTaxRegimes,
  calculateGST,
  calculateAdvanceTax,
  calculateCapitalGains,
  optimizeTaxStrategy
} from '../../utils/taxCalculation';
import { formatCurrency } from '../../utils/formatters';
import { formatCompactCurrency, calculateMonthsElapsed } from '../../utils/taxHelpers';
import { CircularProgress } from '../shared/CircularProgress';
import { TaxStatsCard } from '../shared/TaxStatsCard';
import { TaxCalendar } from '../TaxCalendar';
import { DocumentTracker } from '../DocumentTracker';
import { ScenarioPlanner } from '../ScenarioPlanner';
import { GST_RATES } from '../../types/tax';
import type { Expense } from '../../types';

interface TaxModuleProps {
  expenses: Expense[];
  mode?: 'dashboard' | 'calculator' | 'optimizer';
  currentIncome?: number;
  currentDeductions?: Record<string, number>;
}

export const TaxModule: React.FC<TaxModuleProps> = ({ 
  expenses, 
  mode = 'dashboard',
  currentIncome,
  currentDeductions = {}
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'calculator' | 'optimizer' | 'projection' | 'regime' | 'calendar' | 'documents' | 'scenarios'>('overview');
  const [income, setIncome] = useState(currentIncome?.toString() || '1200000');
  const [debouncedIncome, setDebouncedIncome] = useState(parseFloat(income) || 1200000);
  
  // Calculator specific states
  const [activeCalcTab, setActiveCalcTab] = useState<'income' | 'projection' | 'regime' | 'advance' | 'capital' | 'gst'>('income');
  const [deductions, setDeductions] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [gstRate, setGstRate] = useState(GST_RATES.GST_18);
  const [tdsDeducted, setTdsDeducted] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [assetType, setAssetType] = useState<'EQUITY' | 'MUTUAL_FUND' | 'PROPERTY' | 'BOND' | 'GOLD'>('EQUITY');
  
  // Optimizer specific states
  const [userProfile, setUserProfile] = useState({
    age: 30,
    riskAppetite: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    timeHorizon: 5,
    hasHomeLoan: false,
    isMetroCity: true,
    dependents: 0,
    retirementAge: 60
  });
  
  const [optimizationGoals, setOptimizationGoals] = useState({
    minimizeTax: 100,
    maximizeReturns: 70,
    liquidity: 50,
    riskTolerance: 60
  });
  
  // Debounce income input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIncome(parseFloat(income) || 0);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [income]);
  
  // Persist selected view to localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('taxModuleView');
    if (savedView) {
      setSelectedView(savedView as typeof selectedView);
    }
  }, []);
  
  const handleViewChange = useCallback((view: typeof selectedView) => {
    setSelectedView(view);
    localStorage.setItem('taxModuleView', view);
  }, []);
  
  const { getInvestmentSummary, getMaturingInvestments } = useInvestments();
  const { getUnreadCount, getHighPriorityNotifications } = useNotifications();
  const { calculateTotalDeductions } = useTax(expenses);
  
  const investmentSummary = getInvestmentSummary();
  const totalDeductions = calculateTotalDeductions();
  const maturingInvestments = getMaturingInvestments();
  const highPriorityNotifications = getHighPriorityNotifications();
  const monthsElapsed = calculateMonthsElapsed();
  
  const recommendations = useMemo(() => 
    calculateInvestmentRecommendations(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );
  
  const taxProjection = useMemo(() => 
    calculateTaxProjection(debouncedIncome, totalDeductions, monthsElapsed), 
    [debouncedIncome, totalDeductions, monthsElapsed]
  );
  
  const regimeComparison = useMemo(() => 
    compareTaxRegimes(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );
  
  const currentTax = useMemo(() => 
    calculateIncomeTax(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );
  
  // Calculator calculations
  const taxCalculation = useMemo(() => {
    return income ? calculateIncomeTax(parseFloat(income) || 0, parseFloat(deductions) || 0) : null;
  }, [income, deductions]);
  
  const advanceTax = useMemo(() => {
    return income ? calculateAdvanceTax(parseFloat(income) || 0, parseFloat(deductions) || 0, parseFloat(tdsDeducted) || 0) : null;
  }, [income, deductions, tdsDeducted]);
  
  const capitalGain = useMemo(() => {
    if (purchasePrice && salePrice && purchaseDate && saleDate) {
      return calculateCapitalGains(
        parseFloat(purchasePrice),
        parseFloat(salePrice),
        purchaseDate,
        saleDate,
        assetType
      );
    }
    return null;
  }, [purchasePrice, salePrice, purchaseDate, saleDate, assetType]);
  
  const calculatedGST = gstAmount ? calculateGST(parseFloat(gstAmount) || 0, gstRate) : 0;
  
  // Optimizer calculations
  const optimizationResults = useMemo(() => {
    const currentTotalDeductions = Object.values(currentDeductions).reduce((sum, val) => sum + val, 0);
    const optimization = optimizeTaxStrategy(debouncedIncome, currentDeductions, {
      riskAppetite: userProfile.riskAppetite,
      timeHorizon: userProfile.timeHorizon
    });
    
    return {
      optimization,
      currentTax: calculateIncomeTax(debouncedIncome, currentTotalDeductions),
      regimeComparison: compareTaxRegimes(debouncedIncome, currentTotalDeductions)
    };
  }, [debouncedIncome, currentDeductions, userProfile]);
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Income Input */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Annual Income</h3>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full p-3 border rounded-lg text-lg"
          placeholder="Enter your annual income"
        />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TaxStatsCard
          title="Income Tax"
          amount={currentTax.totalTax}
          percentage={(currentTax.totalTax / debouncedIncome) * 100}
          subtitle={`Effective rate: ${currentTax.effectiveRate.toFixed(1)}%`}
        />
        <TaxStatsCard
          title="Take Home"
          amount={debouncedIncome - currentTax.totalTax}
          subtitle="After tax income"
          icon="💰"
        />
        <TaxStatsCard
          title="Deductions"
          amount={totalDeductions}
          subtitle="Total claimed"
          icon="📊"
        />
        <TaxStatsCard
          title="Tax Saved"
          amount={totalDeductions * 0.3} // Approximate 30% bracket
          subtitle="From deductions"
          icon="✅"
        />
      </div>
      
      {/* Progress Circles */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-6">Tax Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <CircularProgress 
              percentage={(currentTax.totalTax / debouncedIncome) * 100}
              color="red"
              label="Tax Rate"
            />
            <p className="text-sm text-gray-600 mt-2">Effective Tax Rate</p>
          </div>
          <div className="text-center">
            <CircularProgress 
              percentage={(totalDeductions / 150000) * 100}
              color="green"
              label="Deductions"
            />
            <p className="text-sm text-gray-600 mt-2">80C Utilization</p>
          </div>
          <div className="text-center">
            <CircularProgress 
              percentage={regimeComparison.oldRegime.totalTax < regimeComparison.newRegime.totalTax ? 75 : 25}
              color="blue"
              label="Regime"
            />
            <p className="text-sm text-gray-600 mt-2">Optimal Choice</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'calculator', label: 'Calculator', icon: '🔢' },
    { id: 'optimizer', label: 'Optimizer', icon: '⚡' },
    { id: 'projection', label: 'Projection', icon: '🔮' },
    { id: 'regime', label: 'Regime Compare', icon: '⚖️' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'scenarios', label: 'Scenarios', icon: '🎯' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex flex-wrap border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleViewChange(tab.id as typeof selectedView)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedView === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'calendar' && <TaxCalendar />}
        {selectedView === 'documents' && <DocumentTracker />}
        {selectedView === 'scenarios' && <ScenarioPlanner />}
        {/* Add other views as needed */}
      </div>
    </div>
  );
};