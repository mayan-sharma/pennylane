import React, { useState } from 'react';
import { type CustomCategory, ExpenseCategory } from '../types/expense';

interface CustomCategoriesManagerProps {
  categories: CustomCategory[];
  onAddCategory: (categoryData: Omit<CustomCategory, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<CustomCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

const PRESET_ICONS = [
  '🍔', '🚗', '💊', '🎮', '👕', '🏠', '📚', '✈️', '💰', '🎵',
  '⚽', '🖥️', '📱', '🎬', '🍕', '☕', '🚌', '🏥', '🎨', '🔧'
];

export const CustomCategoriesManager: React.FC<CustomCategoriesManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    icon: PRESET_ICONS[0],
    parentCategory: '' as ExpenseCategory | '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: PRESET_COLORS[0],
      icon: PRESET_ICONS[0],
      parentCategory: '',
    });
    setIsAddFormOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const categoryData: Omit<CustomCategory, 'id'> = {
      name: formData.name.trim(),
      color: formData.color,
      icon: formData.icon,
      parentCategory: formData.parentCategory || undefined,
    };

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, categoryData);
    } else {
      onAddCategory(categoryData);
    }

    resetForm();
  };

  const startEdit = (category: CustomCategory) => {
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || PRESET_ICONS[0],
      parentCategory: category.parentCategory || '',
    });
    setEditingCategory(category);
    setIsAddFormOpen(true);
  };

  const handleDelete = (category: CustomCategory) => {
    if (window.confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      onDeleteCategory(category.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custom Categories</h3>
          <p className="text-sm text-gray-600">
            Create custom expense categories to better organize your spending
          </p>
        </div>
        <button
          onClick={() => setIsAddFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddFormOpen && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Pet Expenses, Hobby, Subscriptions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parentCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentCategory: e.target.value as ExpenseCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Standalone)</option>
                  {Object.values(ExpenseCategory).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-1 p-2 border border-gray-300 rounded-md max-h-32 overflow-y-auto">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`p-2 text-lg rounded hover:bg-gray-100 ${
                        formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-10 gap-1 p-2 border border-gray-300 rounded-md">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full ${
                        formData.color === color ? 'ring-2 ring-gray-400 ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center space-x-2 p-2 bg-white rounded border">
              <span className="text-lg">{formData.icon}</span>
              <span 
                className="px-2 py-1 rounded text-white text-sm font-medium"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name || 'Category Name'}
              </span>
              {formData.parentCategory && (
                <span className="text-xs text-gray-500">
                  under {formData.parentCategory}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                {editingCategory ? 'Update' : 'Add'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📂</div>
            <p>No custom categories yet</p>
            <p className="text-sm">Create your first custom category to get started</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{category.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-2 py-1 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                    </span>
                    {category.parentCategory && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        under {category.parentCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEdit(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-blue-800">How Custom Categories Work</h5>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Custom categories appear alongside default categories when adding expenses</li>
              <li>• Link to parent categories for better organization and reporting</li>
              <li>• Use icons and colors to make categories easily recognizable</li>
              <li>• Categories are used in analytics and budget tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};