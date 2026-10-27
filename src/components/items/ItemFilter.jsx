import React from 'react';
import { Search, RotateCcw, MapPin, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'ID Cards & Wallets',
  'Books & Notebooks',
  'Bags & Backpacks',
  'Clothing & Apparel',
  'Keys',
  'Accessories',
  'Other',
];

export default function ItemFilter({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  onClearFilters,
  totalCount,
  isLoading,
}) {
  const isFiltered =
    Boolean(searchQuery.trim()) ||
    typeFilter !== 'all' ||
    Boolean(categoryFilter) ||
    Boolean(locationFilter.trim());

  return (
    <div className="bg-white dark:bg-[#151724] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 transition-colors duration-200">
      {/* 1. Unmistakable Segmented Type Tabs: All Items | Lost Items | Found Items */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          Filter by Report Type:
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-1.5 bg-slate-100 dark:bg-[#1a1c2b] rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            id="filter-type-all"
            onClick={() => onTypeChange('all')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-[#25283b] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#202234]'
            }`}
          >
            <span>All Items</span>
          </button>

          <button
            type="button"
            id="filter-type-lost"
            onClick={() => onTypeChange('lost')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              typeFilter === 'lost'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/50 dark:hover:bg-[#202234]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${typeFilter === 'lost' ? 'bg-white' : 'bg-rose-500'}`}></span>
            <span>Lost Items</span>
          </button>

          <button
            type="button"
            id="filter-type-found"
            onClick={() => onTypeChange('found')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              typeFilter === 'found'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-[#202234]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${typeFilter === 'found' ? 'bg-white' : 'bg-purple-600'}`}></span>
            <span>Found Items</span>
          </button>
        </div>
      </div>

      {/* 2. Keyword Search Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
          Keyword Search:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type keywords (e.g. book, charger, keys)..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#11121d] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white dark:focus:bg-[#151726] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search query"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* 3. Category & Location Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#11121d] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white dark:focus:bg-[#151726] transition-all appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Campus Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              id="filter-location"
              value={locationFilter}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="e.g. Library, Cafeteria..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#11121d] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white dark:focus:bg-[#151726] transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Results Summary and Reset Filters Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
          {isLoading ? (
            <span className="animate-pulse">Loading active reports...</span>
          ) : (
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{totalCount}</strong>{' '}
              {totalCount === 1 ? 'item' : 'items'}
              {typeFilter !== 'all' && (
                <span className="ml-1 text-purple-600 dark:text-purple-400 font-semibold">
                  ({typeFilter === 'lost' ? 'Lost only' : 'Found only'})
                </span>
              )}
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            id="reset-filters-button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
}
