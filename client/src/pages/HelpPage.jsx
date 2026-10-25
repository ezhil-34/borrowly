import React from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';

export default function HelpPage() {
  const { requireAuth, setModal } = useApp();

  const handleOpenReport = () => {
    if (requireAuth()) {
      setModal({ type: 'report', target: '' });
    }
  };

  const FAQS = [
    {
      title: 'How do deposits and payments work?',
      text: 'Deposits are set by the owner to protect high-value equipment. In this version, all payment calculations and refunds are simulated transparently with full platform fee and late fee disclosures.'
    },
    {
      title: 'What if an item is returned damaged or late?',
      text: 'Late fees are automatically assessed at 1.5× the daily rental rate for each overdue day. In the event of damage or disputes, either party can use the "Report a Problem" feature directly from their booking activity.'
    },
    {
      title: 'How do I ensure a safe meeting with the owner?',
      text: 'Always meet during daylight in a public, well-lit place such as an apartment clubhouse, lobby, or cafe. Inspect the equipment together, test operation, and photograph it prior to confirming handover.'
    },
    {
      title: 'Can I cancel a booking?',
      text: 'Borrowers can cancel free of charge up to 24 hours before the reservation date. Once confirmed and handed over, active borrows cannot be cancelled.'
    }
  ];

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="border-b border-line pb-4 mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">
          Trust, Safety & Help Center
        </h1>
        <p className="text-xs text-mute mt-1">
          Everything you need to know about safe lending, borrower protections, and problem resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <span className="text-2xl">📸</span>
          <h3 className="text-sm font-bold text-[#232826] mt-2">1. Photo Verification</h3>
          <p className="mt-1 text-xs text-mute leading-relaxed">
            Take photos at both pickup and return. This establishes an indisputable condition record.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <span className="text-2xl">💬</span>
          <h3 className="text-sm font-bold text-[#232826] mt-2">2. In-App Communication</h3>
          <p className="mt-1 text-xs text-mute leading-relaxed">
            Keep all discussions within Borrowly chat. Never share bank passwords, UPI pins, or OTPs.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#232826] mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <div key={idx} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#232826]">{faq.title}</h3>
            <p className="mt-2 text-xs text-mute leading-relaxed">{faq.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900">Need to report an issue or dispute?</h3>
          <p className="text-xs text-rose-700 mt-0.5">
            Our safety moderation team investigates inappropriate behaviour and listing discrepancies.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleOpenReport}>
          File Safety Report
        </Button>
      </div>
    </div>
  );
}
