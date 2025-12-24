import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, MapPin, RefreshCcw, Search, User } from "lucide-react";
import { deliveryService } from "../services/deliveryService";

const failureOptions = [
  { value: "", label: "All reasons" },
  { value: "Customer not available", label: "Customer not available" },
  { value: "Customer refused", label: "Customer refused" },
  { value: "Address incomplete", label: "Address incomplete" },
  { value: "Payment/COD issue", label: "Payment / COD issue" },
  { value: "Damaged parcel", label: "Damaged parcel" },
];

const statusStyles = {
  FAILED: "bg-red-100 text-red-700",
  RTO: "bg-orange-100 text-orange-700",
};

export default function DeliveryFailedRTOPage() {
  const [failures, setFailures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFailure, setSelectedFailure] = useState(null);

  useEffect(() => {
    fetchFailures();
  }, [currentPage, reason]);

  const fetchFailures = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await deliveryService.getFailedDeliveries({
        page: currentPage,
        failure_reason: reason || undefined,
        search: search || undefined,
      });
      setFailures(response.data?.failures || []);
      setPagination(response.data?.pagination || { page: 1, pages: 1 });
    } catch (err) {
      setError("Failed to load failed deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFailures();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Failed Delivery / RTO</h1>
          <p className="text-slate-600">Audit failed attempts, reasons, and reverse logistics.</p>
        </div>
        <button
          onClick={fetchFailures}
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
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-slate-300 py-2 pl-10 pr-3 text-slate-900"
                placeholder="Search CN / rider / receiver"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">Failure reason</label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            >
              {failureOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apply Filters
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-600">Loading failed deliveries...</div>
        ) : failures.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-200 py-10 text-center text-slate-600">
            No failed deliveries found for the selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-900">CN</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Failure</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Rider</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {failures.map((failure) => (
                  <tr key={failure.assignment_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {failure.shipment_cn}
                      <p className="text-xs text-slate-500">{failure.receiver_name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{failure.failure_reason || "—"}</p>
                      <p className="text-xs text-slate-500">{failure.failure_notes || "No notes"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{failure.delivery_executive_name || "—"}</p>
                      <p className="text-xs text-slate-500">{failure.delivery_executive_phone || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[failure.assignment_status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {failure.assignment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedFailure(failure)}
                        className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ClipboardList size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {failures.length > 0 && (
          <div className="flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages || 1, currentPage + 1))}
                disabled={currentPage === (pagination.pages || 1)}
                className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Failure details</h2>
              <p className="text-sm text-slate-500">{selectedFailure.shipment_cn}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={<User size={14} />} label="Rider" value={selectedFailure.delivery_executive_name || "—"} />
              <InfoCard icon={<MapPin size={14} />} label="Route" value={selectedFailure.route_name || selectedFailure.route_code || "—"} />
              <InfoCard icon={<ClipboardList size={14} />} label="Reason" value={selectedFailure.failure_reason || "—"} />
              <InfoCard icon={<ClipboardList size={14} />} label="Status" value={selectedFailure.assignment_status} />
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {selectedFailure.failure_notes || "No additional notes provided."}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedFailure(null)}
                className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-slate-900">{value}</p>
    </div>
  );
}
