import React from 'react';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { itemsApi } from '../api';
import ItemGrid from '../components/items/ItemGrid';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import Button from '../components/common/Button';

export default function SavedPage() {
  const { user, saved, location, requireAuth } = useApp();

  const itemsFetch = useFetch(
    () => itemsApi.discover({ lat: location.lat, lng: location.lng }),
    [location.lat, location.lng]
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8">
        <span className="text-4xl mb-3">❤️</span>
        <h2 className="text-xl font-bold text-[#232826]">Log In to View Saved Items</h2>
        <p className="mt-1 text-xs text-mute max-w-sm">
          Bookmark tools, cameras, and gear you might want to borrow later.
        </p>
        <Button onClick={requireAuth} className="mt-4">
          Log In
        </Button>
      </div>
    );
  }

  if (itemsFetch.loading && !itemsFetch.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={4} />
      </div>
    );
  }

  if (itemsFetch.error) {
    return (
      <div className="py-8">
        <ErrorBox error={itemsFetch.error} retry={itemsFetch.reload} />
      </div>
    );
  }

  const allItems = itemsFetch.data?.items || [];
  const savedItems = allItems.filter((i) => saved.has(i.id));

  return (
    <div className="py-6">
      <div className="border-b border-line pb-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">Saved Items</h1>
        <p className="text-xs text-mute mt-1">
          {savedItems.length} bookmarked item{savedItems.length === 1 ? '' : 's'} for future borrowing.
        </p>
      </div>

      <ItemGrid
        items={savedItems}
        emptyTitle="No saved items yet"
        emptyMessage="Tap the heart icon (♥) on any item listing to save it here for later."
      />
    </div>
  );
}
