import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';

export default function Navbar() {
  const { user, unread, setModal, location, setLocation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors duration-150 py-1 ${
      isActive ? 'text-forest border-b-2 border-forest' : 'text-mute hover:text-forest'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center gap-4 px-4 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 mr-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-lime font-black text-xl shadow-sm">
            B
          </span>
          <span className="text-2xl font-black tracking-tight text-forest">Borrowly</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main" className="hidden lg:flex items-center gap-6 ml-2">
          <NavLink to="/search" className={navLinkClass}>
            Borrow
          </NavLink>
          <NavLink to="/search?category=" className={navLinkClass}>
            Categories
          </NavLink>
          <NavLink to="/how" className={navLinkClass}>
            How it works
          </NavLink>
          <NavLink to="/activity" className={navLinkClass}>
            My Activity
          </NavLink>
          <NavLink to="/messages" className={navLinkClass}>
            Messages
          </NavLink>
        </nav>

        {/* Search Bar */}
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className="ml-auto hidden md:flex items-center relative w-60 lg:w-72"
        >
          <input
            type="text"
            placeholder="Search cameras, tools, tents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-line bg-stone-50 pl-9 pr-4 py-2 text-xs text-[#232826] transition-all focus:bg-white focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
          />
          <span className="absolute left-3 top-2.5 text-mute text-xs">🔍</span>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/list" className="hidden sm:inline-flex">
            <Button variant="lime" size="sm" className="font-bold">
              + List an item
            </Button>
          </Link>

          {/* Notifications Icon with Badge */}
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line text-mute hover:text-forest hover:bg-stone-50 transition-colors"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unread}
              </span>
            )}
          </Link>

          {/* Account Profile Trigger */}
          <button
            onClick={() => setModal({ type: user ? 'account' : 'auth' })}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-[#232826] hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm"
          >
            {user ? (
              <>
                <img
                  src={user.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover border border-stone-200"
                />
                <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
