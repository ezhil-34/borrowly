import { useState, useEffect } from 'react';
import { formatDuration } from '../../utils/formatters';

export default function Countdown({ due }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!due) return null;

  const msRemaining = Date.parse(due) - Date.now();
  const isOverdue = msRemaining < 0;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md ${isOverdue
        ? 'bg-rose-100 text-rose-700 animate-pulse'
        : 'bg-emerald-100 text-emerald-800'
        }`}
    >
      <span></span>
      {isOverdue ? `Overdue by ${formatDuration(msRemaining)}` : `Due in ${formatDuration(msRemaining)}`}
    </span>
  );
}
