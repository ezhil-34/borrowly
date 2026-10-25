import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { bookingsApi, messagingApi } from '../api';
import Button from '../components/common/Button';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';
import { BOOKING_STATUS_CONFIG } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

export default function MessagesPage() {
  const { user, requireAuth, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const bookingsFetch = useFetch(
    async () => (user ? (await bookingsApi.getBookings()).bookings : []),
    [user?.id]
  );

  const bookingsList = bookingsFetch.data || [];
  const selectedBookingId = searchParams.get('b') || bookingsList[0]?.id;

  const chatFetch = useFetch(
    async () => (selectedBookingId ? (await messagingApi.getChat(selectedBookingId)).messages : []),
    [selectedBookingId]
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatFetch.data]);

  // Periodic poll for new messages
  useEffect(() => {
    if (!selectedBookingId) return;
    const interval = setInterval(chatFetch.reload, 6000);
    return () => clearInterval(interval);
  }, [selectedBookingId, chatFetch.reload]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8">
        <span className="text-4xl mb-3">💬</span>
        <h2 className="text-xl font-bold text-[#232826]">Log In to View Messages</h2>
        <p className="mt-1 text-xs text-mute max-w-sm">
          Keep communications private, coordinate handovers, and discuss rental logistics with neighbours.
        </p>
        <Button onClick={requireAuth} className="mt-4">
          Log In
        </Button>
      </div>
    );
  }

  if (bookingsFetch.loading && !bookingsFetch.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={2} />
      </div>
    );
  }

  if (bookingsFetch.error) {
    return (
      <div className="py-8">
        <ErrorBox error={bookingsFetch.error} retry={bookingsFetch.reload} />
      </div>
    );
  }

  if (bookingsList.length === 0) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-black text-[#232826]">Private Messages</h1>
        <div className="mx-auto mt-6 max-w-md rounded-3xl border border-dashed border-line bg-white p-10">
          <span className="text-3xl mb-2 inline-block">📭</span>
          <h3 className="text-base font-bold text-[#232826]">No active conversations</h3>
          <p className="mt-1 text-xs text-mute">
            Private chats start automatically when you request or receive a booking on Borrowly.
          </p>
          <Link to="/search" className="mt-4 inline-block">
            <Button size="sm">Browse Items to Borrow</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      await messagingApi.sendMessage(selectedBookingId, inputText.trim());
      setInputText('');
      chatFetch.reload();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSending(false);
    }
  };

  const activeBooking = bookingsList.find((b) => b.id === selectedBookingId);

  return (
    <div className="py-6">
      <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight mb-4">Messages</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
        {/* Left Side: Booking Conversations List */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
          {bookingsList.map((b) => {
            const isSelected = b.id === selectedBookingId;
            const statusConfig = BOOKING_STATUS_CONFIG[b.displayStatus] || {};

            return (
              <Link
                key={b.id}
                to={`/messages?b=${b.id}`}
                className={`flex min-w-[240px] md:min-w-0 items-center gap-3 rounded-2xl border p-3 transition-all ${
                  isSelected
                    ? 'border-forest bg-forest/5 shadow-sm'
                    : 'border-line bg-white hover:border-stone-400'
                }`}
              >
                <img
                  src={b.item?.image || 'https://via.placeholder.com/80'}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover border border-line shrink-0"
                />
                <div className="flex-1 truncate">
                  <h4 className="text-xs font-bold text-[#232826] truncate">{b.item?.title}</h4>
                  <p className="text-[11px] text-mute truncate">
                    {b.other?.name} · {statusConfig.label || b.displayStatus}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Side: Message Chat Area */}
        <div className="flex flex-col rounded-3xl border border-line bg-white shadow-sm overflow-hidden min-h-[460px]">
          {/* Chat Header */}
          {activeBooking && (
            <div className="flex items-center justify-between border-b border-line bg-stone-50/70 p-4">
              <div>
                <Link
                  to={`/item/${activeBooking.item.id}`}
                  className="text-sm font-bold text-[#232826] hover:text-forest transition-colors"
                >
                  {activeBooking.item.title}
                </Link>
                <p className="text-xs text-mute">
                  Talking with <b>{activeBooking.other?.name}</b> · {activeBooking.start} to {activeBooking.end}
                </p>
              </div>
              <Link to="/activity">
                <Button variant="ghost" size="sm">
                  View Booking
                </Button>
              </Link>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] bg-stone-50/20">
            {chatFetch.data?.length > 0 ? (
              chatFetch.data.map((msg) => {
                const isMe = msg.from === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[78%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-forest text-white rounded-br-none'
                          : 'bg-white text-[#232826] border border-line rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="mt-1 text-[10px] text-mute px-1">
                      {msg.name} · {formatDateTime(msg.at)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-mute text-xs">
                <span>👋 Say hello! Coordinate pickup times and check item details.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input Box */}
          <form onSubmit={handleSendMessage} className="border-t border-line p-3 flex gap-2 bg-white">
            <input
              type="text"
              required
              placeholder="Type your message (e.g. pickup time, meeting spot)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-line bg-stone-50 px-4 py-2.5 text-xs text-[#232826] focus:bg-white focus:border-forest focus:outline-none"
            />
            <Button type="submit" loading={sending} size="sm">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
