import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white py-12 text-[#232826]">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-lime font-black text-sm">
                B
              </span>
              <span className="text-xl font-bold tracking-tight text-forest">Borrowly</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-mute leading-relaxed">
              Borrowly connects trusted neighbours to share everyday tools, electronics, camping
              gear, and books. Save money, reduce clutter, and make your neighbourhood more sustainable.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-mute">
              <span className="rounded-md bg-stone-100 px-2 py-1 font-medium">Peer-to-Peer</span>
              <span className="rounded-md bg-stone-100 px-2 py-1 font-medium">Refundable Deposits</span>
              <span className="rounded-md bg-stone-100 px-2 py-1 font-medium">Microservices Architecture</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#232826]">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              <li>
                <Link to="/search" className="hover:text-forest transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/list" className="hover:text-forest transition-colors">
                  List Your Item
                </Link>
              </li>
              <li>
                <Link to="/how" className="hover:text-forest transition-colors">
                  How Borrowly Works
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-forest transition-colors">
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#232826]">Safety & Trust</h4>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              <li>
                <Link to="/help" className="hover:text-forest transition-colors">
                  Trust, Safety & Disputes
                </Link>
              </li>
              <li>
                <Link to="/activity" className="hover:text-forest transition-colors">
                  Rental Status Tracker
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-forest transition-colors">
                  Direct Messages
                </Link>
              </li>
              <li>
                <span className="text-xs text-stone-400">Payments simulated in sandbox mode</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-mute gap-4">
          <p>© {new Date().getFullYear()} Borrowly Marketplace. Good things are better shared.</p>
          <div className="flex gap-4">
            <Link to="/help" className="hover:underline">
              Help Center
            </Link>
            <Link to="/how" className="hover:underline">
              Rental Policies
            </Link>
            <span>Chennai, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
