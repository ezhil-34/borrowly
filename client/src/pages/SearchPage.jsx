import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { itemsApi } from '../api';
import ItemGrid from '../components/items/ItemGrid';
import FilterBar from '../components/items/FilterBar';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { location } = useApp();

  const getParam = (k) => searchParams.get(k) || '';

  const filters = {
    q: getParam('q'),
    category: getParam('category'),
    sort: getParam('sort') || 'relevance',
    radius: getParam('radius'),
    maxPrice: getParam('maxPrice'),
    start: getParam('start'),
    end: getParam('end')
  };

  const handleFilterChange = (updates) => {
    const next = { ...filters, ...updates };
    const filteredEntries = Object.entries(next).filter(([, v]) => v !== '' && v != null);
    setSearchParams(Object.fromEntries(filteredEntries));
  };

  const fetchResults = useFetch(
    () =>
      itemsApi.discover({
        ...filters,
        lat: location.lat,
        lng: location.lng
      }),
    [searchParams.toString(), location.lat, location.lng]
  );

  const title = filters.q
    ? `Results for “${filters.q}”`
    : filters.category
    ? `${filters.category} in Chennai`
    : 'Borrow Items Nearby';

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">{title}</h1>
          <p className="mt-1 text-xs text-mute">
            Searching items around <b>{location.label}</b>
          </p>
        </div>

        {fetchStateHasData(fetchResults) && (
          <span className="text-xs text-mute font-semibold">
            {fetchResults.data.items.length} item{fetchResults.data.items.length === 1 ? '' : 's'} available
          </span>
        )}
      </div>

      {/* Filter and Sorting Toolbar */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* Results Section */}
      <div className="mt-4">
        {fetchResults.loading && !fetchResults.data ? (
          <ItemSkeleton count={8} />
        ) : fetchResults.error ? (
          <ErrorBox error={fetchResults.error} retry={fetchResults.reload} />
        ) : (
          <ItemGrid
            items={fetchResults.data?.items}
            emptyTitle="No items match your criteria"
            emptyMessage="Try clearing some filters, widening the distance, or checking different dates."
          />
        )}
      </div>
    </div>
  );
}

function fetchStateHasData(state) {
  return state.data && state.data.items && !state.loading;
}
