import { useState, useEffect } from "react";
import { hubOperationsService } from "../services/hubOperationsService";
import { shipmentService } from "../services/shipmentService";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const rtoReasonLabels = {
  DELIVERY_FAILED: "Delivery Failed",
  CUSTOMER_REFUSED: "Customer Refused",
  ADDRESS_UNSERVICEABLE: "Address Unserviceable",
  DAMAGED_PARCEL: "Damaged Parcel",
  LOST_PARCEL: "Lost Parcel",
  PAYMENT_ISSUE: "Payment Issue",
};

const statusColors = {
  INITIATED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  RETURNED: "bg-green-100 text-green-700",
  RESOLVED: "bg-purple-100 text-purple-700",
};

const hubOptions = [
  { id: 1, name: "Pune Hub" },
  { id: 2, name: "Mumbai Hub" },
  { id: 3, name: "Delhi Hub" },
  { id: 4, name: "Bangalore Hub" },
];

export default function ReManifestRTOPage() {
  const [activeTab, setActiveTab] = useState("rto");
  const [formData, setFormData] = useState({
    shipment_ids: [],
    rto_reason: "DELIVERY_FAILED",
    origin_hub_id: "",
    return_destination_hub_id: "",
    notes: "",
  });

  const [shipments, setShipments] = useState([]);
  const [rtoManifests, setRTOManifests] = useState([]);
  const [selectedShipments, setSelectedShipments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (activeTab === "rto") {
      fetchRTOManifests();
    } else {
      fetchShipments();
    }
  }, [activeTab, currentPage]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await shipmentService.getShipments(1, 100, {
        status: "DELIVERY_FAILED",
      });
      setShipments(response.data.shipments || []);
    } catch (err) {
      setError("Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  const fetchRTOManifests = async () => {
    setLoading(true);
    try {
      const response = await hubOperationsService.getRTOManifests(currentPage);
      setRTOManifests(response.data.rtos || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch RTO manifests");
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentToggle = (shipmentId) => {
    const newSelected = new Set(selectedShipments);
    if (newSelected.has(shipmentId)) {
      newSelected.delete(shipmentId);
    } else {
      newSelected.add(shipmentId);
    }
    setSelectedShipments(newSelected);
  };

  const handleSubmitRTO = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedShipments.size === 0) {
      setError("Please select at least one shipment");
      return;
    }

    if (!formData.rto_reason) {
      setError("Please select RTO reason");
      return;
    }

    if (!formData.origin_hub_id) {
      setError("Please select the origin hub");
      return;
    }

    if (!formData.return_destination_hub_id) {
      setError("Please select the return destination hub");
      return;
    }

    setLoading(true);
    try {
      const response = await hubOperationsService.initiateRTO({
        shipment_ids: Array.from(selectedShipments),
        rto_reason: formData.rto_reason,
        origin_hub_id: parseInt(formData.origin_hub_id),
        return_destination_hub_id: parseInt(formData.return_destination_hub_id),
        notes: formData.notes || null,
      });

      setSuccess(
        `RTO initiated: ${response.data.rto_manifest_number} (${response.data.shipments_count} shipments)`
      );
      setSelectedShipments(new Set());
      setFormData({
        shipment_ids: [],
        rto_reason: "DELIVERY_FAILED",
        origin_hub_id: "",
        return_destination_hub_id: "",
        notes: "",
      });
      fetchShipments();
      setActiveTab("rto");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate RTO");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRTO = async (id) => {
    if (!confirm("Mark this RTO as returned?")) return;

    try {
      await hubOperationsService.completeRTO(id);
      setSuccess("RTO completed successfully");
      fetchRTOManifests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete RTO");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Re-Manifest & RTO Management
        </h1>
        <p className="text-slate-600">Handle shipment failures and returns</p>
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

      <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab("initiate");
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-3 font-semibold text-center ${
              activeTab === "initiate"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Initiate RTO
          </button>
          <button
            onClick={() => {
              setActiveTab("rto");
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-3 font-semibold text-center ${
              activeTab === "rto"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            RTO Manifests
          </button>
        </div>

        <div className="p-6">
          {activeTab === "initiate" ? (
            <form onSubmit={handleSubmitRTO} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  RTO Reason *
                </label>
                <select
                  value={formData.rto_reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rto_reason: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(rtoReasonLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Origin Hub *
                  </label>
                  <select
                    value={formData.origin_hub_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        origin_hub_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select hub</option>
                    {hubOptions.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Return Destination Hub *
                  </label>
                  <select
                    value={formData.return_destination_hub_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        return_destination_hub_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select hub</option>
                    {hubOptions.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional details about RTO..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {shipments.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Delivery Failed Shipments: {selectedShipments.size} selected
                  </p>
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                    <div className="space-y-2 p-3">
                      {shipments.map((shipment) => (
                        <label
                          key={shipment.id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedShipments.has(shipment.id)}
                            onChange={() => handleShipmentToggle(shipment.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm text-slate-900">
                              {shipment.shipment_cn}
                            </p>
                            <p className="text-xs text-slate-600">
                              {shipment.receiver_name} · {shipment.weight}kg
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || selectedShipments.size === 0}
                className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Initiating RTO..." : "Initiate RTO"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-slate-600">Loading...</p>
              ) : rtoManifests.length === 0 ? (
                <p className="text-center text-slate-600">No RTO manifests found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            RTO No
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            Shipments
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rtoManifests.map((rto) => (
                          <tr
                            key={rto.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3">
                              <p className="font-mono text-sm text-slate-900">
                                {rto.rto_manifest_number}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {rtoReasonLabels[rto.rto_reason]}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {rto.total_shipments}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                  statusColors[rto.status]
                                }`}
                              >
                                {rto.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {rto.status === "INITIATED" && (
                                <button
                                  onClick={() => handleCompleteRTO(rto.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Mark Returned
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!loading && rtoManifests.length > 0 && (
                    <div className="flex items-center justify-between mt-6">
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">RTO Workflow:</h3>
        <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
          <li>
            <strong>Initiate RTO:</strong> Select failed shipments + reason + initiate
          </li>
          <li>
            <strong>RTO In-Transit:</strong> Shipments move back to origin via reverse logistics
          </li>
          <li>
            <strong>Mark Returned:</strong> Confirm receipt at origin hub
          </li>
          <li>
            <strong>Resolve:</strong> Final delivery to sender or write-off
          </li>
        </ol>
      </div>
    </div>
  );
}
