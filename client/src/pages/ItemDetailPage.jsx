import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { itemsApi, bookingsApi } from '../api';
import Button from '../components/common/Button';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import { formatCurrency, formatRating, getTodayString } from '../utils/formatters';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, location, requireAuth, showToast, setModal } = useApp();

  const fetchItem = useFetch(
    () => itemsApi.getItemDetails(id, { lat: location.lat, lng: location.lng }),
    [id, location.lat, location.lng]
  );

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quote, setQuote] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bookedSlots = fetchItem.data?.booked || [];
  const itemData = fetchItem.data?.item;
  const isOwner = user && itemData && (
    String(user.id) === String(itemData.ownerId) ||
    String(user.id) === String(itemData.owner?.id)
  );

  // Quote calculation side-effect
  useEffect(() => {
    setQuote(null);
    setErrorMsg('');

    if (isOwner) return;
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
      setErrorMsg('Return date must be on or after the start date');
      return;
    }

    const hasConflict = bookedSlots.some(
      (slot) => slot.start <= endDate && startDate <= slot.end
    );

    if (hasConflict) {
      setErrorMsg('These dates conflict with an existing reservation');
      return;
    }

    bookingsApi
      .getQuote({ itemId: id, start: startDate, end: endDate })
      .then(setQuote)
      .catch((err) => setErrorMsg(err.message));
  }, [id, startDate, endDate, fetchItem.data, isOwner]);

  if (fetchItem.loading && !fetchItem.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={2} />
      </div>
    );
  }

  if (fetchItem.error) {
    return (
      <div className="py-8">
        <ErrorBox error={fetchItem.error} retry={fetchItem.reload} message="Listing not found" />
      </div>
    );
  }

  const { item, reviews, reviewStats, summary } = fetchItem.data;

  const handleRequestBooking = async () => {
    if (!requireAuth()) return;
    if (isOwner) {
      setErrorMsg('You are the owner of this item and cannot borrow it.');
      return;
    }
    if (!quote) {
      setErrorMsg('Please select valid rental dates first');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await bookingsApi.createBooking({
        itemId: id,
        start: startDate,
        end: endDate
      });
      showToast('Booking request submitted! The owner will review it.');
      navigate('/activity');
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Left Column: Photos, Details, Reviews */}
        <div>
          {/* Main Photo Gallery */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 border border-line shadow-sm">
            <img
              src={item.images[activePhotoIndex]}
              alt={`${item.title} photo ${activePhotoIndex + 1}`}
              className="h-full w-full object-cover transition-all duration-300"
            />
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md ${
                item.available ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
              }`}
            >
              {item.available ? 'Available Now' : 'Currently Unavailable'}
            </span>
          </div>

          {/* Thumbnail Strip */}
          {item.images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2">
              {item.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    idx === activePhotoIndex
                      ? 'border-forest ring-2 ring-forest/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Item Information */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-mute">
              <span className="uppercase tracking-wider text-forest">{item.category}</span>
              <span>·</span>
              <span>Condition: <b>{item.condition}</b></span>
              {item.demo && (
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase font-bold text-stone-500">
                  Demo listing
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#232826]">{item.title}</h1>
            <p className="mt-3 text-sm text-[#232826] leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            {/* Included Accessories */}
            {item.accessories?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
                  What's Included
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.accessories.map((acc) => (
                    <span
                      key={acc}
                      className="rounded-xl border border-line bg-stone-50 px-3 py-1.5 text-xs font-medium text-[#232826]"
                    >
                      ✓ {acc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-stone-50/50 p-4 text-xs">
              <div>
                <span className="text-mute font-medium">Brand / Manufacturer</span>
                <p className="mt-0.5 font-bold text-[#232826]">{item.brand || 'Unbranded'}</p>
              </div>
              <div>
                <span className="text-mute font-medium">Pickup Area</span>
                <p className="mt-0.5 font-bold text-[#232826]">
                  {item.area} {item.delivery ? '(Delivery available)' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Owner Profile Panel */}
          <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4">
              Listed by Neighbour
            </h3>
            <div className="flex items-center gap-4">
              <img
                src={item.owner.avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover border border-stone-200"
              />
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#232826]">{item.owner.name}</h4>
                <p className="text-xs text-mute">
                  {item.owner.area} · Member since {item.owner.since}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-forest">
                  {formatRating(item.owner.rating, item.owner.count)}
                </span>
                <span className="block text-[11px] text-stone-400">Community verified</span>
              </div>
            </div>
          </div>

          {/* Policies & Safety Tips */}
          <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#232826] mb-3">Rental Rules & Safety</h3>
            <ul className="space-y-2 text-xs text-mute list-disc pl-5">
              {(item.rules || []).map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
              <li>{item.cancellation}</li>
              <li>{item.lateFeeNote}</li>
              <li>Always inspect items together at pickup and take clear handover photos.</li>
              <li>Keep all communication inside Borrowly for verified protection.</li>
            </ul>
          </div>

          {/* Community Reviews Section */}
          <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-black text-[#232826]">Neighbour Reviews</h2>
                <p className="text-xs text-mute mt-0.5">
                  <b>{reviewStats.avg ?? 'New'}</b> {reviewStats.avg && '★'} · {reviewStats.count} review
                  {reviewStats.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Gemini LLM AI-Generated Review Summary */}
            {summary?.aiSummary && (
              <div className="my-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-forest/5 p-4 border border-emerald-200/80 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">✨</span>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Gemini AI Summary of Reviews
                  </span>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Google Gemini
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  "{summary.aiSummary}"
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-mute">
                  <span>Based on {summary.basedOn} verified borrower experiences</span>
                </div>
              </div>
            )}

            {/* Keyword Themes Summary */}
            {summary?.themes?.length > 0 && (
              <div className="my-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
                  Key Feedback Themes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.themes.map((t) => (
                    <span
                      key={t.label}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                        t.type === 'pos'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      }`}
                    >
                      {t.label} ({t.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Reviews */}
            <div className="mt-4 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between text-xs font-bold text-[#232826]">
                      <span>{rev.reviewerName}</span>
                      <span className="text-amber-500">{'★'.repeat(rev.rating)}</span>
                    </div>
                    <p className="mt-1 text-xs text-mute">{rev.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-mute py-4">No reviews yet for this listing.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Aside: Rental Booking Widget */}
        <aside className="sticky top-24 rounded-3xl border border-line bg-white p-6 shadow-lg">
          <div className="pb-4 border-b border-line">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#232826]">{formatCurrency(item.price)}</span>
              <span className="text-xs text-mute font-semibold">/ day</span>
            </div>
            {item.deposit > 0 && (
              <p className="mt-1 text-xs text-mute">
                + {formatCurrency(item.deposit)} refundable security deposit
              </p>
            )}
          </div>

          {isOwner ? (
            <div className="mt-4 rounded-2xl bg-amber-50/80 p-5 border border-amber-200 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-800 shadow-sm">
                👑
              </div>
              <h4 className="mt-3 text-base font-bold text-amber-950">You Own This Listing</h4>
              <p className="mt-1.5 text-xs text-amber-800 leading-relaxed">
                This item is listed from your account. As the owner, you cannot place a borrow request for your own item.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link to="/activity" className="w-full">
                  <Button variant="primary" size="sm" className="w-full font-bold justify-center">
                    📊 Manage in Activity
                  </Button>
                </Link>
                <Link to="/list" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    + List Another Item
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Date Pickers */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="res-start" className="block text-[11px] font-bold text-mute uppercase mb-1">
                    Pickup Date
                  </label>
                  <input
                    id="res-start"
                    type="date"
                    min={getTodayString()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-stone-50 px-3 py-2 text-xs text-[#232826] font-medium focus:bg-white focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="res-end" className="block text-[11px] font-bold text-mute uppercase mb-1">
                    Return Date
                  </label>
                  <input
                    id="res-end"
                    type="date"
                    min={startDate || getTodayString()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-stone-50 px-3 py-2 text-xs text-[#232826] font-medium focus:bg-white focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Existing reservations warning */}
              {bookedSlots.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
                  <b>Reserved dates:</b>{' '}
                  {bookedSlots.map((b) => `${b.start} to ${b.end}`).join(', ')}
                </div>
              )}

              {/* Price Quote Breakdown */}
              {quote && (
                <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
                  <div className="flex justify-between text-mute">
                    <span>
                      {formatCurrency(quote.price)} × {quote.days} day{quote.days > 1 ? 's' : ''}
                    </span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-mute">
                    <span>Platform Service Fee ({Math.round(quote.feeRate * 100)}%)</span>
                    <span>{formatCurrency(quote.fee)}</span>
                  </div>
                  <div className="flex justify-between text-mute">
                    <span>Refundable Security Deposit</span>
                    <span>{formatCurrency(quote.deposit)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-[#232826]">
                    <span>Total Payable</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {formatCurrency(quote.refundable)} deposit is refunded immediately upon safe return.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                  {errorMsg}
                </div>
              )}

              {/* Action button */}
              <Button
                onClick={handleRequestBooking}
                disabled={!item.available || submitting}
                loading={submitting}
                className="w-full mt-4 justify-center"
              >
                {item.available ? 'Request to Borrow' : 'Unavailable'}
              </Button>

              <p className="mt-3 text-center text-[11px] text-mute">
                No charge until owner approves. Payments simulated in MVP.
              </p>
            </>
          )}

          <div className="mt-4 border-t border-line pt-3 text-center">
            <button
              onClick={() => requireAuth() && setModal({ type: 'report', target: id })}
              className="text-xs text-mute hover:text-rose-600 transition-colors cursor-pointer"
            >
              🚩 Report an issue with this listing
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
