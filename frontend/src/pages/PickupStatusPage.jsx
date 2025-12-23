import React, { useState, useEffect } from "react";
import { pickupService } from "../services/pickupService";
import { AlertCircle, CheckCircle, Eye, Check, X } from "lucide-react";

const statusTimeline = {
  REQUESTED: { order: 1, label: "Pickup Requested", color: "bg-blue-100 text-blue-700" },
  SCHEDULED: { order: 2, label: "Scheduled", color: "bg-purple-100 text-purple-700" },
  ASSIGNED: { order: 3, label: "Assigned to Driver", color: "bg-orange-100 text-orange-700" },
  PICKED_UP: { order: 4, label: "Picked Up", color: "bg-green-100 text-green-700" },
  FAILED: { order: 5, label: "Failed", color: "bg-red-100 text-red-700" },
};

const statusIcons = {
  REQUESTED: "📝",
  SCHEDULED: "📅",
  ASSIGNED: "👤",
  PICKED_UP: "✓",
  FAILED: "✗",
};

export default function PickupStatusPage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [actionData, setActionData] = useState({
    type: null,
    failureReason: "",
    remarks: "",
  });

  useEffect(() => {
    fetchPickups();
  }, [statusFilter]);

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      const response = await pickupService.getAll(params);
      setPickups(response.data.pickups || []);
    } catch (err) {
      setError("Failed to fetch pickups");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (pickup, action) => {
    setSelectedPickup(pickup);
    setActionData({
      type: action,
      failureReason: "",
      remarks: "",
    });
  };

  const handleActionSubmit = async () => {
    try {
      setLoading(true);
      if (actionData.type === "complete") {
        await pickupService.markComplete(selectedPickup.id);
        setSuccess("Pickup marked as completed!");
      } else if (actionData.type === "fail") {
        await pickupService.markFailed(selectedPickup.id, {
          failureReason: actionData.failureReason,
          remarks: actionData.remarks,
        });
        setSuccess("Pickup marked as failed!");
      }
      setSelectedPickup(null);
      setActionData({ type: null, failureReason: "", remarks: "" });
      setTimeout(() => setSuccess(""), 3000);
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update pickup status");
    } finally {
      setLoading(false);
    }
  };

  const filteredPickups = pickups.filter(
    (p) =>
      p.pickup_request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status) => {
    const statusConfig = statusTimeline[status];
    return statusConfig ? statusConfig.color : "bg-gray-100 text-gray-700";
  };

  const getStatusProgression = (status) => {
    const currentOrder = statusTimeline[status]?.order || 0;
    return Object.entries(statusTimeline).map(([key, config]) => ({
      key,
      ...config,
      isCompleted: config.order < currentOrder,
      isCurrent: config.order === currentOrder,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Pickup Status
        </h1>
        <p className="text-slate-600">
          Track pickup requests and monitor status throughout the workflow
        </p>
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

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by Request ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-slate-300 px-4 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="FAILED">Failed</option>
            </select>
            <button
              onClick={fetchPickups}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-slate-600">Loading pickups...</p>
            </div>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50">
            <p className="text-slate-600">No pickups found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPickups.map((pickup) => (
              <div key={pickup.id} className="rounded-lg border border-slate-200 p-4 hover:border-emerald-300">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-emerald-700">
                        {pickup.pickup_request_id}
                      </span>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(pickup.status)}`}>
                        {statusTimeline[pickup.status]?.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {pickup.customer_name} • {pickup.city}
                    </p>
                    {pickup.driver_name && (
                      <p className="text-xs text-slate-500">
                        Driver: {pickup.driver_name} | Vehicle: {pickup.vehicle_no}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleActionClick(pickup, "view")}
                    className="rounded bg-slate-100 p-2 hover:bg-slate-200"
                  >
                    <Eye className="h-4 w-4 text-slate-700" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-1">
                  {getStatusProgression(pickup.status).map((item) => (
                    <div key={item.key} className="flex items-center gap-1">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          item.isCurrent
                            ? "bg-emerald-600 text-white"
                            : item.isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.isCompleted ? "✓" : statusIcons[item.key]}
                      </div>
                      {item.key !== "FAILED" && (
                        <div className="h-0.5 w-6 bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
                  <div>
                    <p className="font-medium">Parcels</p>
                    <p>{pickup.no_of_parcels}</p>
                  </div>
                  <div>
                    <p className="font-medium">Priority</p>
                    <p>{pickup.priority}</p>
                  </div>
                  <div>
                    <p className="font-medium">Pickup Date</p>
                    <p>
                      {pickup.pickup_date
                        ? new Date(pickup.pickup_date).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Updated</p>
                    <p>
                      {pickup.last_updated
                        ? new Date(pickup.last_updated).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                {pickup.status === "ASSIGNED" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleActionClick(pickup, "complete")}
                      className="flex-1 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <Check className="inline mr-1 h-3 w-3" />
                      Mark Picked Up
                    </button>
                    <button
                      onClick={() => handleActionClick(pickup, "fail")}
                      className="flex-1 rounded bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                    >
                      <X className="inline mr-1 h-3 w-3" />
                      Mark Failed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPickup && actionData.type === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Pickup Details
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Request ID</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedPickup.pickup_request_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <p className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(selectedPickup.status)}`}>
                    {statusTimeline[selectedPickup.status]?.label}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-600">Status Timeline</p>
                <div className="space-y-3">
                  {getStatusProgression(selectedPickup.status).map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          item.isCurrent
                            ? "bg-emerald-600 text-white"
                            : item.isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.isCompleted ? "✓" : statusIcons[item.key]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        {item.isCompleted && (
                          <p className="text-xs text-slate-500">Completed</p>
                        )}
                        {item.isCurrent && (
                          <p className="text-xs text-emerald-600">In Progress</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Customer Name</p>
                  <p className="text-sm text-slate-900">{selectedPickup.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Mobile</p>
                  <p className="text-sm text-slate-900">{selectedPickup.mobile_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">City</p>
                  <p className="text-sm text-slate-900">{selectedPickup.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Parcels</p>
                  <p className="text-sm text-slate-900">{selectedPickup.no_of_parcels}</p>
                </div>
              </div>

              {selectedPickup.driver_name && (
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Driver Assignment</p>
                  <p className="mt-1 text-sm text-blue-700">
                    Driver: {selectedPickup.driver_name}
                  </p>
                  {selectedPickup.vehicle_no && (
                    <p className="text-sm text-blue-700">
                      Vehicle: {selectedPickup.vehicle_no}
                    </p>
                  )}
                  {selectedPickup.expected_pickup_time && (
                    <p className="text-sm text-blue-700">
                      Expected Time: {selectedPickup.expected_pickup_time}
                    </p>
                  )}
                </div>
              )}

              {selectedPickup.failure_reason && (
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-900">Failure Details</p>
                  <p className="mt-1 text-sm text-red-700">
                    {selectedPickup.failure_reason}
                  </p>
                </div>
              )}

              <div>
                <button
                  onClick={() => setSelectedPickup(null)}
                  className="w-full rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPickup && actionData.type === "complete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Mark as Picked Up
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              {selectedPickup.pickup_request_id} - {selectedPickup.customer_name}
            </p>

            <div className="mb-6 rounded-lg bg-green-50 p-3">
              <p className="text-xs text-green-700">
                This will mark the pickup as completed and generate a shipment automatically.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleActionSubmit}
                disabled={loading}
                className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-green-400"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => setSelectedPickup(null)}
                className="flex-1 rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPickup && actionData.type === "fail" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Mark as Failed
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              {selectedPickup.pickup_request_id} - {selectedPickup.customer_name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Failure Reason *
                </label>
                <select
                  value={actionData.failureReason}
                  onChange={(e) =>
                    setActionData((prev) => ({
                      ...prev,
                      failureReason: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Customer not available">Customer not available</option>
                  <option value="Parcel not ready">Parcel not ready</option>
                  <option value="Wrong address">Wrong address</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={actionData.remarks}
                  onChange={(e) =>
                    setActionData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder="Add any additional remarks..."
                  rows="3"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> The pickup can be rescheduled for another attempt.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleActionSubmit}
                  disabled={loading || !actionData.failureReason}
                  className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:bg-red-400"
                >
                  {loading ? "Processing..." : "Confirm Failed"}
                </button>
                <button
                  onClick={() => setSelectedPickup(null)}
                  className="flex-1 rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
