import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export const TaxNotifications: React.FC = () => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    getHighPriorityNotifications,
    getUpcomingDeadlines
  } = useNotifications();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE':
        return '⏰';
      case 'OPTIMIZATION':
        return '💡';
      case 'COMPLIANCE':
        return '📋';
      case 'REMINDER':
        return '🔔';
      default:
        return '📢';
    }
  };

  const highPriorityNotifications = getHighPriorityNotifications();
  const upcomingDeadlines = getUpcomingDeadlines();
  const unreadCount = getUnreadCount();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Tax Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* High Priority Alerts */}
      {highPriorityNotifications.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-3">🚨 Urgent Attention Required</h3>
          <div className="space-y-2">
            {highPriorityNotifications.map(notification => (
              <div key={notification.id} className="bg-white p-3 rounded border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-red-900">{notification.title}</h4>
                    <p className="text-sm text-red-700">{notification.message}</p>
                    {notification.dueDate && (
                      <p className="text-xs text-red-600 mt-1">Due: {formatDate(notification.dueDate)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines Summary */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">📅 Upcoming Tax Deadlines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingDeadlines.slice(0, 6).map(deadline => (
              <div key={deadline.id} className="bg-white p-3 rounded border border-yellow-200">
                <div className="text-sm font-medium text-yellow-900">{deadline.title}</div>
                <div className="text-xs text-yellow-700">{formatDate(deadline.dueDate!)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Notifications */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">All Notifications</h3>
        </div>
        
        {notifications.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications yet</p>
            <p className="text-sm">Tax reminders and alerts will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'} mb-2`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {formatDateTime(notification.createdAt)}</span>
                      {notification.dueDate && (
                        <span>Due: {formatDate(notification.dueDate)}</span>
                      )}
                      {notification.actionRequired && (
                        <span className="text-orange-600 font-medium">Action Required</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Types Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span>⏰</span>
            <span>Tax Deadlines</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💡</span>
            <span>Optimization Tips</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📋</span>
            <span>Compliance Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔔</span>
            <span>General Reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
};