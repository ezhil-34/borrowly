import React from 'react';
import ItemCard from './ItemCard';

export default function ItemGrid({
  items = [],
  emptyTitle = 'No items found',
  emptyMessage = 'Try expanding your filters or search terms to find more available items.'
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-12 text-center my-6">
        <span className="text-4xl mb-3">🔍</span>
        <h3 className="text-lg font-bold text-[#232826]">{emptyTitle}</h3>
        <p className="mt-1 max-w-md text-sm text-mute">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
