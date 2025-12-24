import React, { useState, useEffect } from "react";
import { shipmentService } from "../services/shipmentService";
import { AlertCircle, CheckCircle, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const statusColors = {
  CREATED: "bg-blue-100 text-blue-700",
  MANIFESTED: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  RTO: "bg-red-100 text-red-700",
  EXCEPTION: "bg-red-200 text-red-900",
};

export default function ShipmentListPage() {
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, [currentPage, statusFilter, sourceFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (sourceFilter !== "ALL") filters.shipment_source = sourceFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await shipmentService.getShipments(currentPage, 20, filters);
      setShipments(response.data.shipments || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchShipments();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this shipment?")) return;

    try {
      await shipmentService.deleteShipment(id);
      setSuccess("Shipment deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete shipment");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await shipmentService.updateShipmentStatus(id, { status: newStatus });
      setSuccess("Shipment status updated");
      setTimeout(() => setSuccess(""), 3000);
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Shipment List</h1>
        <p className="text-slate-600">View and manage all shipments</p>
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
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by CN, receiver name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
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
                <option value="CREATED">Created</option>
                <option value="MANIFESTED">Manifested</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RTO">RTO</option>
                <option value="EXCEPTION">Exception</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-slate-300 px-4 py-2 text-slate-900"
              >
                <option value="ALL">All Sources</option>
                <option value="MANUAL">Manual</option>
                <option value="PICKUP">Pickup</option>
                <option value="WALKIN">Walk-in</option>
                <option value="BULK">Bulk Upload</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-600">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 py-8 text-center">
            <p className="text-slate-600">No shipments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-900">CN</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Receiver</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Phone</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Weight</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Service</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Source</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {shipment.shipment_cn}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.receiver_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.receiver_phone}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.weight} kg
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.service_type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            statusColors[shipment.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {shipment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="inline-block rounded bg-slate-100 px-2 py-1 text-xs">
                          {shipment.shipment_source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedShipment(shipment)}
                            className="rounded bg-blue-100 p-1 text-blue-600 hover:bg-blue-200"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          {shipment.status === "CREATED" && (
                            <button
                              onClick={() => handleDelete(shipment.id)}
                              className="rounded bg-red-100 p-1 text-red-600 hover:bg-red-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {shipments.length} of {pagination.total} shipments (Page{" "}
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

      {selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Shipment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700">CN</p>
                <p className="text-slate-600">{selectedShipment.shipment_cn}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Status</p>
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                    statusColors[selectedShipment.status]
                  }`}
                >
                  {selectedShipment.status}
                </span>
              </div>
              <div className="col-span-2">
                <p className="font-semibold text-slate-700">Receiver</p>
                <p className="text-slate-600">{selectedShipment.receiver_name}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Phone</p>
                <p className="text-slate-600">{selectedShipment.receiver_phone}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Weight</p>
                <p className="text-slate-600">{selectedShipment.weight} kg</p>
              </div>
              <div className="col-span-2">
                <p className="font-semibold text-slate-700">Address</p>
                <p className="text-slate-600">
                  {selectedShipment.receiver_address}, {selectedShipment.receiver_pincode}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Service</p>
                <p className="text-slate-600">{selectedShipment.service_type}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Total Charge</p>
                <p className="text-slate-600">₹{selectedShipment.total_charge}</p>
              </div>
            </div>

            {selectedShipment.status === "CREATED" && (
              <div className="mt-6 flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleStatusChange(selectedShipment.id, e.target.value);
                      setSelectedShipment(null);
                    }
                  }}
                  className="flex-1 rounded border border-slate-300 px-4 py-2"
                >
                  <option value="">Update Status...</option>
                  <option value="MANIFESTED">Mark as Manifested</option>
                </select>
              </div>
            )}

            <button
              onClick={() => setSelectedShipment(null)}
              className="mt-6 w-full rounded bg-slate-200 px-4 py-2 font-medium hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
