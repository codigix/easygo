import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Clock4, PackageCheck, RefreshCcw, TrendingUp, Users } from "lucide-react";
import { deliveryService } from "../services/deliveryService";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const formatDisplayDate = (date) => new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

export default function DeliveryPerformancePage() {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  const [filters, setFilters] = useState({
    start: formatDate(start),
    end: formatDate(end),
  });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async (overrides) => {
    setLoading(true);
    setError("");
    const payload = overrides || filters;
    try {
      const response = await deliveryService.getPerformance({
        start_date: payload.start,
        end_date: payload.end,
      });
      setMetrics(response.data || null);
    } catch (err) {
      setError("Failed to load delivery performance");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchMetrics(filters);
  };

  const timelineMax = useMemo(() => {
    if (!metrics?.timeline || metrics.timeline.length === 0) return 1;
    return Math.max(
      ...metrics.timeline.map((day) => Number(day.delivered || 0) + Number(day.failed || 0)),
      1
    );
  }, [metrics]);

  const summary = metrics?.summary || {};

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Performance</h1>
          <p className="text-slate-600">Measure last-mile health, rider productivity, and returns.</p>
        </div>
        <button
          onClick={() => fetchMetrics(filters)}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-6">
        <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">Start date</label>
            <input
              type="date"
              value={filters.start}
              onChange={(e) => setFilters((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
              max={filters.end}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">End date</label>
            <input
              type="date"
              value={filters.end}
              onChange={(e) => setFilters((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
              min={filters.start}
              max={formatDate(new Date())}
            />
          </div>
          <div className="md:col-span-2 flex items-end justify-end">
            <button
              type="submit"
              className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 md:w-auto"
            >
              Update Window
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-600">Fetching analytics...</div>
        ) : !metrics ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-200 py-10 text-center text-slate-600">
            No performance data available for the selected window
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <SummaryCard
                icon={<PackageCheck size={18} />}
                label="Total Assignments"
                value={summary.total_assignments || 0}
              />
              <SummaryCard icon={<TrendingUp size={18} />} label="Delivered" value={summary.delivered || 0} />
              <SummaryCard icon={<AlertCircle size={18} />} label="Failed" value={summary.failed || 0} />
              <SummaryCard icon={<Clock4 size={18} />} label="Active" value={summary.active || 0} />
              <SummaryCard icon={<Users size={18} />} label="RTO" value={summary.rto_count || 0} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">On-time delivery rate</p>
                  <span className="text-sm font-semibold text-emerald-700">{summary.on_time_rate || 0}%</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, summary.on_time_rate || 0)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Goal: 90%+</p>
              </div>

              <div className="rounded border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Top Executives</p>
                {metrics.executives?.length ? (
                  <ul className="mt-4 space-y-3">
                    {metrics.executives.map((exec) => (
                      <li key={exec.name} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{exec.name || "Unassigned"}</p>
                          <p className="text-xs text-slate-500">Delivered {exec.delivered || 0}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>Failed {exec.failed || 0}</p>
                          <p>Active {exec.active || 0}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No executive data.</p>
                )}
              </div>

              <div className="rounded border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Window</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">{metrics.window?.start_date?.slice(0, 10)} → {metrics.window?.end_date?.slice(0, 10)}</p>
                <p className="mt-2 text-sm text-slate-600">Data aggregated for the selected period.</p>
              </div>
            </div>

            <div className="rounded border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BarChart3 size={16} /> 14-day delivery trend
              </div>
              <div className="mt-4 space-y-4">
                {(metrics.timeline || []).map((day) => {
                  const deliveries = Number(day.delivered || 0);
                  const failures = Number(day.failed || 0);
                  const total = deliveries + failures;
                  const deliveredWidth = (deliveries / timelineMax) * 100;
                  const failedWidth = (failures / timelineMax) * 100;
                  return (
                    <div key={day.day}>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{formatDisplayDate(day.day)}</span>
                        <span>
                          {deliveries} delivered / {failures} failed
                        </span>
                      </div>
                      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="bg-emerald-500" style={{ width: `${deliveredWidth}%` }}></div>
                        <div className="bg-red-300" style={{ width: `${failedWidth}%` }}></div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Total {total}</p>
                    </div>
                  );
                })}
                {(!metrics.timeline || metrics.timeline.length === 0) && (
                  <p className="text-sm text-slate-500">No recent activity to chart.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
