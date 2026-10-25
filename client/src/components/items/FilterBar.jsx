import React from 'react';
import { CATEGORIES, SORT_OPTIONS } from '../../utils/constants';
import { getTodayString, addDays } from '../../utils/formatters';

export default function FilterBar({ filters, onChange }) {
  const handlePresetChange = (e) => {
    const val = e.target.value;
    if (val === 'today') {
      const today = getTodayString();
      onChange({ start: today, end: today });
    } else if (val === 'weekend') {
      const currentDay = new Date().getDay();
      const daysUntilSaturday = (6 - currentDay + 7) % 7;
      onChange({ start: addDays(daysUntilSaturday), end: addDays(daysUntilSaturday + 1) });
    } else {
      onChange({ start: '', end: '' });
    }
  };

  const activeDatePreset =
    filters.start && filters.start === filters.end && filters.start === getTodayString()
      ? 'today'
      : filters.start
      ? 'custom'
      : '';

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {/* Category Dropdown */}
      <select
        aria-label="Category filter"
        value={filters.category || ''}
        onChange={(e) => onChange({ category: e.target.value })}
        className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map(([name]) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {/* Date Availability Dropdown */}
      <select
        aria-label="Dates preset filter"
        value={activeDatePreset}
        onChange={handlePresetChange}
        className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
      >
        <option value="">Any Time</option>
        <option value="today">Available Today</option>
        <option value="weekend">This Weekend</option>
        {activeDatePreset === 'custom' && <option value="custom">Custom Dates</option>}
      </select>

      {/* Radius Distance Filter */}
      <select
        aria-label="Distance radius filter"
        value={filters.radius || ''}
        onChange={(e) => onChange({ radius: e.target.value })}
        className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
      >
        <option value="">Any Distance</option>
        <option value="1">Within 1 km</option>
        <option value="5">Within 5 km</option>
        <option value="10">Within 10 km</option>
        <option value="25">Within 25 km</option>
      </select>

      {/* Max Daily Price */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-xs text-mute font-bold">₹</span>
        <input
          type="number"
          min="0"
          placeholder="Max price"
          value={filters.maxPrice || ''}
          onChange={(e) => onChange({ maxPrice: e.target.value })}
          className="w-28 rounded-xl border border-line bg-white pl-7 pr-3 py-2 text-xs font-semibold text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
        />
      </div>

      {/* Custom Dates Inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          aria-label="Start date"
          value={filters.start || ''}
          onChange={(e) => onChange({ start: e.target.value, end: filters.end || e.target.value })}
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
        />
        <span className="text-xs text-mute">to</span>
        <input
          type="date"
          aria-label="Return date"
          min={filters.start || ''}
          value={filters.end || ''}
          onChange={(e) => onChange({ end: e.target.value })}
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
        />
      </div>

      {/* Sort Strategy */}
      <div className="ml-auto">
        <select
          aria-label="Sort by"
          value={filters.sort || 'relevance'}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="rounded-xl border border-line bg-stone-50 px-3 py-2 text-xs font-bold text-forest focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
