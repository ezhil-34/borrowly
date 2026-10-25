import React from 'react';
import Button from './Button';

export default function ErrorBox({ error, retry, message = 'Failed to load content' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center text-[#232826]">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        ⚠️
      </div>
      <h3 className="text-base font-semibold text-rose-900">{message}</h3>
      <p className="mt-1 max-w-sm text-xs text-rose-700">
        {error?.message || 'An unexpected error occurred while fetching data.'}
      </p>
      {retry && (
        <Button variant="ghost" size="sm" onClick={retry} className="mt-4 border-rose-300">
          Try Again
        </Button>
      )}
    </div>
  );
}
