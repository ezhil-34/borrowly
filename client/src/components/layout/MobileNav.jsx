import React from 'react';
import { NavLink } from 'react-router-dom';

const MOBILE_LINKS = [
  { to: '/', label: 'Explore', icon: '🔍' },
  { to: '/saved', label: 'Saved', icon: '♥' },
  { to: '/activity', label: 'Activity', icon: '📦' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/profile', label: 'Profile', icon: '👤' }
];

export default function MobileNav() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 backdrop-blur-md sm:hidden"
    >
      {MOBILE_LINKS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-2.5 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-forest font-bold' : 'text-mute hover:text-forest'
            }`
          }
        >
          <span className="text-base leading-none mb-1">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
