import { request, buildQueryString } from './client';

export const authApi = {
  signup: (userData) => request('/auth/signup', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  resetPassword: (email) => request('/auth/reset', { method: 'POST', body: { email } }),
  confirmReset: (data) => request('/auth/reset/confirm', { method: 'POST', body: data }),
  getMe: () => request('/me', { method: 'GET' }),
  updateMe: (data) => request('/me', { method: 'PATCH', body: data })
};

export const itemsApi = {
  discover: (params = {}) => {
    const qs = buildQueryString(params);
    return request(`/items${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getRecommendations: (context = {}) =>
    request('/recommendations', { method: 'POST', body: context }),
  getItemDetails: (id, location = {}) => {
    const qs = buildQueryString(location);
    return request(`/items/${id}${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  createItem: (data) => request('/items', { method: 'POST', body: data }),
  updateItem: (id, updates) => request(`/items/${id}`, { method: 'PATCH', body: updates }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  getMyItems: () => request('/my/items', { method: 'GET' }),
  getSavedIds: () => request('/saved', { method: 'GET' }),
  toggleSave: (id) => request(`/saved/${id}`, { method: 'POST', body: {} })
};

export const bookingsApi = {
  getQuote: (quoteData) => request('/quote', { method: 'POST', body: quoteData }),
  createBooking: (bookingData) => request('/bookings', { method: 'POST', body: bookingData }),
  getBookings: () => request('/bookings', { method: 'GET' }),
  performAction: (id, action, body = {}) =>
    request(`/bookings/${id}/${action}`, { method: 'POST', body }),
  submitReview: (id, reviewData) =>
    request(`/bookings/${id}/review`, { method: 'POST', body: reviewData })
};

export const messagingApi = {
  getChat: (bookingId) => request(`/chat/${bookingId}`, { method: 'GET' }),
  sendMessage: (bookingId, text) =>
    request(`/chat/${bookingId}`, { method: 'POST', body: { text } }),
  getNotifications: () => request('/notifications', { method: 'GET' }),
  markNotificationsRead: () => request('/notifications/read', { method: 'POST', body: {} }),
  submitReport: (reportData) => request('/reports', { method: 'POST', body: reportData })
};
