import { useState } from "react";
import { hubOperationsService } from "../services/hubOperationsService";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function HubInScanPage() {
  const [formData, setFormData] = useState({
    shipment_cn: "",
    hub_id: "",
    device_id: "",
  });

  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.shipment_cn.trim()) {
      setError("Please enter or scan shipment CN");
      return;
    }

    if (!formData.hub_id) {
      setError("Please select a hub");
      return;
    }

    setLoading(true);
    try {
      const response = await hubOperationsService.hubInScan({
        shipment_cn: formData.shipment_cn,
        hub_id: parseInt(formData.hub_id),
        device_id: formData.device_id || "WEB",
      });

      setScanResults((prev) => [
        {
          cn: formData.shipment_cn,
          status: "SUCCESS",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      setSuccess(`✓ ${formData.shipment_cn} scanned in successfully`);
      setFormData((prev) => ({
        ...prev,
        shipment_cn: "",
      }));

      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setScanResults((prev) => [
        {
          cn: formData.shipment_cn,
          status: "FAILED",
          error: err.response?.data?.message || "Scan failed",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setError(err.response?.data?.message || "Failed to scan shipment");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Hub In-Scan</h1>
        <p className="text-slate-600">Scan shipments arriving at hub (CRITICAL OPERATION)</p>
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
        <form onSubmit={handleScan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Select Hub *
              </label>
              <select
                name="hub_id"
                value={formData.hub_id}
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

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Device ID (Optional)
              </label>
              <input
                type="text"
                name="device_id"
                value={formData.device_id}
                onChange={handleInputChange}
                placeholder="Scanner ID"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Scan Shipment CN *
            </label>
            <input
              type="text"
              name="shipment_cn"
              value={formData.shipment_cn}
              onChange={handleInputChange}
              placeholder="Scan or type shipment CN..."
              autoFocus
              className="w-full rounded-lg border-2 border-emerald-400 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.shipment_cn.trim()}
            className="w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-lg"
          >
            {loading ? "Scanning..." : "SCAN"}
          </button>
        </form>
      </div>

      {scanResults.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Scan Results</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scanResults.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.status === "SUCCESS"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex-1">
                  <p className={`font-mono font-bold ${result.status === "SUCCESS" ? "text-green-700" : "text-red-700"}`}>
                    {result.cn}
                  </p>
                  {result.error && <p className="text-xs text-red-600">{result.error}</p>}
                </div>
                <div className="text-xs text-slate-600">{result.time}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600 text-center">
            Total Scanned: {scanResults.filter((r) => r.status === "SUCCESS").length} ✓ | 
            Failed: {scanResults.filter((r) => r.status === "FAILED").length} ✗
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
          <li><strong>CRITICAL OPERATION:</strong> If shipment is not in-scanned, it's considered lost</li>
          <li>Scan only shipments with MANIFESTED status</li>
          <li>Verify hub is correct before scanning</li>
          <li>Device ID helps track which scanner was used</li>
          <li>Each CN can only be scanned once per hub</li>
        </ul>
      </div>
    </div>
  );
}
