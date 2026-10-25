import React from 'react';

export function ItemSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-3 animate-pulse"
        >
          <div className="aspect-[4/3] w-full rounded-xl bg-stone-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
          <div className="mt-2 h-5 w-1/2 rounded bg-stone-200" />
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-2">
            <div className="h-6 w-6 rounded-full bg-stone-200" />
            <div className="h-3 w-1/3 rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ItemSkeleton;
