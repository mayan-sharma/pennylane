import { useState, useEffect, useCallback, useRef } from 'react';
import { getStorageData, setStorageData, StorageOptions, removeStorageData } from '../utils/localStorage';

export interface PersistentStateOptions extends StorageOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
  onSave?: (key: string, value: any) => void;
  onLoad?: (key: string, value: any) => void;
  validateValue?: (value: any) => boolean;
  transformLoad?: (value: any) => any;
  transformSave?: (value: any) => any;
}

// Generic persistent state hook
export const usePersistentState = <T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, { 
  reset: () => void;
  remove: () => void;
  isLoading: boolean;
  lastSaved: Date | null;
  hasError: boolean;
}] => {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load initial value
  useEffect(() => {
    try {
      const savedValue = getStorageData(key, defaultValue, options);
      
      // Transform loaded value if transformer provided
      const transformedValue = options.transformLoad ? 
        options.transformLoad(savedValue) : savedValue;
      
      // Validate loaded value
      if (options.validateValue && !options.validateValue(transformedValue)) {
        console.warn(`Invalid value loaded for key ${key}, using default`);
        setState(defaultValue);
      } else {
        setState(transformedValue);
        options.onLoad?.(key, transformedValue);
      }
      
      setHasError(false);
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      setState(defaultValue);
      setHasError(true);
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  // Save value with optional debouncing
  const saveValue = useCallback((value: T) => {
    const doSave = () => {
      try {
        // Transform value before saving if transformer provided
        const transformedValue = options.transformSave ? 
          options.transformSave(value) : value;
        
        setStorageData(key, transformedValue, options);
        setLastSaved(new Date());
        setHasError(false);
        options.onSave?.(key, transformedValue);
      } catch (error) {
        console.error(`Error saving ${key}:`, error);
        setHasError(true);
        options.onError?.(error as Error);
      }
    };

    if (options.debounceMs && options.debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(doSave, options.debounceMs);
    } else {
      doSave();
    }
  }, [key, options]);

  // Update state and persist
  const updateState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? 
        (value as (prev: T) => T)(prevState) : value;
      
      saveValue(newValue);
      return newValue;
    });
  }, [saveValue]);

  // Reset to default value
  const reset = useCallback(() => {
    setState(defaultValue);
    saveValue(defaultValue);
  }, [defaultValue, saveValue]);

  // Remove from storage
  const remove = useCallback(() => {
    removeStorageData(key);
    setLastSaved(null);
  }, [key]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return [state, updateState, { reset, remove, isLoading, lastSaved, hasError }];
};

// Hook for arrays with item-level operations
export const usePersistentArray = <T extends { id: string }>(
  key: string,
  defaultValue: T[] = [],
  options: PersistentStateOptions = {}
) => {
  const [items, setItems, controls] = usePersistentState(key, defaultValue, options);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, [setItems]);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [setItems]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  const findItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const bulkUpdate = useCallback((updates: Array<{ id: string; updates: Partial<T> }>) => {
    setItems(prev => {
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      return prev.map(item => {
        const itemUpdates = updateMap.get(item.id);
        return itemUpdates ? { ...item, ...itemUpdates } : item;
      });
    });
  }, [setItems]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    findItem,
    bulkUpdate,
    ...controls
  };
};

// Hook for objects with nested updates
export const usePersistentObject = <T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions = {}
) => {
  const [obj, setObj, controls] = usePersistentState(key, defaultValue, options);

  const updateProperty = useCallback(<K extends keyof T>(property: K, value: T[K]) => {
    setObj(prev => ({ ...prev, [property]: value }));
  }, [setObj]);

  const updateProperties = useCallback((updates: Partial<T>) => {
    setObj(prev => ({ ...prev, ...updates }));
  }, [setObj]);

  const deleteProperty = useCallback(<K extends keyof T>(property: K) => {
    setObj(prev => {
      const { [property]: deleted, ...rest } = prev;
      return rest as T;
    });
  }, [setObj]);

  const getProperty = useCallback(<K extends keyof T>(property: K): T[K] => {
    return obj[property];
  }, [obj]);

  return {
    obj,
    setObj,
    updateProperty,
    updateProperties,
    deleteProperty,
    getProperty,
    ...controls
  };
};

// Hook for form state persistence
export const usePersistentForm = <T extends Record<string, any>>(
  key: string,
  defaultValues: T,
  options: PersistentStateOptions = {}
) => {
  const [values, setValues, controls] = usePersistentState(key, defaultValues, {
    debounceMs: 500, // Auto-save form data after 500ms
    ...options
  });

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, [setValues]);

  const updateFields = useCallback((updates: Partial<T>) => {
    setValues(prev => ({ ...prev, ...updates }));
  }, [setValues]);

  const resetForm = useCallback(() => {
    setValues(defaultValues);
  }, [setValues, defaultValues]);

  const isDirty = useCallback((): boolean => {
    return JSON.stringify(values) !== JSON.stringify(defaultValues);
  }, [values, defaultValues]);

  const getChangedFields = useCallback((): Partial<T> => {
    const changed: Partial<T> = {};
    Object.keys(values).forEach(key => {
      if (values[key] !== defaultValues[key]) {
        changed[key as keyof T] = values[key];
      }
    });
    return changed;
  }, [values, defaultValues]);

  return {
    values,
    setValues,
    updateField,
    updateFields,
    resetForm,
    isDirty,
    getChangedFields,
    ...controls
  };
};

// Hook for caching API responses
export const usePersistentCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: PersistentStateOptions & {
    staleTime?: number; // Time in ms before data is considered stale
    maxAge?: number; // Maximum age before refetch
  } = {}
) => {
  const [data, setData, controls] = usePersistentState<{
    value: T | null;
    timestamp: number;
    isStale: boolean;
  }>(key, { value: null, timestamp: 0, isStale: true }, {
    ...options,
    ttl: options.maxAge
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isStale = useCallback(() => {
    if (!data.value || !data.timestamp) return true;
    if (!options.staleTime) return false;
    return Date.now() - data.timestamp > options.staleTime;
  }, [data, options.staleTime]);

  const fetch = useCallback(async (force = false) => {
    if (!force && data.value && !isStale()) {
      return data.value;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData({
        value: result,
        timestamp: Date.now(),
        isStale: false
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data.value, isStale, fetcher, setData]);

  const invalidate = useCallback(() => {
    setData(prev => ({ ...prev, isStale: true }));
  }, [setData]);

  // Auto-fetch on mount if no data or stale
  useEffect(() => {
    if (!data.value || isStale()) {
      fetch();
    }
  }, []);

  return {
    data: data.value,
    isLoading,
    error,
    fetch,
    invalidate,
    isStale: isStale(),
    ...controls
  };
};

// Hook for session storage (tab-specific persistence)
export const useSessionState = <T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const updateState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? 
        (value as (prev: T) => T)(prevState) : value;
      
      try {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error saving to sessionStorage:`, error);
      }
      
      return newValue;
    });
  }, [key]);

  return [state, updateState];
};