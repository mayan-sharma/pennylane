import { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES } from '../types';

export const useCategories = () => {
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pennylane-custom-categories');
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  }, []);

  const saveCategories = (categories: string[]) => {
    try {
      localStorage.setItem('pennylane-custom-categories', JSON.stringify(categories));
      setCustomCategories(categories);
    } catch (error) {
      console.error('Failed to save custom categories:', error);
    }
  };

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !getAllCategories().includes(trimmedCategory)) {
      const newCategories = [...customCategories, trimmedCategory];
      saveCategories(newCategories);
      return true;
    }
    return false;
  };

  const deleteCategory = (category: string) => {
    // Don't allow deletion of default categories
    if (EXPENSE_CATEGORIES.includes(category as any)) {
      return false;
    }
    
    const newCategories = customCategories.filter(cat => cat !== category);
    saveCategories(newCategories);
    return true;
  };

  const getAllCategories = () => {
    return [...EXPENSE_CATEGORIES, ...customCategories];
  };

  const isCustomCategory = (category: string) => {
    return customCategories.includes(category);
  };

  return {
    customCategories,
    addCategory,
    deleteCategory,
    getAllCategories,
    isCustomCategory
  };
};