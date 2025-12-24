import React, { useState, useEffect } from "react";
import { shipmentService } from "../services/shipmentService";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const exceptionTypeColors = {
  WEIGHT_MISMATCH: "bg-yellow-100 text-yellow-700",
  ADDRESS_UNSERVICEABLE: "bg-orange-100 text-orange-700",
  DELIVERY_FAILED: "bg-red-100 text-red-700",
  DAMAGED_PARCEL: "bg-red-200 text-red-900",
  LOST_PARCEL: "bg-red-300 text-red-900",
  CUSTOMER_REFUSED: "bg-purple-100 text-purple-700",
  PAYMENT_ISSUE: "bg-blue-100 text-blue-700",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
  ESCALATED: "bg-red-100 text-red-700",
};

export default function ShipmentExceptionsPage() {
  const [exceptions, setExceptions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedException, setSelectedException] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    status: "RESOLVED",
    resolution_notes: "",
    new_status: "",
  });

  useEffect(() => {
    fetchExceptions();
  }, [currentPage, statusFilter]);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;

      const response = await shipmentService.getShipmentExceptions(
        currentPage,
        20,
        filters
      );
      setExceptions(response.data.exceptions || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch exceptions");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();

    if (!selectedException) return;

    if (!resolutionData.resolution_notes.trim()) {
      setError("Resolution notes are required");
      return;
    }

    try {
      setLoading(true);
      await shipmentService.resolveException(
        selectedException.shipment_id,
        selectedException.id,
        {
          status: resolutionData.status,
          resolution_notes: resolutionData.resolution_notes,
          new_status: resolutionData.new_status || "CREATED",
        }
      );

      setSuccess("Exception resolved successfully");
      setTimeout(() => setSuccess(""), 3000);
      setSelectedException(null);
      setResolutionData({
        status: "RESOLVED",
        resolution_notes: "",
        new_status: "",
      });
      fetchExceptions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve exception");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Shipment Exceptions
        </h1>
        <p className="text-slate-600">
          Track and resolve shipment issues and exceptions
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-slate-300 px-4 py-2 text-slate-900"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-600">Loading exceptions...</p>
          </div>
        ) : exceptions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 py-8 text-center">
            <p className="text-slate-600">No exceptions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-900">CN</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Receiver</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Exception Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">
                      Description
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exceptions.map((exception) => (
                    <tr key={exception.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {exception.shipment_cn}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {exception.receiver_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-3 py-1 text-xs font-semibold ${
                            exceptionTypeColors[exception.exception_type] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {exception.exception_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-3 py-1 text-xs font-semibold ${
                            statusColors[exception.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {exception.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {exception.description ? (
                          <span className="line-clamp-2">{exception.description}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {exception.status === "PENDING" && (
                          <button
                            onClick={() => {
                              setSelectedException(exception);
                              setResolutionData({
                                status: "RESOLVED",
                                resolution_notes: "",
                                new_status: "",
                              });
                            }}
                            className="rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-200"
                          >
                            Resolve
                          </button>
                        )}
                        {exception.status !== "PENDING" && (
                          <button
                            onClick={() => setSelectedException(exception)}
                            className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {exceptions.length} of {pagination.total} exceptions (Page{" "}
                {pagination.page} of {pagination.pages})
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Exception Details</h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">CN</p>
                  <p className="text-slate-600">{selectedException.shipment_cn}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Receiver</p>
                  <p className="text-slate-600">{selectedException.receiver_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Exception Type</p>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                      exceptionTypeColors[selectedException.exception_type]
                    }`}
                  >
                    {selectedException.exception_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Status</p>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                      statusColors[selectedException.status]
                    }`}
                  >
                    {selectedException.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-slate-700">Description</p>
                  <p className="text-slate-600">
                    {selectedException.description || "No description provided"}
                  </p>
                </div>
                {selectedException.resolution_notes && (
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-700">Resolution Notes</p>
                    <p className="text-slate-600">
                      {selectedException.resolution_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedException.status === "PENDING" && (
              <form onSubmit={handleResolve} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Resolution Status *
                  </label>
                  <select
                    value={resolutionData.status}
                    onChange={(e) =>
                      setResolutionData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-4 py-2"
                  >
                    <option value="RESOLVED">Resolved</option>
                    <option value="ESCALATED">Escalate</option>
                  </select>
                </div>

                {resolutionData.status === "RESOLVED" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Shipment Status
                    </label>
                    <select
                      value={resolutionData.new_status}
                      onChange={(e) =>
                        setResolutionData((prev) => ({
                          ...prev,
                          new_status: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-slate-300 px-4 py-2"
                    >
                      <option value="">Select Status</option>
                      <option value="CREATED">Back to Created</option>
                      <option value="RTO">Mark as RTO</option>
                      <option value="DELIVERED">Mark as Delivered</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Resolution Notes *
                  </label>
                  <textarea
                    value={resolutionData.resolution_notes}
                    onChange={(e) =>
                      setResolutionData((prev) => ({
                        ...prev,
                        resolution_notes: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-4 py-2"
                    rows="4"
                    placeholder="Describe how this exception was resolved..."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedException(null)}
                    className="flex-1 rounded bg-slate-200 px-4 py-2 font-medium text-slate-900 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? "Resolving..." : "Resolve Exception"}
                  </button>
                </div>
              </form>
            )}

            {selectedException.status !== "PENDING" && (
              <button
                onClick={() => setSelectedException(null)}
                className="w-full rounded bg-slate-200 px-4 py-2 font-medium hover:bg-slate-300"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
