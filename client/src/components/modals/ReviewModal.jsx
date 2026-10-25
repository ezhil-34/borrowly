import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';
import { bookingsApi } from '../../api';

export default function ReviewModal({ id, role, onDone, onClose }) {
  const { showToast } = useApp();
  const [formData, setFormData] = useState({
    rating: 5,
    condition: 5,
    accuracy: 5,
    communication: 5,
    pickup: 5,
    text: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const criteriaKeys =
    role === 'borrower'
      ? ['rating', 'condition', 'accuracy', 'communication', 'pickup']
      : ['rating'];

  const labels = {
    rating: 'Overall Experience',
    condition: 'Item Condition & Cleanliness',
    accuracy: 'Listing Accuracy',
    communication: 'Owner Communication',
    pickup: 'Smoothness of Pickup & Handover'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await bookingsApi.submitReview(id, formData);
      showToast('Thank you! Your review has been published.');
      onClose();
      if (onDone) onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Leave a Review" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {criteriaKeys.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={`rev-${key}`} className="text-xs font-semibold uppercase tracking-wider text-mute">
              {labels[key] || key}
            </label>
            <select
              id={`rev-${key}`}
              value={formData[key]}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            >
              {[5, 4, 3, 2, 1].map((stars) => (
                <option key={stars} value={stars}>
                  {'★'.repeat(stars)} {stars} Star{stars > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label htmlFor="rev-text" className="text-xs font-semibold uppercase tracking-wider text-mute">
            Written Feedback
          </label>
          <textarea
            id="rev-text"
            rows={3}
            placeholder="Share your experience to help neighbours in your community..."
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            className="rounded-xl border border-line bg-white p-3 text-sm text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Submit Review
        </Button>
      </form>
    </Modal>
  );
}
