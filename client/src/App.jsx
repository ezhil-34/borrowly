import { Routes, Route, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileNav from './components/layout/MobileNav';
import Toast from './components/common/Toast';

// Modal Components
import AuthModal from './components/modals/AuthModal';
import AccountModal from './components/modals/AccountModal';
import ReviewModal from './components/modals/ReviewModal';
import ReportModal from './components/modals/ReportModal';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ListItemPage from './pages/ListItemPage';
import ActivityPage from './pages/ActivityPage';
import MessagesPage from './pages/MessagesPage';
import SavedPage from './pages/SavedPage';
import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { user, modal, closeModal, toastMessage } = useApp();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-cream text-[#232826] font-sans antialiased selection:bg-lime selection:text-[#1b2a10]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Routing Container */}
      <main className="flex-1 mx-auto w-full max-w-page px-4 sm:px-6" key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/list" element={<ListItemPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/how" element={<HowItWorksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals */}
      {modal?.type === 'auth' && <AuthModal onClose={closeModal} />}
      {modal?.type === 'account' && user && <AccountModal onClose={closeModal} />}
      {modal?.type === 'review' && <ReviewModal {...modal} onClose={closeModal} />}
      {modal?.type === 'report' && <ReportModal target={modal.target} onClose={closeModal} />}

      {/* Global Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}
