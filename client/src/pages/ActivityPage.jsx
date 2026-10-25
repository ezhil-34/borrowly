import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { bookingsApi, itemsApi } from '../api';
import BookingCard from '../components/bookings/BookingCard';
import Button from '../components/common/Button';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import { formatCurrency } from '../utils/formatters';

const TAB_TITLES = {
  borrowing: "I'm Borrowing",
  lending: "I'm Lending",
  pending: 'Pending Approval',
  pickups: 'Upcoming Pickups',
  returns: 'Active Returns',
  overdue: 'Overdue Items',
  done: 'Completed History',
  listings: 'My Listings'
};

export default function ActivityPage() {
  const { user, requireAuth, showToast, setModal, refreshUser } = useApp();
  const [activeTab, setActiveTab] = useState('borrowing');

  const activityData = useFetch(
    async () => {
      if (!user) return null;
      const [bookingsRes, itemsRes] = await Promise.all([
        bookingsApi.getBookings(),
        itemsApi.getMyItems()
      ]);
      return {
        bookings: bookingsRes.bookings || [],
        items: itemsRes.items || []
      };
    },
    [user?.id]
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8 shadow-sm">
        <span className="text-4xl mb-3">📦</span>
        <h2 className="text-xl font-bold text-[#232826]">Log In to View Your Activity</h2>
        <p className="mt-1 text-xs text-mute max-w-sm leading-relaxed">
          Track active borrows, approve incoming rental requests, and manage your listed gear.
        </p>
        <Button onClick={requireAuth} className="mt-5 px-6">
          Log In
        </Button>
      </div>
    );
  }

  if (activityData.loading && !activityData.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={2} />
      </div>
    );
  }

  if (activityData.error) {
    return (
      <div className="py-8">
        <ErrorBox error={activityData.error} retry={activityData.reload} />
      </div>
    );
  }

  const { bookings = [], items = [] } = activityData.data || {};
  const userId = String(user.id);

  // Accurate filtering using explicit ownerId and borrowerId comparisons
  const getTabPredicate = (tabKey) => {
    switch (tabKey) {
      case 'borrowing':
        return (b) => String(b.borrowerId) === userId;
      case 'lending':
        return (b) => String(b.ownerId) === userId;
      case 'pending':
        return (b) => b.status === 'requested' && String(b.ownerId) === userId;
      case 'pickups':
        return (b) => ['approved', 'ready_for_pickup'].includes(b.status);
      case 'returns':
        return (b) => b.status === 'borrowed';
      case 'overdue':
        return (b) => b.displayStatus === 'overdue';
      case 'done':
        return (b) => ['completed', 'returned', 'cancelled'].includes(b.status);
      default:
        return () => false;
    }
  };

  const handleBookingAction = async (booking, action) => {
    try {
      let body = {};
      if (action === 'dispute') {
        const note = window.prompt('Please describe the problem or dispute reason:');
        if (!note) return;
        body = { note };
      } else if (action === 'decline' || action === 'reject') {
        if (!window.confirm(`Decline borrow request for "${booking.item?.title}"?`)) return;
      } else if (action === 'cancel') {
        if (!window.confirm(`Cancel your borrow request for "${booking.item?.title}"?`)) return;
      }

      await bookingsApi.performAction(booking.id, action, body);

      const actionFeedback = {
        approve: 'Request accepted! You can now coordinate handover.',
        accept: 'Request accepted! You can now coordinate handover.',
        decline: 'Request declined.',
        reject: 'Request declined.',
        cancel: 'Borrow request cancelled.',
        ready: 'Marked ready for pickup.',
        handover: 'Handover confirmed! Rental is now active.',
        return: 'Return confirmed. Thank you!',
        complete: 'Rental completed and deposit released.'
      };

      showToast(actionFeedback[action] || `Booking ${action} completed successfully`);
      activityData.reload();
      refreshUser();
    } catch (err) {
      showToast(err.message || 'Action failed');
    }
  };

  const handleToggleItemStatus = async (item, newStatus) => {
    try {
      await itemsApi.updateItem(item.id, { status: newStatus });
      showToast(`Listing is now ${newStatus}`);
      activityData.reload();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await itemsApi.deleteItem(item.id);
      showToast('Listing removed successfully');
      activityData.reload();
    } catch (err) {
      showToast(err.message);
    }
  };

  const currentBookings = bookings.filter(getTabPredicate(activeTab));

  return (
    <div className="py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">Rental Activity</h1>
          <p className="text-xs text-mute mt-1">
            Manage your borrowed items, incoming owner requests, handovers, and active listings.
          </p>
        </div>

        <Link to="/list">
          <Button variant="lime" size="sm" className="font-bold shrink-0">
            + List Another Item
          </Button>
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="my-6 flex flex-wrap gap-2" role="tablist">
        {Object.entries(TAB_TITLES).map(([key, label]) => {
          const count =
            key === 'listings'
              ? items.length
              : bookings.filter(getTabPredicate(key)).length;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(key)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isActive
                  ? 'bg-forest text-white shadow-forest/20'
                  : 'bg-white text-mute border border-line hover:border-stone-400 hover:text-[#232826]'
              }`}
            >
              {label} <span className={`ml-1 text-[11px] ${isActive ? 'text-white/80' : 'text-stone-400'}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' ? (
        items.length > 0 ? (
          <div className="space-y-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-line bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={it.images[0] || 'https://via.placeholder.com/150'}
                    alt={it.title}
                    className="h-16 w-20 shrink-0 rounded-xl object-cover border border-line"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/item/${it.id}`}
                      className="text-sm font-bold text-[#232826] hover:text-forest transition-colors truncate block"
                    >
                      {it.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mute">
                      <span className="font-bold text-forest">
                        {formatCurrency(it.price)}/day
                      </span>
                      <span>·</span>
                      <span>{it.area}</span>
                      <span>·</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold uppercase text-[10px] ${
                          it.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {it.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleToggleItemStatus(it, it.status === 'active' ? 'paused' : 'active')
                    }
                  >
                    {it.status === 'active' ? '⏸️ Pause' : '▶️ Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteItem(it)}
                  >
                    🗑️ Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-12 text-center">
            <span className="text-3xl mb-2">🏷️</span>
            <h3 className="text-base font-bold text-[#232826]">You have no active listings</h3>
            <p className="mt-1 text-xs text-mute max-w-xs">
              List tools, camping gear, or cameras sitting idle in your home.
            </p>
            <Link to="/list" className="mt-4">
              <Button size="sm">Create First Listing</Button>
            </Link>
          </div>
        )
      ) : currentBookings.length > 0 ? (
        <div className="space-y-4">
          {currentBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              currentUserId={user.id}
              onAction={handleBookingAction}
              onReview={(bk) =>
                setModal({
                  type: 'review',
                  id: bk.id,
                  role: bk.role,
                  onDone: activityData.reload
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-12 text-center">
          <span className="text-3xl mb-2">📋</span>
          <h3 className="text-base font-bold text-[#232826]">No records in this category</h3>
          <p className="mt-1 text-xs text-mute">
            Explore items across Chennai or switch to other activity tabs.
          </p>
        </div>
      )}
    </div>
  );
}
