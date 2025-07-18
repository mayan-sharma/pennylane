import React from 'react';
import type { TrendData } from '../utils/analyticsUtils';

interface TrendChartProps {
  data: TrendData[];
  title: string;
  type: 'amount' | 'count';
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  title, 
  type, 
  height = 200 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const values = data.map(d => type === 'amount' ? d.amount : d.count);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const formatValue = (value: number): string => {
    if (type === 'amount') {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return value.toString();
  };

  const getBarHeight = (value: number): number => {
    return ((value - minValue) / range) * (height - 60) + 20;
  };

  const getGradientColor = (value: number): string => {
    const intensity = (value - minValue) / range;
    const hue = type === 'amount' ? 220 : 160; // Blue for amount, green for count
    return `hsl(${hue}, ${70 + intensity * 30}%, ${50 + intensity * 20}%)`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="relative" style={{ height: height + 40 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-10 w-16 flex flex-col justify-between text-xs text-gray-500">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(minValue + range * 0.5)}</span>
          <span>{formatValue(minValue)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 mr-4 relative" style={{ height }}>
          {/* Grid lines */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-100"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
          </div>

          {/* Bars */}
          <div className="flex items-end justify-between h-full pt-2 pb-2">
            {data.map((item, index) => {
              const value = type === 'amount' ? item.amount : item.count;
              const barHeight = getBarHeight(value);
              const color = getGradientColor(value);
              
              return (
                <div
                  key={index}
                  className="group relative flex flex-col items-center"
                  style={{ width: `${100 / data.length - 2}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                    <div>{item.label}</div>
                    <div>{formatValue(value)}</div>
                    <div className="text-gray-300">{item.count} transactions</div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: color,
                      boxShadow: `0 2px 4px ${color}40`
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-16 mr-4 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span
              key={index}
              className="text-center"
              style={{ width: `${100 / data.length}%` }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-500">Total</div>
          <div className="font-semibold">
            {formatValue(values.reduce((sum, val) => sum + val, 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Average</div>
          <div className="font-semibold">
            {formatValue(values.reduce((sum, val) => sum + val, 0) / values.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Peak</div>
          <div className="font-semibold">
            {formatValue(maxValue)}
          </div>
        </div>
      </div>
    </div>
  );
};