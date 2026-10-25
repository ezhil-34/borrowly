import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatRating, formatDistance } from '../../utils/formatters';

export default function ItemCard({ item }) {
  const { saved, toggleSave } = useApp();
  const isSaved = saved.has(item.id);
  const distanceStr = formatDistance(item.distanceKm);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-forest/20">
      {/* Image Container with Badges */}
      <Link to={`/item/${item.id}`} className="relative block aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          loading="lazy"
          src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Photo'}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.opacity = '0.5';
          }}
        />

        {/* Availability Badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-md ${
            item.available
              ? 'bg-emerald-600/90 text-white'
              : 'bg-rose-600/90 text-white'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {item.available ? 'Available' : 'Unavailable'}
        </span>
      </Link>

      {/* Save Button */}
      <button
        onClick={() => toggleSave(item.id)}
        aria-label={`Save ${item.title}`}
        aria-pressed={isSaved}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          isSaved ? 'text-rose-600' : 'text-stone-400 hover:text-rose-600'
        }`}
      >
        {isSaved ? '❤️' : '🤍'}
      </button>

      {/* Item Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category & Demo tag */}
        <div className="flex items-center justify-between text-xs text-mute font-medium">
          <span className="uppercase tracking-wider font-semibold text-forest/80">
            {item.category}
          </span>
          {item.demo && (
            <span className="rounded-md border border-line bg-stone-50 px-1.5 py-0.5 text-[10px] uppercase font-bold text-stone-500">
              Demo
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/item/${item.id}`} className="mt-1">
          <h3 className="line-clamp-1 text-base font-bold text-[#232826] group-hover:text-forest transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Price & Deposit */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-[#232826]">
            {formatCurrency(item.price)}
          </span>
          <span className="text-xs text-mute font-medium">/ day</span>
          {item.deposit > 0 && (
            <span className="ml-auto text-[11px] text-mute">
              {formatCurrency(item.deposit)} dep.
            </span>
          )}
        </div>

        {/* Location & Distance */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-mute">
          <span>📍</span>
          <span>
            {item.area}
            {distanceStr ? ` · ${distanceStr}` : ''}
          </span>
        </div>

        {/* Recommendation Reason Pill */}
        {item.reasons?.[0] && (
          <div className="mt-2 w-fit rounded-lg bg-lime/20 px-2.5 py-1 text-[11px] font-semibold text-[#1b2a10] border border-lime/40">
            ✨ {item.reasons[0]}
          </div>
        )}

        {/* Owner Details Footer */}
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-mute">
          <img
            src={item.owner?.avatar || 'https://i.pravatar.cc/96'}
            alt=""
            className="h-6 w-6 rounded-full object-cover border border-stone-200"
          />
          <span className="truncate font-medium text-[#232826]">{item.owner?.name}</span>
          <span className="ml-auto font-semibold text-forest whitespace-nowrap">
            {formatRating(item.owner?.rating, item.owner?.count)}
          </span>
        </div>

        {/* Quick View Link */}
        <Link
          to={`/item/${item.id}`}
          className="mt-3 w-full rounded-xl bg-stone-50 py-2 text-center text-xs font-bold text-[#232826] hover:bg-forest hover:text-white transition-colors duration-150"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
