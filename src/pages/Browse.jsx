import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, AlertCircle, RefreshCw, PlusCircle, Inbox, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { batchGetSignedUrls } from '../lib/storage';
import ItemCard from '../components/items/ItemCard';
import ItemFilter from '../components/items/ItemFilter';

const PAGE_SIZE = 9;

export default function Browse() {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'lost' | 'found'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Data & Pagination States
  const [items, setItems] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Status States
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Debounce search query to prevent excessive queries while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main fetch function
  const fetchItems = useCallback(
    async (pageIndex = 0, isAppending = false) => {
      if (isAppending) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorMsg(null);
      }

      try {
        const from = pageIndex * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('items')
          .select(
            'id, user_id, type, title, category, description, location, date_incident, photo_path, status, created_at',
            { count: 'exact' }
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        // Apply Type Filter
        if (typeFilter !== 'all') {
          query = query.eq('type', typeFilter);
        }

        // Apply Category Filter
        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        // Apply Location Filter
        if (locationFilter.trim()) {
          query = query.ilike('location', `%${locationFilter.trim()}%`);
        }

        // Apply Keyword Search (Title or Description)
        if (debouncedSearch) {
          query = query.or(
            `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
          );
        }

        // Apply Range Pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          throw new Error(error.message || 'Failed to fetch campus items.');
        }

        const fetchedItems = data || [];
        setTotalCount(count ?? 0);
        setHasMore((count ?? 0) > from + fetchedItems.length);

        // Fetch signed URLs for items with photos in batch
        const urls = await batchGetSignedUrls(fetchedItems);

        setSignedUrls((prev) => ({
          ...prev,
          ...urls,
        }));

        if (isAppending) {
          setItems((prev) => [...prev, ...fetchedItems]);
        } else {
          setItems(fetchedItems);
        }
      } catch (err) {
        console.error('[FindIt Browse Error]:', err);
        setErrorMsg(err.message || 'An unexpected error occurred while loading items.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [typeFilter, categoryFilter, locationFilter, debouncedSearch]
  );

  // Trigger fresh fetch whenever filters change
  useEffect(() => {
    setPage(0);
    fetchItems(0, false);
  }, [fetchItems]);

  // Load More handler
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setTypeFilter('all');
    setCategoryFilter('');
    setLocationFilter('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Lost &amp; Found Feed
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and search active lost and found items across all campus buildings.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Report an Item
        </Link>
      </div>

      {/* Filter Component */}
      <ItemFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        onClearFilters={handleClearFilters}
        totalCount={totalCount}
        isLoading={isLoading}
      />

      {/* Feed Content States */}
      {errorMsg ? (
        /* Error State */
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-950">Unable to Load Items</h3>
            <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">{errorMsg}</p>
          </div>
          <button
            onClick={() => fetchItems(0, false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-700 font-semibold text-sm rounded-xl border border-rose-300 hover:bg-rose-100/50 shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Query
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="h-44 bg-slate-100 rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">No Items Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find any active reports matching your current filter criteria.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Reset Filters
            </button>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Submit a Report
            </Link>
          </div>
        </div>
      ) : (
        /* Active Items Grid */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                signedPhotoUrl={signedUrls[item.photo_path] || null}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:shadow transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Loading More Items...
                  </>
                ) : (
                  <>Load More Items ({totalCount - items.length} remaining)</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
