/**
 * Formatting and Helper Utilities
 */

/**
 * Format number into Indian Rupee (INR) currency format (e.g. ₹1,250)
 */
export function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

/**
 * Format ISO date string into readable medium date & short time
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

/**
 * Format ISO date string to medium date only
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', {
    dateStyle: 'medium'
  });
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Add days to today's date and return YYYY-MM-DD
 */
export function addDays(daysCount) {
  return new Date(Date.now() + daysCount * 864e5).toISOString().slice(0, 10);
}

/**
 * Format numeric star rating (e.g. "★ 4.8" or "New")
 */
export function formatRating(rating, count = 0) {
  if (!rating || Number(rating) === 0) return 'New';
  const score = Number(rating).toFixed(1);
  return count ? `★ ${score} (${count})` : `★ ${score}`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null) return null;
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format relative duration from milliseconds
 */
export function formatDuration(ms) {
  const absMs = Math.abs(ms);
  const days = Math.floor(absMs / 864e5);
  const hours = Math.floor((absMs % 864e5) / 36e5);
  const minutes = Math.floor((absMs % 36e5) / 6e4);
  const seconds = Math.floor((absMs % 6e4) / 1e3);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}
