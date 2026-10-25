import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, itemsApi, messagingApi } from '../api';
import { getStoredToken, setStoredToken } from '../api/client';
import { DEFAULT_LOCATION } from '../utils/constants';

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [modal, setModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [location, setLocationState] = useState(() => {
    try {
      const stored = localStorage.getItem('borrowly_loc');
      return stored ? JSON.parse(stored) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const setLocation = useCallback((loc) => {
    setLocationState(loc);
    localStorage.setItem('borrowly_loc', JSON.stringify(loc));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSavedIds(new Set());
      setUnreadCount(0);
      return;
    }

    try {
      const [meRes, savedRes, notifRes] = await Promise.all([
        authApi.getMe(),
        itemsApi.getSavedIds(),
        messagingApi.getNotifications()
      ]);

      setUser(meRes.user);
      setSavedIds(new Set(savedRes.ids || []));
      setUnreadCount(notifRes.unread || 0);
    } catch (err) {
      console.warn('Session refresh failed:', err.message);
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (token) => {
      setStoredToken(token);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setSavedIds(new Set());
    setUnreadCount(0);
    showToast('You have been logged out');
  }, [showToast]);

  const requireAuth = useCallback(() => {
    if (user) return true;
    setModal({ type: 'auth' });
    return false;
  }, [user]);

  const toggleSave = useCallback(
    async (itemId) => {
      if (!user) {
        setModal({ type: 'auth' });
        return;
      }
      try {
        const res = await itemsApi.toggleSave(itemId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (res.saved) {
            next.add(itemId);
          } else {
            next.delete(itemId);
          }
          return next;
        });
        showToast(res.saved ? 'Item added to saved' : 'Removed from saved items');
      } catch (err) {
        showToast(err.message);
      }
    },
    [user, showToast]
  );

  const value = {
    user,
    saved: savedIds,
    unread: unreadCount,
    location,
    modal,
    toastMessage,
    setLocation,
    showToast,
    login,
    logout,
    requireAuth,
    refreshUser,
    toggleSave,
    setModal,
    closeModal: () => setModal(null)
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
