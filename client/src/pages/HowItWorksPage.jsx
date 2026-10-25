import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function HowItWorksPage() {
  const STEPS = [
    {
      num: '01',
      title: 'Find What You Need',
      desc: 'Search by category, date availability, or radius. Items booked on your chosen dates are automatically filtered out to avoid disappointment.'
    },
    {
      num: '02',
      title: 'Transparent Pricing & Request',
      desc: 'Pick your dates. See full costs upfront: daily rate, 5% platform service fee, and the refundable security deposit. Submit your borrow request.'
    },
    {
      num: '03',
      title: 'Handover & Safe Return',
      desc: 'Coordinate with the owner via built-in private chat. Inspect the gear together, confirm handover in the app, and return on schedule. Both leave transparent reviews!'
    }
  ];

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="border-b border-line pb-4 mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">How Borrowly Works</h1>
        <p className="text-xs text-mute mt-1">
          Peer-to-peer sharing designed for neighbourhood trust and safety.
        </p>
      </div>

      <div className="space-y-6">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="flex flex-col sm:flex-row gap-5 rounded-3xl border border-line bg-white p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime font-black text-lg">
              {step.num}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#232826]">{step.title}</h3>
              <p className="mt-1 text-xs text-mute leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-forest p-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold">Ready to get started?</h2>
          <p className="text-xs text-stone-300 mt-1">
            Browse gear near you or earn money from things you already own.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/search">
            <Button variant="lime">Browse Catalog</Button>
          </Link>
          <Link to="/list">
            <Button variant="ghost" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              List an Item
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
