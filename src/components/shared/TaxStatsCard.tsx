import React from 'react';
import { formatCompactCurrency, getTaxStatusColor, getTaxStatusIcon } from '../../utils/taxHelpers';

interface TaxStatsCardProps {
  title: string;
  amount: number;
  percentage?: number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  onClick?: () => void;
}

export const TaxStatsCard: React.FC<TaxStatsCardProps> = ({
  title,
  amount,
  percentage,
  subtitle,
  icon,
  trend,
  trendValue,
  onClick
}) => {
  const statusColor = percentage ? getTaxStatusColor(percentage) : 'text-gray-600 bg-gray-50';
  const statusIcon = percentage ? getTaxStatusIcon(percentage) : icon || '💰';
  
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';
  const trendColor = trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-gray-600';
  
  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow-sm border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{statusIcon}</span>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatCompactCurrency(amount)}
            </p>
            {percentage !== undefined && (
              <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block mt-1 ${statusColor}`}>
                {percentage.toFixed(1)}% of income
              </p>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {trend && trendValue !== undefined && (
          <div className={`text-right ${trendColor}`}>
            <div className="flex items-center space-x-1">
              <span>{trendIcon}</span>
              <span className="text-sm font-medium">
                {Math.abs(trendValue).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">vs last month</p>
          </div>
        )}
      </div>
    </div>
  );
};