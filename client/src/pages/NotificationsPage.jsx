import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { messagingApi } from '../api';
import Button from '../components/common/Button';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import { formatDateTime } from '../utils/formatters';

export default function NotificationsPage() {
  const { user, requireAuth, refreshUser } = useApp();

  const notifFetch = useFetch(
    async () => (user ? await messagingApi.getNotifications() : null),
    [user?.id]
  );

  // Auto-mark notifications as read when page opens
  useEffect(() => {
    if (notifFetch.data?.unread > 0) {
      messagingApi.markNotificationsRead().then(refreshUser);
    }
  }, [notifFetch.data, refreshUser]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8">
        <span className="text-4xl mb-3">🔔</span>
        <h2 className="text-xl font-bold text-[#232826]">Log In to See Notifications</h2>
        <p className="mt-1 text-xs text-mute max-w-sm">
          Stay updated on approval requests, messages, reminders, and handover updates.
        </p>
        <Button onClick={requireAuth} className="mt-4">
          Log In
        </Button>
      </div>
    );
  }

  if (notifFetch.loading && !notifFetch.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={2} />
      </div>
    );
  }

  if (notifFetch.error) {
    return (
      <div className="py-8">
        <ErrorBox error={notifFetch.error} retry={notifFetch.reload} />
      </div>
    );
  }

  const notifications = notifFetch.data?.notifications || [];

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="border-b border-line pb-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">Notifications</h1>
        <p className="text-xs text-mute mt-1">Updates on your borrow requests, returns, and messages.</p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={n.link ? n.link.replace('#', '') : '/activity'}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm ${
                n.read ? 'border-line bg-white' : 'border-forest/40 bg-forest/5 font-semibold'
              }`}
            >
              <span className="text-lg">
                {n.type === 'message'
                  ? '💬'
                  : n.type === 'request'
                  ? '📬'
                  : n.type === 'approve'
                  ? '✅'
                  : '🔔'}
              </span>
              <div className="flex-1">
                <p className="text-xs text-[#232826]">{n.text}</p>
                <span className="mt-1 block text-[10px] text-mute">{formatDateTime(n.at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-12 text-center">
          <span className="text-3xl mb-2">🎉</span>
          <h3 className="text-base font-bold text-[#232826]">You're all caught up!</h3>
          <p className="mt-1 text-xs text-mute">No new alerts at this time.</p>
        </div>
      )}
    </div>
  );
}
