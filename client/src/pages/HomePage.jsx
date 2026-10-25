import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { itemsApi } from '../api';
import ItemGrid from '../components/items/ItemGrid';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import Button from '../components/common/Button';
import { CATEGORIES, AREAS } from '../utils/constants';
import { getTodayString } from '../utils/formatters';

function CatalogSection({ title, link, subtitle, fetchState, pickItems }) {
  return (
    <section className="my-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#232826]">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-mute max-w-2xl">{subtitle}</p>}
        </div>
        {link && (
          <Link
            to={link}
            className="text-xs font-bold text-forest hover:text-forest-dark hover:underline whitespace-nowrap"
          >
            Explore all →
          </Link>
        )}
      </div>

      {fetchState.loading && !fetchState.data ? (
        <ItemSkeleton count={4} />
      ) : fetchState.error ? (
        <ErrorBox error={fetchState.error} retry={fetchState.reload} />
      ) : (
        <ItemGrid items={pickItems(fetchState.data)} />
      )}
    </section>
  );
}

export default function HomePage() {
  const { location, setLocation, showToast } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    q: '',
    area: location.label in AREAS ? location.label : 'Adyar',
    start: '',
    end: '',
    maxPrice: ''
  });

  const geoContext = { lat: location.lat, lng: location.lng };

  const recState = useFetch(() => itemsApi.getRecommendations(geoContext), [location.lat]);
  const nearState = useFetch(
    () => itemsApi.discover({ ...geoContext, sort: 'distance' }),
    [location.lat]
  );
  const popState = useFetch(
    () => itemsApi.discover({ ...geoContext, sort: 'popular' }),
    [location.lat]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (AREAS[form.area]) {
      setLocation({
        lat: AREAS[form.area][0],
        lng: AREAS[form.area][1],
        label: form.area
      });
    }

    const params = new URLSearchParams();
    if (form.q) params.set('q', form.q);
    if (form.start) params.set('start', form.start);
    if (form.end) params.set('end', form.end);
    if (form.maxPrice) params.set('maxPrice', form.maxPrice);

    navigate(`/search?${params.toString()}`);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current Location'
        });
        showToast('Location updated from device GPS');
      },
      () => {
        showToast('Location access denied. Please select an area manually.');
      }
    );
  };

  return (
    <div className="pb-8">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-forest my-6 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime mb-3 border border-lime/30">
            🌱 Sustainable Peer-to-Peer Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Find what you need. <br />
            <span className="text-lime">Borrow it nearby.</span>
          </h1>
          <p className="mt-3 text-stone-200 text-sm sm:text-base leading-relaxed">
            Borrow cameras, tools, projectors, and camping gear from trusted neighbours in Chennai.
            Save money on things you only need for a few days.
          </p>
        </div>

        {/* Search Filter Box */}
        <div className="relative z-10 mt-8 rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur-md border border-white/20">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr_1fr_auto] items-end"
          >
            <div>
              <label htmlFor="hp-q" className="block text-[11px] font-bold text-stone-200 uppercase mb-1">
                What do you need?
              </label>
              <input
                id="hp-q"
                type="text"
                placeholder="e.g. DSLR camera, drill, tent"
                value={form.q}
                onChange={(e) => setForm({ ...form, q: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs text-[#232826] font-medium focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>

            <div>
              <label htmlFor="hp-area" className="block text-[11px] font-bold text-stone-200 uppercase mb-1">
                Neighbourhood
              </label>
              <select
                id="hp-area"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs text-[#232826] font-semibold focus:outline-none focus:ring-2 focus:ring-lime"
              >
                {Object.keys(AREAS).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hp-start" className="block text-[11px] font-bold text-stone-200 uppercase mb-1">
                Start Date
              </label>
              <input
                id="hp-start"
                type="date"
                min={getTodayString()}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs text-[#232826] focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>

            <div>
              <label htmlFor="hp-end" className="block text-[11px] font-bold text-stone-200 uppercase mb-1">
                Return Date
              </label>
              <input
                id="hp-end"
                type="date"
                min={form.start || getTodayString()}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs text-[#232826] focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>

            <div>
              <label htmlFor="hp-price" className="block text-[11px] font-bold text-stone-200 uppercase mb-1">
                Max ₹/day
              </label>
              <input
                id="hp-price"
                type="number"
                min="0"
                placeholder="Any"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs text-[#232826] focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>

            <button
              type="submit"
              className="h-[42px] px-6 rounded-xl bg-lime font-bold text-[#1b2a10] hover:bg-lime-dark transition-colors shadow-md text-xs cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between text-xs text-stone-300">
            <button
              type="button"
              onClick={handleUseLocation}
              className="hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              <span>🎯</span> Use my current GPS location
            </button>
            <span>Active area: <b>{location.label}</b></span>
          </div>
        </div>
      </section>

      {/* Category Icons Grid */}
      <section className="my-10">
        <h2 className="text-xl font-black text-[#232826] mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map(([name, keyword], idx) => (
            <Link
              key={name}
              to={`/search?category=${encodeURIComponent(name)}`}
              className="group relative flex aspect-square flex-col overflow-hidden rounded-2xl bg-stone-100 border border-line shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <img
                loading="lazy"
                src={`https://loremflickr.com/300/300/${keyword}?lock=${idx + 1}`}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6">
                <span className="block text-xs font-bold text-white text-center leading-tight">
                  {name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended Items */}
      <CatalogSection
        title="Recommended for You"
        subtitle={
          recState.data?.mode === 'hybrid'
            ? 'Personalized for you based on items you viewed, saved, and your proximity in Chennai.'
            : 'Top items curated for your neighborhood based on popularity and ratings.'
        }
        fetchState={recState}
        pickItems={(data) => (data?.full || data?.items || []).slice(0, 4)}
      />

      {/* Near You */}
      <CatalogSection
        title={`Available Near ${location.label}`}
        link="/search?sort=distance"
        subtitle="Convenient pickups right in your neighborhood so you can grab it and go."
        fetchState={nearState}
        pickItems={(data) => (data?.items || []).slice(0, 4)}
      />

      {/* Popular This Week */}
      <CatalogSection
        title="Popular in the Community"
        subtitle="Frequently borrowed items with stellar reviews from local borrowers."
        fetchState={popState}
        pickItems={(data) => (data?.items || []).slice(0, 4)}
      />

      {/* Value Proposition Box */}
      <section className="my-12 rounded-3xl border border-line bg-gradient-to-br from-stone-50 to-emerald-50/30 p-8 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-3xl">💰</span>
            <h3 className="text-base font-bold text-[#232826]">Save up to 90%</h3>
            <p className="text-xs text-mute leading-relaxed">
              Why pay ₹15,000 for a power washer or high-end tent you use once a year? Borrow it for ₹200/day.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-3xl">🤝</span>
            <h3 className="text-base font-bold text-[#232826]">Trusted Community</h3>
            <p className="text-xs text-mute leading-relaxed">
              Every borrow includes transparent reviews, item handover checklists, and clear dispute guidelines.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-3xl">🔒</span>
            <h3 className="text-base font-bold text-[#232826]">Refundable Security Deposits</h3>
            <p className="text-xs text-mute leading-relaxed">
              Lenders set refundable deposits that protect their gear and return directly to the borrower upon check-in.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
