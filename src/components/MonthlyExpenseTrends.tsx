import React, { useMemo, useState } from 'react';
import { type Expense } from '../types';
import { useCategories } from '../hooks/useCategories';

interface MonthlyExpenseTrendsProps {
  expenses: Expense[];
}

interface MonthlyData {
  month: string;
  total: number;
  categories: Record<string, number>;
}

interface ChartProps {
  data: MonthlyData[];
  height?: number;
  selectedCategories: string[];
  showTotal: boolean;
}

const SimpleChart: React.FC<ChartProps> = ({ 
  data, 
  height = 400, 
  selectedCategories, 
  showTotal 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    data: MonthlyData;
    category?: string;
  } | null>(null);
  const width = 900;
  const padding = { top: 30, right: 40, bottom: 80, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach(item => {
      if (showTotal) {
        max = Math.max(max, item.total);
      }
      selectedCategories.forEach(category => {
        max = Math.max(max, item.categories[category] || 0);
      });
    });
    // Add some padding to the top of the chart
    return max > 0 ? max * 1.1 : 100;
  }, [data, selectedCategories, showTotal]);

  const getYPosition = (value: number) => {
    if (maxValue === 0) return chartHeight;
    return chartHeight - (value / maxValue * chartHeight);
  };

  const getXPosition = (index: number) => {
    if (data.length <= 1) return chartWidth / 2;
    return (index / (data.length - 1)) * chartWidth;
  };

  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#EC4899', // pink
  ];

  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    
    let path = `M ${getXPosition(0)} ${getYPosition(values[0])}`;
    for (let i = 1; i < values.length; i++) {
      path += ` L ${getXPosition(i)} ${getYPosition(values[i])}`;
    }
    return path;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="border rounded bg-white">
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={chartWidth} 
            height={chartHeight} 
            fill="url(#gridGradient)" 
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = maxValue * ratio;
            const y = padding.top + getYPosition(value);
            return (
              <g key={ratio}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={padding.left + chartWidth} 
                  y2={y} 
                  stroke="#e5e7eb" 
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? "0" : "2,2"}
                />
                <line 
                  x1={padding.left - 5} 
                  y1={y} 
                  x2={padding.left} 
                  y2={y} 
                  stroke="#6b7280" 
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#6b7280"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  ₹{value.toLocaleString()}
                </text>
              </g>
            );
          })}
        
          {/* Vertical grid lines */}
          {data.map((item, index) => {
            const x = padding.left + getXPosition(index);
            return (
              <line 
                key={`vgrid-${index}`}
                x1={x} 
                y1={padding.top} 
                x2={x} 
                y2={padding.top + chartHeight} 
                stroke="#f3f4f6" 
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            );
          })}
          
          {/* X-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top + chartHeight} 
            x2={padding.left + chartWidth} 
            y2={padding.top + chartHeight} 
            stroke="#6b7280" 
            strokeWidth="2"
          />
          
          {/* Y-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={padding.top + chartHeight} 
            stroke="#6b7280" 
            strokeWidth="2"
          />
        
          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = padding.left + getXPosition(index);
            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={padding.top + chartHeight} 
                  x2={x} 
                  y2={padding.top + chartHeight + 5} 
                  stroke="#6b7280" 
                  strokeWidth="1"
                />
                <text 
                  x={x} 
                  y={padding.top + chartHeight + 20} 
                  textAnchor="middle" 
                  fontSize="11" 
                  fill="#6b7280"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  transform={data.length > 6 ? `rotate(-45, ${x}, ${padding.top + chartHeight + 20})` : ""}
                >
                  {item.month}
                </text>
              </g>
            );
          })}
          
          {/* Total line */}
          {showTotal && data.length > 1 && (
            <g>
              <path
                d={createPath(data.map(d => d.total))}
                fill="none"
                stroke="#1f2937"
                strokeWidth="3"
                transform={`translate(${padding.left}, ${padding.top})`}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Total line points */}
              {data.map((item, index) => (
                <circle
                  key={`total-${index}`}
                  cx={padding.left + getXPosition(index)}
                  cy={padding.top + getYPosition(item.total)}
                  r="5"
                  fill="#1f2937"
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (rect) {
                      setHoveredPoint({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        data: item,
                        category: 'Total'
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          )}
          
          {/* Category lines */}
          {selectedCategories.map((category, catIndex) => (
            <g key={category}>
              {data.length > 1 && (
                <path
                  d={createPath(data.map(d => d.categories[category] || 0))}
                  fill="none"
                  stroke={colors[catIndex % colors.length]}
                  strokeWidth="2.5"
                  transform={`translate(${padding.left}, ${padding.top})`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Category points */}
              {data.map((item, index) => (
                <circle
                  key={`${category}-${index}`}
                  cx={padding.left + getXPosition(index)}
                  cy={padding.top + getYPosition(item.categories[category] || 0)}
                  r="4"
                  fill={colors[catIndex % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (rect) {
                      setHoveredPoint({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        data: item,
                        category: category
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          ))}
          
          {/* Legend */}
          <g transform={`translate(${padding.left + chartWidth - 200}, ${padding.top + 10})`}>
            {showTotal && (
              <g>
                <circle cx="0" cy="0" r="4" fill="#1f2937" />
                <text x="10" y="4" fontSize="12" fill="#6b7280" fontFamily="system-ui, -apple-system, sans-serif">
                  Total Expenses
                </text>
              </g>
            )}
            {selectedCategories.map((category, index) => (
              <g key={category} transform={`translate(0, ${(showTotal ? 1 : 0) * 20 + index * 20})`}>
                <circle cx="0" cy="0" r="3" fill={colors[index % colors.length]} />
                <text x="10" y="4" fontSize="12" fill="#6b7280" fontFamily="system-ui, -apple-system, sans-serif">
                  {category}
                </text>
              </g>
            ))}
          </g>
          
          {/* Tooltip */}
          {hoveredPoint && (
            <g>
              <rect
                x={hoveredPoint.x - 60}
                y={hoveredPoint.y - 50}
                width="120"
                height="40"
                fill="rgba(0, 0, 0, 0.8)"
                rx="4"
              />
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 30}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {hoveredPoint.data.month}
              </text>
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 15}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="bold"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {hoveredPoint.category === 'Total' 
                  ? `₹${hoveredPoint.data.total.toLocaleString()}`
                  : `₹${(hoveredPoint.data.categories[hoveredPoint.category!] || 0).toLocaleString()}`
                }
              </text>
            </g>
          )}
        </svg>
      </div>
      
      {/* Mobile-friendly legend below chart */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {showTotal && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
            <span className="text-sm text-gray-600">Total Expenses</span>
          </div>
        )}
        {selectedCategories.map((category, index) => (
          <div key={category} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="text-sm text-gray-600">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MonthlyExpenseTrends: React.FC<MonthlyExpenseTrendsProps> = ({ expenses }) => {
  const { getAllCategories } = useCategories();
  const allCategories = getAllCategories();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showTotal, setShowTotal] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, MonthlyData>();
    
    const filteredExpenses = expenses.filter(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString();
      
      const yearMatch = selectedYear === 'all' || year === selectedYear;
      const monthMatch = selectedMonth === 'all' || month === selectedMonth;
      
      return yearMatch && monthMatch;
    });
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, {
          month: monthLabel,
          total: 0,
          categories: {}
        });
      }
      
      const monthData = dataMap.get(monthKey)!;
      monthData.total += expense.amount;
      monthData.categories[expense.category] = (monthData.categories[expense.category] || 0) + expense.amount;
    });
    
    return Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [expenses, selectedYear, selectedMonth]);

  const availableYears = useMemo(() => {
    const years = [...new Set(expenses.map(expense => 
      new Date(expense.date).getFullYear().toString()
    ))].sort();
    return years;
  }, [expenses]);

  const availableMonths = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Add some expenses to see monthly trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Monthly Expense Trends</h2>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'chart'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chart View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-total"
                  checked={showTotal}
                  onChange={(e) => setShowTotal(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="show-total" className="text-sm font-medium text-gray-700">
                  Show Total
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {viewMode === 'chart' ? (
          <SimpleChart 
            data={monthlyData} 
            selectedCategories={selectedCategories}
            showTotal={showTotal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Month</th>
                  {showTotal && (
                    <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                  )}
                  {selectedCategories.map(category => (
                    <th key={category} className="border border-gray-300 px-4 py-2 text-left">
                      {category}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {data.month}
                    </td>
                    {showTotal && (
                      <td className="border border-gray-300 px-4 py-2">
                        ₹{data.total.toFixed(2)}
                      </td>
                    )}
                    {selectedCategories.map(category => (
                      <td key={category} className="border border-gray-300 px-4 py-2">
                        ₹{(data.categories[category] || 0).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Average Monthly</h4>
            <p className="text-2xl font-bold text-blue-900">
              ₹{monthlyData.length > 0 ? (monthlyData.reduce((sum, d) => sum + d.total, 0) / monthlyData.length).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800">Lowest Month</h4>
            <p className="text-2xl font-bold text-green-900">
              ₹{monthlyData.length > 0 ? Math.min(...monthlyData.map(d => d.total)).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-red-800">Highest Month</h4>
            <p className="text-2xl font-bold text-red-900">
              ₹{monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.total)).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};