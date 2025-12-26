import { useState, useEffect } from "react";
import { hubOperationsService } from "../services/hubOperationsService";
import { AlertCircle, CheckCircle, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";

const statusColors = {
  OPEN: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-700",
  PICKUP_ASSIGNED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export default function HubManifestListPage() {
  const [manifests, setManifests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedManifest, setSelectedManifest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [remanifestData, setRemanifestData] = useState({
    shipment_ids: [],
    reason: "",
  });

  useEffect(() => {
    fetchManifests();
  }, [currentPage, statusFilter]);

  const fetchManifests = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;

      const response = await hubOperationsService.getManifests(currentPage, filters);
      setManifests(response.data.manifests || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch manifests");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id) => {
    if (!confirm("Close this manifest?")) return;

    try {
      await hubOperationsService.closeManifest(id);
      setSuccess("Manifest closed successfully");
      setTimeout(() => setSuccess(""), 3000);
      fetchManifests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close manifest");
    }
  };

  const handleViewDetail = async (manifest) => {
    try {
      const response = await hubOperationsService.getManifestById(manifest.id);
      setSelectedManifest(response.data);
      setShowDetail(true);
    } catch (err) {
      setError("Failed to fetch manifest details");
    }
  };

  const handleRemanifest = async (e) => {
    e.preventDefault();

    if (remanifestData.shipment_ids.length === 0) {
      setError("Select at least one shipment to remanifest");
      return;
    }

    try {
      setLoading(true);
      await hubOperationsService.remanifest(selectedManifest.id, remanifestData);
      setSuccess("Shipments remanifested successfully");
      setShowDetail(false);
      setSelectedManifest(null);
      setRemanifestData({ shipment_ids: [], reason: "" });
      fetchManifests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remanifest");
    } finally {
      setLoading(false);
    }
  };

  const toggleShipmentSelection = (shipmentId) => {
    const updated = remanifestData.shipment_ids.includes(shipmentId)
      ? remanifestData.shipment_ids.filter((id) => id !== shipmentId)
      : [...remanifestData.shipment_ids, shipmentId];

    setRemanifestData((prev) => ({
      ...prev,
      shipment_ids: updated,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Manifest List</h1>
        <p className="text-slate-600">Track and manage all manifests</p>
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
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-48 rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="PICKUP_ASSIGNED">Pickup Assigned</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-slate-600">Loading...</p>
        ) : manifests.length === 0 ? (
          <p className="text-center text-slate-600">No manifests found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Manifest No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Courier
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Shipments
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {manifests.map((manifest) => (
                  <tr key={manifest.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm text-slate-900">
                        {manifest.manifest_number}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {manifest.courier_company_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {manifest.total_shipments}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {parseFloat(manifest.total_weight).toFixed(2)} kg
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[manifest.status]}`}>
                        {manifest.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(manifest)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {manifest.status === "OPEN" && (
                          <button
                            onClick={() => handleClose(manifest.id)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && manifests.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedManifest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedManifest.manifest_number}
                </h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedManifest.shipments && selectedManifest.shipments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Shipments:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedManifest.shipments.map((shipment) => (
                      <label key={shipment.id} className="flex items-center gap-2 p-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={remanifestData.shipment_ids.includes(shipment.id)}
                          onChange={() => toggleShipmentSelection(shipment.id)}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-sm">{shipment.shipment_cn}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedManifest.status === "OPEN" && (
                <form onSubmit={handleRemanifest} className="space-y-3 mt-4 border-t pt-4">
                  <textarea
                    value={remanifestData.reason}
                    onChange={(e) =>
                      setRemanifestData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Reason for remanifest..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={remanifestData.shipment_ids.length === 0 || loading}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? "Remanifesting..." : "Remanifest Selected"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
