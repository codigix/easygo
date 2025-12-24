import React from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  MapPin,
  PackageCheck,
  PlayCircle,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { deliveryService } from "../services/deliveryService";

const assignmentStatusStyles = {
  ASSIGNED: "bg-slate-100 text-slate-700",
  OUT_FOR_DELIVERY: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RTO: "bg-orange-100 text-orange-700",
};

const failureReasons = [
  "Customer not available",
  "Customer refused",
  "Address incomplete",
  "Payment/COD issue",
  "Damaged parcel",
];

export default function DeliveryOutForDeliveryPage() {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [executives, setExecutives] = useState([]);
  const [executiveFilter, setExecutiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [podModal, setPodModal] = useState(null);
  const [failModal, setFailModal] = useState(null);

  useEffect(() => {
    fetchExecutives();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [currentPage, statusFilter, executiveFilter]);

  const fetchExecutives = async () => {
    try {
      const response = await deliveryService.getExecutives();
      setExecutives(response.data || []);
    } catch (err) {
      console.error("Failed to load executives", err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await deliveryService.getOutForDelivery({
        page: currentPage,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        delivery_executive_id: executiveFilter || undefined,
        search: search || undefined,
      });
      setAssignments(response.data?.assignments || []);
      setPagination(response.data?.pagination || { page: 1, pages: 1 });
    } catch (err) {
      setError("Failed to fetch delivery pipeline");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (assignmentId) => {
    try {
      await deliveryService.startDelivery(assignmentId);
      setSuccess("Delivery started");
      setTimeout(() => setSuccess(""), 3000);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start delivery");
    }
  };

  const handlePodSubmit = async () => {
    if (!podModal) return;
    try {
      await deliveryService.completeDelivery(podModal.assignment.assignment_id, {
        pod_recipient_name: podModal.recipientName,
        pod_recipient_phone: podModal.recipientPhone,
        pod_notes: podModal.notes,
      });
      setSuccess("Shipment marked delivered");
      setPodModal(null);
      setTimeout(() => setSuccess(""), 3000);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to capture POD");
    }
  };

  const handleFailSubmit = async () => {
    if (!failModal) return;
    try {
      await deliveryService.failDelivery(failModal.assignment.assignment_id, {
        failure_reason: failModal.reason,
        failure_notes: failModal.notes,
        initiate_rto: failModal.initiateRTO,
      });
      setSuccess(failModal.initiateRTO ? "RTO initiated" : "Delivery attempt logged");
      setFailModal(null);
      setTimeout(() => setSuccess(""), 3000);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update delivery status");
    }
  };

  const openPodModal = (assignment) => {
    setPodModal({
      assignment,
      recipientName: assignment.receiver_name,
      recipientPhone: assignment.receiver_phone || "",
      notes: "",
    });
  };

  const openFailModal = (assignment) => {
    setFailModal({
      assignment,
      reason: failureReasons[0],
      notes: "",
      initiateRTO: true,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAssignments();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Out for Delivery</h1>
            <p className="text-slate-600">
              Track live riders, monitor progress, and close deliveries with POD or RTO actions.
            </p>
          </div>
          <button
            onClick={fetchAssignments}
            className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
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
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search CN / receiver / phone"
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="ALL">All</option>
              <option value="ASSIGNED">Awaiting dispatch</option>
              <option value="OUT_FOR_DELIVERY">On route</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">Executive</label>
            <select
              value={executiveFilter}
              onChange={(e) => {
                setExecutiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="">All riders</option>
              {executives.map((exec) => (
                <option key={exec.id} value={exec.id}>
                  {exec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apply Filters
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-600">
            Loading delivery queue...
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-200 py-10 text-center text-slate-600">
            No shipments currently out for delivery
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
                  <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
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
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          assignmentStatusStyles[assignment.assignment_status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {assignment.assignment_status === "ASSIGNED" ? <Clock3 size={12} /> : <TruckIcon status={assignment.assignment_status} />}
                        {assignment.assignment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {assignment.assignment_status === "ASSIGNED" && (
                          <button
                            onClick={() => handleStart(assignment.assignment_id)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <PlayCircle size={14} /> Start
                          </button>
                        )}
                        <button
                          onClick={() => openPodModal(assignment)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <PackageCheck size={14} /> POD
                        </button>
                        <button
                          onClick={() => openFailModal(assignment)}
                          className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          <ShieldAlert size={14} /> Fail
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Capture POD</h2>
            <p className="text-sm text-slate-500">
              {podModal.assignment.shipment_cn} — {podModal.assignment.receiver_name}
            </p>
            <div className="mt-4 space-y-4">
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
                  value={podModal.notes}
                  onChange={(e) => setPodModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPodModal(null)}
                className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePodSubmit}
                className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                Save POD
              </button>
            </div>
          </div>
        </div>
      )}

      {failModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Failed Delivery</h2>
            <p className="text-sm text-slate-500">
              {failModal.assignment.shipment_cn} — {failModal.assignment.receiver_name}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
                <select
                  value={failModal.reason}
                  onChange={(e) => setFailModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                >
                  {failureReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={failModal.notes}
                  onChange={(e) => setFailModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={failModal.initiateRTO}
                  onChange={(e) => setFailModal((prev) => ({ ...prev, initiateRTO: e.target.checked }))}
                />
                Initiate RTO immediately
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setFailModal(null)}
                className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFailSubmit}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Save Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TruckIcon({ status }) {
  if (status === "OUT_FOR_DELIVERY") {
    return <MapPin size={12} />;
  }
  if (status === "DELIVERED") {
    return <PackageCheck size={12} />;
  }
  return <Truck size={12} />;
}
