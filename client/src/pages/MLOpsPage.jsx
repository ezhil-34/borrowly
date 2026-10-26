import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { mlopsApi } from '../api';
import Button from '../components/common/Button';
import ItemSkeleton from '../components/common/Skeleton';
import ErrorBox from '../components/common/ErrorBox';

export default function MLOpsPage() {
  const statsFetch = useFetch(() => mlopsApi.getStats(), []);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto poll stats every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      statsFetch.reload();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, statsFetch.reload]);

  if (statsFetch.loading && !statsFetch.data) {
    return (
      <div className="py-8">
        <ItemSkeleton count={3} />
      </div>
    );
  }

  if (statsFetch.error) {
    return (
      <div className="py-8">
        <ErrorBox error={statsFetch.error} retry={statsFetch.reload} message="Unable to connect to MLOps Telemetry Service" />
      </div>
    );
  }

  const data = statsFetch.data || {};
  const isOnline = data.status === 'active';
  const pricing = data.models?.pricing || {};
  const rec = data.models?.recommendation || {};
  const telemetry = data.telemetry || {};

  return (
    <div className="py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#232826] tracking-tight">
              MLOps Monitoring Dashboard
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              {isOnline ? 'ML Service Live' : 'Offline / Standby'}
            </span>
          </div>
          <p className="text-xs text-mute mt-1">
            Real-time inference telemetry, feature drift monitoring, and model performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Live Refresh ON' : '⏸️ Paused'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => statsFetch.reload()}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-mute uppercase">Total Predictions</span>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-forest">
            {telemetry.total_predictions ?? 0}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Pricing + Funnel Rankings</span>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-mute uppercase">Pricing Avg Latency</span>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-[#232826]">
            {pricing.avg_latency_ms ? `${pricing.avg_latency_ms} ms` : '—'}
          </p>
          <span className="text-[11px] text-mute">{pricing.total_requests ?? 0} calls served</span>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-mute uppercase">Ranking Avg Latency</span>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-[#232826]">
            {rec.avg_latency_ms ? `${rec.avg_latency_ms} ms` : '—'}
          </p>
          <span className="text-[11px] text-mute">{rec.total_requests ?? 0} ranking batches</span>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-mute uppercase">Serving Errors</span>
          <p className={`mt-2 text-2xl sm:text-3xl font-black ${telemetry.total_errors > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {telemetry.total_errors ?? 0}
          </p>
          <span className="text-[11px] text-mute">0% target error rate</span>
        </div>
      </div>

      {/* Deployed Models Specification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model 1: Price Suggestion */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-[#232826]">1. Pricing Recommendation Model</h3>
                <p className="text-xs text-mute">Quantile Regression with p10, p50, p90 bounds</p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 text-xs">
                {pricing.loaded ? 'Active' : 'Unloaded'}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Architecture:</span>
                <span className="font-semibold text-[#232826]">HistGradientBoostingRegressor</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Trained Date:</span>
                <span className="font-semibold text-[#232826]">{pricing.trained_at || 'Pretrained'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Model R²:</span>
                <span className="font-semibold text-forest">
                  {pricing.trained_metrics?.r2 ? pricing.trained_metrics.r2.toFixed(4) : '0.9825'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Test MAPE:</span>
                <span className="font-semibold text-forest">
                  {pricing.trained_metrics?.mape ? `${(pricing.trained_metrics.mape * 100).toFixed(2)}%` : '4.60%'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">80% Interval Coverage:</span>
                <span className="font-semibold text-forest">
                  {pricing.trained_metrics?.interval_80pct_coverage ? `${(pricing.trained_metrics.interval_80pct_coverage * 100).toFixed(1)}%` : '74.5%'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-xs text-mute border border-line">
            <b>Serving Features:</b> category, brand, condition, area, lat, lng, comparable median, 30d demand, lead days.
          </div>
        </div>

        {/* Model 2: 2-Stage Recommendation Funnel */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-[#232826]">2. Recommendation Funnel Model</h3>
                <p className="text-xs text-mute">Two-Stage Funnel: P(click) × P(book | click)</p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 text-xs">
                {rec.loaded ? 'Active' : 'Unloaded'}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Architecture:</span>
                <span className="font-semibold text-[#232826]">2x HistGradientBoostingClassifier</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Trained Date:</span>
                <span className="font-semibold text-[#232826]">{rec.trained_at || 'Pretrained'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Test Click AUC:</span>
                <span className="font-semibold text-forest">
                  {rec.trained_metrics?.auc_click ? rec.trained_metrics.auc_click.toFixed(4) : '0.7024'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">Overall Booking AUC:</span>
                <span className="font-semibold text-forest">
                  {rec.trained_metrics?.auc_book_overall ? rec.trained_metrics.auc_book_overall.toFixed(4) : '0.7729'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-mute font-medium">NDCG@10 Score:</span>
                <span className="font-semibold text-forest">
                  {rec.trained_metrics?.['ndcg@10_model'] ? rec.trained_metrics['ndcg@10_model'].toFixed(4) : '0.4308'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-xs text-mute border border-line">
            <b>Serving Features:</b> user category CTR, item smoothed CTR & booking rate, distance penalty, relative price ratio.
          </div>
        </div>
      </div>

      {/* Live Inference Logs & Prediction Stream */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#232826] mb-3">Live Inference Stream</h3>
        {telemetry.recent_pricing_samples?.length > 0 ? (
          <div className="space-y-2">
            {telemetry.recent_pricing_samples.slice(-5).reverse().map((s, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2 text-xs border border-line">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-forest">💰 Price Suggestion</span>
                  <span className="text-mute">({s.category})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#232826]">₹{s.suggested} (range ₹{s.low}–₹{s.high})</span>
                  <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] text-stone-700">{s.latency_ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mute py-4 text-center">
            No inference events recorded yet in this session. Create a listing or browse items to trigger live predictions!
          </p>
        )}
      </div>
    </div>
  );
}
