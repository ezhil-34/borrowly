import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';
import { formatRating } from '../../utils/formatters';

export default function AccountModal({ onClose }) {
  const { user, logout } = useApp();

  if (!user) return null;

  return (
    <Modal title="Your Account" onClose={onClose}>
      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <img
          src={user.avatar}
          alt=""
          className="h-14 w-14 rounded-2xl object-cover border border-stone-200"
        />
        <div>
          <h3 className="text-base font-bold text-[#232826]">{user.name}</h3>
          <p className="text-xs text-mute">{user.email}</p>
          <p className="text-xs text-forest font-medium mt-0.5">
            {user.area} · Member since {user.since}
          </p>
        </div>
      </div>

      <div className="my-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-mute py-1">
          <span>Community Rating:</span>
          <span className="font-bold text-forest">
            {formatRating(user.rating, user.reviewCount)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-mute py-1">
          <span>ID Verification:</span>
          <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-600 font-medium">
            Community Verified
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Link to="/profile" onClick={onClose} className="block w-full">
          <Button variant="ghost" className="w-full justify-center">
            Edit Profile
          </Button>
        </Link>

        <Button
          variant="danger"
          className="w-full justify-center"
          onClick={() => {
            logout();
            onClose();
          }}
        >
          Log Out
        </Button>
      </div>
    </Modal>
  );
}
