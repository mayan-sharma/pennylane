import { useState, useCallback } from 'react';

interface BulkOperation<T> {
  label: string;
  action: (items: T[]) => Promise<void> | void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export const useBulkOperations = <T extends { id: string }>(
  operations: BulkOperation<T>[]
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    operation: BulkOperation<T>;
    items: T[];
  } | null>(null);

  const executeBulkOperation = useCallback(async (
    operation: BulkOperation<T>,
    items: T[]
  ) => {
    if (items.length === 0) return;

    if (operation.requiresConfirmation) {
      setPendingOperation({ operation, items });
      setShowConfirmation(true);
      return;
    }

    setIsProcessing(true);
    try {
      await operation.action(items);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const confirmOperation = useCallback(async () => {
    if (!pendingOperation) return;

    setShowConfirmation(false);
    setIsProcessing(true);

    try {
      await pendingOperation.operation.action(pendingOperation.items);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setPendingOperation(null);
    }
  }, [pendingOperation]);

  const cancelOperation = useCallback(() => {
    setShowConfirmation(false);
    setPendingOperation(null);
  }, []);

  const getOperationButtonProps = useCallback((operation: BulkOperation<T>) => {
    const baseClasses = 'px-3 py-1 text-sm font-medium border rounded-md transition-colors';
    
    const variantClasses = {
      primary: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
      secondary: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100',
      danger: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
    };

    return {
      className: `${baseClasses} ${variantClasses[operation.variant || 'secondary']}`,
      disabled: isProcessing
    };
  }, [isProcessing]);

  return {
    isProcessing,
    showConfirmation,
    pendingOperation,
    executeBulkOperation,
    confirmOperation,
    cancelOperation,
    getOperationButtonProps,
    operations
  };
};