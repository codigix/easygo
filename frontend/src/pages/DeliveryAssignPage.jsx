import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, RefreshCcw, Search, Users } from "lucide-react";
import { deliveryService } from "../services/deliveryService";

const hubOptions = [
  { id: 1, name: "Pune Hub" },
  { id: 2, name: "Mumbai Hub" },
  { id: 3, name: "Delhi Hub" },
  { id: 4, name: "Bangalore Hub" },
];

export default function DeliveryAssignPage() {
  const [executives, setExecutives] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedShipments, setSelectedShipments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    executiveId: "",
    executiveName: "",
    executivePhone: "",
    hubId: "",
    routeCode: "",
    routeName: "",
    vehicleNumber: "",
  });

  useEffect(() => {
    fetchExecutives();
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [currentPage]);

  const fetchExecutives = async () => {
    try {
      const response = await deliveryService.getExecutives();
      setExecutives(response.data || []);
    } catch (err) {
      console.error("Failed to fetch executives", err);
    }
  };

  const fetchShipments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await deliveryService.getAssignableShipments({
        page: currentPage,
        search: search || undefined,
      });
      setShipments(response.data?.shipments || []);
      setPagination(response.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError("Failed to load shipments ready for delivery assignment");
    } finally {
      setLoading(false);
    }
  };

  const toggleShipment = (shipmentId) => {
    setSelectedShipments((prev) => {
      const next = new Set(prev);
      if (next.has(shipmentId)) {
        next.delete(shipmentId);
      } else {
        next.add(shipmentId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedShipments.size === shipments.length) {
      setSelectedShipments(new Set());
      return;
    }
    setSelectedShipments(new Set(shipments.map((s) => s.id)));
  };

  const handleExecutiveChange = (value) => {
    const selected = executives.find((exec) => String(exec.id) === value);
    setFormData((prev) => ({
      ...prev,
      executiveId: value,
      executiveName: selected?.name || "",
      executivePhone: selected?.phone || "",
    }));
  };

  const handleAssign = async () => {
    setError("");
    if (selectedShipments.size === 0) {
      setError("Select at least one shipment to assign");
      return;
    }
    if (!formData.executiveName.trim()) {
      setError("Delivery executive name is required");
      return;
    }

    setAssigning(true);
    try {
      await deliveryService.assignShipments({
        shipment_ids: Array.from(selectedShipments),
        delivery_executive_id: formData.executiveId ? parseInt(formData.executiveId, 10) : null,
        delivery_executive_name: formData.executiveName.trim(),
        delivery_executive_phone: formData.executivePhone || null,
        hub_id: formData.hubId ? parseInt(formData.hubId, 10) : null,
        route_code: formData.routeCode || null,
        route_name: formData.routeName || null,
        vehicle_number: formData.vehicleNumber || null,
      });
      setSuccess(`Assigned ${selectedShipments.size} shipment${selectedShipments.size > 1 ? "s" : ""}`);
      setSelectedShipments(new Set());
      setTimeout(() => setSuccess(""), 4000);
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign shipments");
    } finally {
      setAssigning(false);
    }
  };

  const selectedCount = selectedShipments.size;
  const selectedExecutive = useMemo(
    () => executives.find((exec) => String(exec.id) === formData.executiveId),
    [executives, formData.executiveId]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchShipments();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assign Delivery</h1>
            <p className="text-slate-600">
              Select ready shipments, choose a rider, and move them to last-mile operations.
            </p>
          </div>
          <button
            onClick={fetchShipments}
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Select Delivery Executive
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={formData.executiveId}
                onChange={(e) => handleExecutiveChange(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-2 pl-10 pr-3 text-slate-900"
              >
                <option value="">Choose from team</option>
                {executives.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} {exec.phone ? `(${exec.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Delivery Executive Name *
            </label>
            <input
              type="text"
              value={formData.executiveName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, executiveName: e.target.value }))
              }
              placeholder="Enter or confirm rider name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Contact Number
            </label>
            <input
              type="text"
              value={formData.executivePhone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, executivePhone: e.target.value }))
              }
              placeholder="Rider contact"
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Vehicle / Route Details
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vehicleNumber: e.target.value }))
                }
                placeholder="Vehicle Number"
                className="rounded border border-slate-300 px-3 py-2 text-slate-900"
              />
              <input
                type="text"
                value={formData.routeCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, routeCode: e.target.value }))
                }
                placeholder="Route Code"
                className="rounded border border-slate-300 px-3 py-2 text-slate-900"
              />
              <input
                type="text"
                value={formData.routeName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, routeName: e.target.value }))
                }
                placeholder="Route Name"
                className="rounded border border-slate-300 px-3 py-2 text-slate-900"
              />
              <select
                value={formData.hubId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hubId: e.target.value }))
                }
                className="rounded border border-slate-300 px-3 py-2 text-slate-900"
              >
                <option value="">Select Hub</option>
                {hubOptions.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search CN / receiver / phone"
                className="w-full rounded border border-slate-300 py-2 pl-10 pr-3 text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </form>
          <div className="text-sm text-slate-600">
            {selectedExecutive ? `Assigned to ${selectedExecutive.name}` : "No rider selected"}
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
              {selectedCount} shipment{selectedCount === 1 ? "" : "s"} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {selectedShipments.size === shipments.length ? "Clear Selection" : "Select All"}
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || selectedShipments.size === 0}
                className="rounded bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign to Delivery"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-600">
              Loading shipments...
            </div>
          ) : shipments.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-emerald-200 py-10 text-center text-slate-600">
              No shipments pending assignment
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedShipments.size === shipments.length}
                        onChange={selectAll}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900">CN</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Receiver</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Phone</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Pincode</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Weight</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedShipments.has(shipment.id)}
                          onChange={() => toggleShipment(shipment.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {shipment.shipment_cn}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.receiver_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.receiver_phone}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.receiver_pincode}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {shipment.weight} kg
                      </td>
                      <td className="px-4 py-3 text-slate-600">{shipment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {shipments.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <p>
                Page {pagination.page} of {pagination.pages} — {pagination.total} shipment
                {pagination.total === 1 ? "" : "s"}
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
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages || 1, currentPage + 1))
                  }
                  disabled={currentPage === (pagination.pages || 1)}
                  className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
