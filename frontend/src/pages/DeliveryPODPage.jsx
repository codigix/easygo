import { useEffect, useState } from "react";
import { deliveryService } from "../services/deliveryService";
import { AlertCircle, CheckCircle, PackageCheck, RefreshCcw, Search } from "lucide-react";

export default function DeliveryPODPage() {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [podModal, setPodModal] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [currentPage]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await deliveryService.getOutForDelivery({
        page: currentPage,
        search: search || undefined,
      });
      setAssignments(response.data?.assignments || []);
      setPagination(response.data?.pagination || { page: 1, pages: 1 });
    } catch (err) {
      setError("Failed to fetch shipments awaiting POD");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAssignments();
  };

  const openPodModal = (assignment) => {
    setPodModal({
      assignment,
      recipientName: assignment.receiver_name,
      recipientPhone: assignment.receiver_phone || "",
      notes: "",
    });
  };

  const handlePodSubmit = async () => {
    if (!podModal) return;
    try {
      await deliveryService.completeDelivery(podModal.assignment.assignment_id, {
        pod_recipient_name: podModal.recipientName,
        pod_recipient_phone: podModal.recipientPhone,
        pod_notes: podModal.notes,
      });
      setSuccess("Delivery confirmed");
      setPodModal(null);
      setTimeout(() => setSuccess(""), 3000);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to capture POD");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proof of Delivery (POD)</h1>
          <p className="text-slate-600">Confirm deliveries with recipient details and notes.</p>
        </div>
        <button
          onClick={fetchAssignments}
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

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-6">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Search by CN / receiver / phone</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-slate-300 py-2 pl-10 pr-3 text-slate-900"
                placeholder="Scan or type shipment number"
              />
            </div>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-600">Loading shipments...</div>
        ) : assignments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-200 py-10 text-center text-slate-600">
            No shipments are awaiting POD confirmation
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-900">CN</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Receiver</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Rider</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Route</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.assignment_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {assignment.shipment_cn}
                      <p className="text-xs text-slate-500">{assignment.receiver_pincode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{assignment.receiver_name}</p>
                      <p className="text-xs text-slate-500">{assignment.receiver_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{assignment.delivery_executive_name || "Unassigned"}</p>
                      <p className="text-xs text-slate-500">{assignment.delivery_executive_phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{assignment.route_name || assignment.route_code || "—"}</p>
                      <p className="text-xs text-slate-500">{assignment.vehicle_number || "Vehicle TBD"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openPodModal(assignment)}
                        className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <PackageCheck size={14} /> Capture POD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {assignments.length > 0 && (
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

      {podModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Capture POD</h2>
              <p className="text-sm text-slate-500">
                {podModal.assignment.shipment_cn} — {podModal.assignment.receiver_name}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  value={podModal.recipientName}
                  onChange={(e) => setPodModal((prev) => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient Phone</label>
                <input
                  type="text"
                  value={podModal.recipientPhone}
                  onChange={(e) => setPodModal((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  rows={3}
                  value={podModal.notes}
                  onChange={(e) => setPodModal((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPodModal(null)}
                className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePodSubmit}
                className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                <PackageCheck size={16} /> Save POD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
