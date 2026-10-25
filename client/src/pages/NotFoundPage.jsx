import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-6xl mb-4 font-black text-forest">404</span>
      <h1 className="text-2xl font-black text-[#232826]">Page Not Found</h1>
      <p className="mt-2 text-xs text-mute max-w-sm">
        The page you are looking for doesn't exist or has been moved to another location.
      </p>
      <Link to="/" className="mt-6">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}
