import React from 'react';
import { Link } from 'react-router-dom';
import Countdown from '../common/Countdown';
import Button from '../common/Button';
import { BOOKING_STATUS_CONFIG } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function BookingCard({ booking, currentUserId, onAction, onReview }) {
  const isLender = currentUserId
    ? String(booking.ownerId) === String(currentUserId)
    : booking.role === 'lender';
  const isBorrower = currentUserId
    ? String(booking.borrowerId) === String(currentUserId)
    : booking.role === 'borrower';

  const status = booking.status;
  const displayStatus = booking.displayStatus || status;
  const statusConfig = BOOKING_STATUS_CONFIG[displayStatus] || {
    label: displayStatus,
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  // Determine available lifecycle action buttons
  const actions = [];

  // ONLY THE LENDER (ITEM OWNER) CAN ACCEPT OR DECLINE A REQUEST
  if (isLender && status === 'requested') {
    actions.push({ key: 'approve', label: 'Accept Request', variant: 'primary', icon: '✓' });
    actions.push({ key: 'decline', label: 'Decline Request', variant: 'danger', icon: '✕' });
  }

  // Next steps for lender
  if (isLender && status === 'approved') {
    actions.push({ key: 'ready', label: 'Mark Ready for Pickup', variant: 'ghost', icon: '📦' });
    actions.push({ key: 'handover', label: 'Confirm Handover', variant: 'primary', icon: '🤝' });
  }
  if (isLender && status === 'ready_for_pickup') {
    actions.push({ key: 'handover', label: 'Confirm Handover', variant: 'primary', icon: '🤝' });
  }
  if (isLender && status === 'borrowed') {
    actions.push({ key: 'return', label: 'Confirm Return', variant: 'primary', icon: '🔄' });
  }
  if (isLender && status === 'returned') {
    actions.push({ key: 'complete', label: 'Release Deposit & Complete', variant: 'primary', icon: '💰' });
  }

  // BORROWER CAN ONLY CANCEL A REQUEST WHILE PENDING OR APPROVED
  if (isBorrower && ['requested', 'approved'].includes(status)) {
    actions.push({ key: 'cancel', label: 'Cancel Request', variant: 'ghost', icon: '✕' });
  }

  // Either party can dispute once handed over
  if (['borrowed', 'returned'].includes(status)) {
    actions.push({ key: 'dispute', label: 'Report a Problem', variant: 'ghost', icon: '⚠️' });
  }

  const hasReviewed = (booking.reviewedBy || []).includes(currentUserId);
  const canReview = ['returned', 'completed'].includes(status) && !hasReviewed;

  return (
    <div className="mb-4 rounded-3xl border border-line bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Item Thumbnail */}
        <Link to={`/item/${booking.item.id}`} className="shrink-0 group">
          <img
            src={booking.item.image || 'https://via.placeholder.com/150'}
            alt={booking.item.title}
            className="h-20 w-24 sm:h-24 sm:w-28 rounded-2xl object-cover border border-line group-hover:scale-102 transition-transform duration-200"
          />
        </Link>

        {/* Content details */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Title & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to={`/item/${booking.item.id}`}
              className="text-base font-bold text-[#232826] hover:text-forest transition-colors truncate"
            >
              {booking.item.title}
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {/* Role Badge */}
              {isLender ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  🏷️ You are Lending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                  🎒 You are Borrowing
                </span>
              )}

              {/* Status Badge */}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusConfig.badgeClass}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Key Metadata Row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
            <span className="font-medium text-[#232826]">
              📅 {booking.start} → {booking.end}
              {booking.quote?.days ? ` (${booking.quote.days}d)` : ''}
            </span>
            <span>·</span>
            <span>
              {isLender ? 'Requested by' : 'Item Owner'}:{' '}
              <b className="text-[#232826]">{booking.other?.name || 'User'}</b>
              {booking.other?.area ? ` (${booking.other.area})` : ''}
            </span>
            <span>·</span>
            <span className="font-semibold text-forest">
              Total {formatCurrency(booking.quote?.total)}
            </span>
            {booking.quote?.deposit > 0 && (
              <span className="text-[11px] text-stone-500">
                ({formatCurrency(booking.quote.deposit)} deposit)
              </span>
            )}
          </div>

          {/* Contextual Status Alert Banner */}
          {status === 'requested' && isLender && (
            <div className="mt-3 rounded-2xl bg-amber-50/90 p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">📬</span>
              <div>
                <p className="font-bold">New Borrow Request Pending Your Action</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  <b>{booking.other?.name || 'A borrower'}</b> wants to rent this item for {booking.quote?.days || 1} day(s). You can accept or decline below.
                </p>
              </div>
            </div>
          )}

          {status === 'requested' && isBorrower && (
            <div className="mt-3 rounded-2xl bg-blue-50/90 p-3 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">⏳</span>
              <div>
                <p className="font-bold">Awaiting Owner Approval</p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Your request has been sent to <b>{booking.other?.name || 'the owner'}</b>. You will be notified as soon as they accept.
                </p>
              </div>
            </div>
          )}

          {status === 'approved' && isBorrower && (
            <div className="mt-3 rounded-2xl bg-emerald-50/90 p-3 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">🎉</span>
              <div>
                <p className="font-bold">Request Accepted by Owner!</p>
                <p className="mt-0.5 text-emerald-800 leading-relaxed">
                  <b>{booking.other?.name || 'The owner'}</b> accepted your borrow request. Open chat below to coordinate handover.
                </p>
              </div>
            </div>
          )}

          {/* Active Borrow Countdown */}
          {status === 'borrowed' && (
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <Countdown due={booking.dueAt} />
              {booking.checkoutAt && (
                <span className="text-mute">· Checked out {formatDateTime(booking.checkoutAt)}</span>
              )}
            </div>
          )}

          {/* Returned & Late Fee notice */}
          {booking.returnedAt && (
            <div className="mt-2 text-xs text-mute">
              <span>Returned on {formatDateTime(booking.returnedAt)}</span>
              {booking.lateFee > 0 && (
                <span className="ml-2 font-semibold text-rose-600">
                  · Late fee: {formatCurrency(booking.lateFee)} ({booking.lateDays} overdue day
                  {booking.lateDays > 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}

          {/* Meeting Location */}
          {booking.meetingDetails && (
            <div className="mt-2.5 rounded-xl bg-stone-50 p-2.5 text-xs text-forest border border-line">
              <b>📍 Handover / Meeting Details:</b> {booking.meetingDetails}
            </div>
          )}

          {/* Booking History Audit Trail */}
          {booking.history?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-mute">
              <span className="font-semibold text-stone-500">History:</span>
              {booking.history.map((step, idx) => (
                <span key={idx} className="flex items-center">
                  {idx > 0 && <span className="mx-1 text-stone-300">→</span>}
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
                    {step.status}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Actions & Chat buttons bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-line">
            {actions.map((act) => (
              <Button
                key={act.key}
                variant={act.variant}
                size="sm"
                onClick={() => onAction(booking, act.key)}
                className="gap-1.5"
              >
                {act.icon && <span>{act.icon}</span>}
                <span>{act.label}</span>
              </Button>
            ))}

            {canReview && (
              <Button variant="lime" size="sm" onClick={() => onReview(booking)} className="gap-1.5">
                <span>⭐</span>
                <span>Leave a Review</span>
              </Button>
            )}

            <Link to={`/messages?b=${booking.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <span>💬</span>
                <span>Chat</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
