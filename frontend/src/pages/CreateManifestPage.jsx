import { useState, useEffect } from "react";
import { shipmentService } from "../services/shipmentService";
import { hubOperationsService } from "../services/hubOperationsService";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function CreateManifestPage() {
  const [formData, setFormData] = useState({
    courier_company_id: "",
    origin_hub_id: "",
    shipment_ids: [],
  });

  const [shipments, setShipments] = useState([]);
  const [selectedShipments, setSelectedShipments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scanCN, setScanCN] = useState("");

  useEffect(() => {
    fetchCreatedShipments();
  }, []);

  const fetchCreatedShipments = async () => {
    setLoading(true);
    try {
      const response = await shipmentService.getShipments(1, 100, { status: "CREATED" });
      setShipments(response.data.shipments || []);
    } catch (err) {
      setError("Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleScanCN = (e) => {
    e.preventDefault();
    if (!scanCN.trim()) return;

    const shipment = shipments.find((s) => s.shipment_cn === scanCN);
    if (shipment) {
      handleShipmentToggle(shipment.id);
      setScanCN("");
    } else {
      setError("Shipment CN not found");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.courier_company_id) {
      setError("Please select a courier company");
      return;
    }

    if (!formData.origin_hub_id) {
      setError("Please select an origin hub");
      return;
    }

    if (selectedShipments.size === 0) {
      setError("Please select at least one shipment");
      return;
    }

    setLoading(true);
    try {
      const manifestData = {
        courier_company_id: parseInt(formData.courier_company_id),
        origin_hub_id: parseInt(formData.origin_hub_id),
        shipment_ids: Array.from(selectedShipments),
      };

      const response = await hubOperationsService.createManifest(manifestData);

      setSuccess(`Manifest created: ${response.data.manifest_number}`);
      setFormData({ courier_company_id: "", origin_hub_id: "", shipment_ids: [] });
      setSelectedShipments(new Set());
      fetchCreatedShipments();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create manifest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Create Manifest</h1>
        <p className="text-slate-600">Group shipments and hand over to courier</p>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Courier Company *
              </label>
              <select
                name="courier_company_id"
                value={formData.courier_company_id}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select courier</option>
                <option value="1">DHL Express</option>
                <option value="2">FedEx</option>
                <option value="3">BlueDart</option>
                <option value="4">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Origin Hub *
              </label>
              <select
                name="origin_hub_id"
                value={formData.origin_hub_id}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select hub</option>
                <option value="1">Pune Hub</option>
                <option value="2">Mumbai Hub</option>
                <option value="3">Delhi Hub</option>
                <option value="4">Bangalore Hub</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Scan CN or Select Shipments
            </label>
            <form onSubmit={handleScanCN} className="flex gap-2">
              <input
                type="text"
                value={scanCN}
                onChange={(e) => setScanCN(e.target.value)}
                placeholder="Scan shipment CN..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Scan
              </button>
            </form>
          </div>

          {shipments.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Selected: {selectedShipments.size} / {shipments.length}
              </p>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                <div className="space-y-2 p-3">
                  {shipments.map((shipment) => (
                    <label key={shipment.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedShipments.has(shipment.id)}
                        onChange={() => handleShipmentToggle(shipment.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-slate-900">{shipment.shipment_cn}</p>
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
            className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Manifest"}
          </button>
        </form>
      </div>
    </div>
  );
}
