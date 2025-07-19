import React, { useMemo, useState } from 'react';

interface TaxEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'reminder' | 'opportunity';
  description: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted?: boolean;
}

interface TaxCalendarProps {
  year?: number;
}

export const TaxCalendar: React.FC<TaxCalendarProps> = ({ year = new Date().getFullYear() }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());

  const taxEvents: TaxEvent[] = useMemo(() => [
    {
      id: '1',
      title: 'Q3 TDS Return Filing',
      date: new Date(year, 0, 31), // January 31
      type: 'deadline',
      description: 'File TDS return for Q3 (Oct-Dec)',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Start Tax Planning',
      date: new Date(year, 3, 1), // April 1
      type: 'opportunity',
      description: 'New financial year begins - start tax planning',
      priority: 'medium'
    },
    {
      id: '3',
      title: '80C Investment Reminder',
      date: new Date(year, 3, 15), // April 15
      type: 'reminder',
      description: 'Plan your 80C investments for the year',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'ITR Filing for AY 2024-25',
      date: new Date(year, 6, 31), // July 31
      type: 'deadline',
      description: 'Last date to file ITR for previous financial year',
      priority: 'high'
    },
    {
      id: '5',
      title: 'Q1 TDS Return Filing',
      date: new Date(year, 6, 31), // July 31
      type: 'deadline',
      description: 'File TDS return for Q1 (Apr-Jun)',
      priority: 'high'
    },
    {
      id: '6',
      title: 'Q2 TDS Return Filing',
      date: new Date(year, 9, 31), // October 31
      type: 'deadline',
      description: 'File TDS return for Q2 (Jul-Sep)',
      priority: 'high'
    },
    {
      id: '7',
      title: 'Mid-Year Tax Review',
      date: new Date(year, 9, 15), // October 15
      type: 'reminder',
      description: 'Review and optimize your tax-saving investments',
      priority: 'medium'
    },
    {
      id: '8',
      title: 'Year-End Tax Planning',
      date: new Date(year, 11, 1), // December 1
      type: 'opportunity',
      description: 'Last chance for tax-saving investments',
      priority: 'high'
    },
    {
      id: '9',
      title: 'Q3 TDS Return Filing',
      date: new Date(year, 0, 31), // January 31 (next year)
      type: 'deadline',
      description: 'File TDS return for Q3 (Oct-Dec)',
      priority: 'high'
    }
  ], [year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventsForMonth = (month: number) => {
    return taxEvents.filter(event => event.date.getMonth() === month);
  };

  const getEventTypeIcon = (type: TaxEvent['type']) => {
    switch (type) {
      case 'deadline':
        return '⚠️';
      case 'reminder':
        return '🔔';
      case 'opportunity':
        return '💡';
      default:
        return '📅';
    }
  };

  const getEventTypeColor = (type: TaxEvent['type'], priority: TaxEvent['priority']) => {
    if (type === 'deadline') {
      return priority === 'high' ? 'border-l-red-500 bg-red-50' : 'border-l-orange-500 bg-orange-50';
    }
    if (type === 'opportunity') {
      return 'border-l-green-500 bg-green-50';
    }
    return 'border-l-blue-500 bg-blue-50';
  };

  const toggleEventCompletion = (eventId: string) => {
    const newCompleted = new Set(completedEvents);
    if (newCompleted.has(eventId)) {
      newCompleted.delete(eventId);
    } else {
      newCompleted.add(eventId);
    }
    setCompletedEvents(newCompleted);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    const upcoming = taxEvents
      .filter(event => event.date >= now && !completedEvents.has(event.id))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
    return upcoming;
  };

  const currentMonthEvents = getEventsForMonth(selectedMonth);
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Calendar {year}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedMonth((prev) => (prev - 1 + 12) % 12)}
            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedMonth((prev) => (prev + 1) % 12)}
            className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-lg font-medium mb-4">{monthNames[selectedMonth]} {year}</h4>
          
          <div className="space-y-3">
            {currentMonthEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tax events this month</p>
            ) : (
              currentMonthEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getEventTypeColor(event.type, event.priority)} ${
                    completedEvents.has(event.id) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <h5 className={`font-medium ${completedEvents.has(event.id) ? 'line-through' : ''}`}>
                          {event.title}
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {event.date.toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleEventCompletion(event.id)}
                      className={`ml-2 p-1 rounded-full transition-colors ${
                        completedEvents.has(event.id) 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-100'
                      }`}
                      aria-label={completedEvents.has(event.id) ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-lg font-medium mb-4">Upcoming Events</h4>
          
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getEventTypeColor(event.type, event.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <h5 className="font-medium">{event.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          event.priority === 'high' ? 'bg-red-100 text-red-800' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-gray-500">
                          {event.date.toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                        <span className="text-xs text-gray-500">
                          ({Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEventCompletion(event.id)}
                      className="ml-2 p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-100 transition-colors"
                      aria-label="Mark as complete"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {taxEvents.filter(e => e.type === 'deadline' && !completedEvents.has(e.id)).length}
                </p>
                <p className="text-xs text-gray-500">Pending Deadlines</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedEvents.size}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {taxEvents.filter(e => e.type === 'opportunity').length}
                </p>
                <p className="text-xs text-gray-500">Opportunities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};