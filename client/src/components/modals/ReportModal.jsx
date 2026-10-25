import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';
import { messagingApi } from '../../api';

export default function ReportModal({ target, type = 'listing', onClose }) {
  const { showToast } = useApp();
  const [reportType, setReportType] = useState(type);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide details for the safety team');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await messagingApi.submitReport({
        type: reportType,
        target,
        reason: reason.trim()
      });
      showToast('Thank you. Your report has been submitted for review.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Submit a Safety Report" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="rep-type" className="text-xs font-semibold uppercase tracking-wider text-mute">
            Issue Category
          </label>
          <select
            id="rep-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="listing">Problem with Listing</option>
            <option value="user">User Conduct / Harassment</option>
            <option value="dispute">Damage or Rental Dispute</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="rep-reason" className="text-xs font-semibold uppercase tracking-wider text-mute">
            What happened?
          </label>
          <textarea
            id="rep-reason"
            rows={4}
            required
            placeholder="Describe what occurred, any damaged items, or safety concerns..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border border-line bg-white p-3 text-sm text-[#232826] focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <Button type="submit" variant="danger" loading={loading} className="w-full">
          Submit Report
        </Button>
      </form>
    </Modal>
  );
}
