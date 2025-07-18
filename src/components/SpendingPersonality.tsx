import React from 'react';
import type { SpendingPersonality as PersonalityType } from '../utils/analyticsUtils';
import { 
  ShieldCheckIcon, 
  ScaleIcon, 
  SparklesIcon, 
  FireIcon,
  LightBulbIcon 
} from '@heroicons/react/24/outline';

interface SpendingPersonalityProps {
  personality: PersonalityType;
}

export const SpendingPersonality: React.FC<SpendingPersonalityProps> = ({ personality }) => {
  const getPersonalityIcon = (type: string) => {
    switch (type) {
      case 'conservative':
        return <ShieldCheckIcon className="w-8 h-8" />;
      case 'moderate':
        return <ScaleIcon className="w-8 h-8" />;
      case 'liberal':
        return <SparklesIcon className="w-8 h-8" />;
      case 'impulsive':
        return <FireIcon className="w-8 h-8" />;
      default:
        return <LightBulbIcon className="w-8 h-8" />;
    }
  };

  const getPersonalityColors = (type: string) => {
    switch (type) {
      case 'conservative':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          score: 'bg-green-500'
        };
      case 'moderate':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          score: 'bg-blue-500'
        };
      case 'liberal':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          score: 'bg-yellow-500'
        };
      case 'impulsive':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          score: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          score: 'bg-gray-500'
        };
    }
  };

  const colors = getPersonalityColors(personality.type);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Spending Personality</h3>
      
      {/* Personality Header */}
      <div className={`p-6 rounded-lg ${colors.bg} ${colors.border} border`}>
        <div className="flex items-center space-x-4">
          <div className={`${colors.icon}`}>
            {getPersonalityIcon(personality.type)}
          </div>
          <div className="flex-1">
            <h4 className={`text-xl font-bold ${colors.title}`}>
              {personality.title}
            </h4>
            <p className="text-gray-700 mt-1">
              {personality.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Spending Score</div>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colors.score} transition-all duration-500`}
                  style={{ width: `${Math.min(personality.score, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {personality.score.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Details */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Traits */}
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Your Spending Traits</h5>
          <div className="space-y-2">
            {personality.type === 'conservative' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Consistent spending patterns</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Low transaction frequency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Minimal impulse purchases</span>
                </div>
              </>
            )}
            
            {personality.type === 'moderate' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Balanced approach to spending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Occasional lifestyle purchases</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Generally thoughtful decisions</span>
                </div>
              </>
            )}
            
            {personality.type === 'liberal' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Values experiences and lifestyle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Higher discretionary spending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Some variability in patterns</span>
                </div>
              </>
            )}
            
            {personality.type === 'impulsive' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Spontaneous purchase decisions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">High transaction variability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Frequent entertainment spending</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Score Factors</h5>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Spending Level</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-gray-600 rounded-full"
                    style={{ width: `${Math.min((personality.score * 0.3), 30)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transaction Frequency</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-gray-600 rounded-full"
                    style={{ width: `${Math.min((personality.score * 0.25), 25)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Impulse Ratio</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-gray-600 rounded-full"
                    style={{ width: `${Math.min((personality.score * 0.4), 40)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Spending Variability</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-gray-600 rounded-full"
                    style={{ width: `${Math.min((personality.score * 0.3), 30)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 pt-6 border-t">
        <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
          <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
          Personalized Recommendations
        </h5>
        <div className="grid gap-3 md:grid-cols-2">
          {personality.recommendations.map((recommendation, index) => (
            <div 
              key={index}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">
                {recommendation}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
        <div className="text-xs text-gray-500 text-center">
          Analysis based on your last 30 days of spending • Updates automatically
        </div>
      </div>
    </div>
  );
};