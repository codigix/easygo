import React, { useEffect, useMemo, useState } from "react";
import { Gauge, LocateFixed, Plus, RefreshCcw, Wrench, Zap } from "lucide-react";
import { fleetService } from "../services/fleetService";

const VEHICLE_TYPES = ["BIKE", "VAN", "TRUCK", "TEMPO", "LTL"];
const FUEL_TYPES = ["DIESEL", "PETROL", "EV", "CNG"];
const STATUS_STYLES = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  IN_TRANSIT: "bg-sky-100 text-sky-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    vehicle_number: "",
    vehicle_type: "TRUCK",
    capacity_kg: "",
    volume_cuft: "",
    fuel_type: "DIESEL",
    gps_device_id: "",
    current_hub: "",
  });

  useEffect(() => {
    loadVehicles();
    loadSummary();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await fleetService.getVehicles();
      if (response?.success) {
        setVehicles(response.data.vehicles || []);
        setStats(response.data.stats || {});
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fleetService.getSummary();
      if (response?.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      vehicle_number: "",
      vehicle_type: "TRUCK",
      capacity_kg: "",
      volume_cuft: "",
      fuel_type: "DIESEL",
      gps_device_id: "",
      current_hub: "",
    });
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();
    if (!form.vehicle_number) {
      setError("Vehicle number is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await fleetService.createVehicle({
        ...form,
        capacity_kg: Number(form.capacity_kg) || 0,
        volume_cuft: Number(form.volume_cuft) || 0,
      });
      resetForm();
      await Promise.all([loadVehicles(), loadSummary()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (vehicleId, status) => {
    try {
      await fleetService.updateVehicleStatus(vehicleId, status);
      await loadVehicles();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update vehicle status");
    }
  };

  const capacityMetrics = useMemo(() => {
    if (!vehicles.length) {
      return { capacity: 0, deployed: 0 };
    }
    const capacity = vehicles.reduce((sum, v) => sum + (Number(v.capacity_kg) || 0), 0);
    const deployed = vehicles
      .filter((v) => v.status === "IN_TRANSIT")
      .reduce((sum, v) => sum + (Number(v.capacity_kg) || 0), 0);
    return { capacity, deployed };
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet Vehicles</h1>
          <p className="text-slate-600">Inventory, telemetry, and readiness for load planning.</p>
        </div>
        <button
          onClick={loadVehicles}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Gauge className="text-emerald-600" size={18} />}
          label="Available"
          value={stats.AVAILABLE || 0}
          hint="Ready for dispatch"
        />
        <StatCard
          icon={<Zap className="text-sky-600" size={18} />}
          label="In Transit"
          value={stats.IN_TRANSIT || 0}
          hint="Live loads"
        />
        <StatCard
          icon={<Wrench className="text-amber-600" size={18} />}
          label="Maintenance"
          value={stats.MAINTENANCE || 0}
          hint="Workshop queue"
        />
        <StatCard
          icon={<LocateFixed className="text-slate-600" size={18} />}
          label="Hub Ready"
          value={summary?.shipments_ready || 0}
          hint="Manifested shipments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Fleet Inventory</h2>
              <p className="text-sm text-slate-500">Telemetry-ready vehicles with assignment controls</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Total Capacity</p>
              <p className="font-semibold text-slate-900">{capacityMetrics.capacity.toFixed(0)} kg</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No vehicles registered yet</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Capacity</th>
                    <th className="pb-2">Fuel</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Hub</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="text-slate-700">
                      <td className="py-3">
                        <p className="font-semibold text-slate-900">{vehicle.vehicle_number}</p>
                        <p className="text-xs text-slate-500">GPS {vehicle.gps_device_id || "—"}</p>
                      </td>
                      <td className="py-3">{vehicle.vehicle_type}</td>
                      <td className="py-3">{Number(vehicle.capacity_kg || 0).toFixed(0)} kg</td>
                      <td className="py-3">{vehicle.fuel_type}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[vehicle.status] || "bg-slate-100 text-slate-600"}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-3">{vehicle.current_hub || "—"}</td>
                      <td className="py-3 text-right">
                        <select
                          value={vehicle.status}
                          onChange={(event) => handleStatusChange(vehicle.id, event.target.value)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs"
                        >
                          {Object.keys(STATUS_STYLES).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Register Vehicle</h2>
          </div>
          <form className="space-y-4" onSubmit={handleCreateVehicle}>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Vehicle Number</label>
              <input
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={handleFormChange}
                placeholder="MH-01-0009"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Type</label>
                <select
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Fuel</label>
                <select
                  name="fuel_type"
                  value={form.fuel_type}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  {FUEL_TYPES.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Capacity (kg)</label>
                <input
                  type="number"
                  name="capacity_kg"
                  value={form.capacity_kg}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Volume (cu.ft)</label>
                <input
                  type="number"
                  name="volume_cuft"
                  value={form.volume_cuft}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Current Hub</label>
              <input
                name="current_hub"
                value={form.current_hub}
                onChange={handleFormChange}
                placeholder="Pune Hub"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">GPS Device ID</label>
              <input
                name="gps_device_id"
                value={form.gps_device_id}
                onChange={handleFormChange}
                placeholder="GPS-AX78"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? "Saving..." : "Add Vehicle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">{icon}</div>
        <div>
          <p className="text-xs uppercase text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
