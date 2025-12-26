import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Map, Pencil, Plus, RefreshCcw, Route, Save } from "lucide-react";
import { fleetService } from "../services/fleetService";

const HUBS = [
  { key: "PUNE", label: "Pune", lat: 18.5204, lng: 73.8567 },
  { key: "MUMBAI", label: "Mumbai", lat: 19.076, lng: 72.8777 },
  { key: "DELHI", label: "Delhi", lat: 28.6139, lng: 77.209 },
  { key: "BANGALORE", label: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { key: "KOLHAPUR", label: "Kolhapur", lat: 16.7049, lng: 74.2433 },
  { key: "BELAGAVI", label: "Belagavi", lat: 15.8497, lng: 74.4977 },
  { key: "HUBLI", label: "Hubli", lat: 15.3647, lng: 75.124 },
  { key: "SATARA", label: "Satara", lat: 17.6806, lng: 73.9934 },
  { key: "HYDERABAD", label: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { key: "CHENNAI", label: "Chennai", lat: 13.0827, lng: 80.2707 },
];
const HUB_LOOKUP = HUBS.reduce((acc, hub) => {
  acc[hub.key] = hub;
  return acc;
}, {});

const encodePolyline = (points) => {
  if (!points || !points.length) {
    return "";
  }
  let lastLat = 0;
  let lastLng = 0;
  return points
    .map(([lat, lng]) => {
      const roundedLat = Math.round(lat * 1e5);
      const roundedLng = Math.round(lng * 1e5);
      const deltaLat = roundedLat - lastLat;
      const deltaLng = roundedLng - lastLng;
      lastLat = roundedLat;
      lastLng = roundedLng;
      return encodeValue(deltaLat) + encodeValue(deltaLng);
    })
    .join("");
};

const encodeValue = (value) => {
  let current = value << 1;
  if (value < 0) {
    current = ~current;
  }
  let output = "";
  while (current >= 0x20) {
    output += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
    current >>= 5;
  }
  output += String.fromCharCode(current + 63);
  return output;
};

const defaultForm = {
  route_code: "",
  origin_key: "PUNE",
  destination_key: "BANGALORE",
  via_keys: ["SATARA", "KOLHAPUR", "BELAGAVI"],
  distance_km: "840",
  expected_time_hours: "16",
  is_active: true,
};

export default function FleetRoutesMasterPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingRouteId, setEditingRouteId] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await fleetService.getRoutes();
      if (response?.success) {
        setRoutes(response.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: type === "checkbox" ? checked : value }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVia = (key) => {
    setForm((prev) => {
      const via = prev.via_keys.includes(key)
        ? prev.via_keys.filter((item) => item !== key)
        : [...prev.via_keys, key];
      return { ...prev, via_keys: via };
    });
  };

  const startEdit = (route) => {
    const originKey = findHubKey(route.origin_hub);
    const destinationKey = findHubKey(route.destination_hub);
    const viaKeys = (route.via_hubs || []).map((hub) => findHubKey(hub.name)).filter(Boolean);
    setForm({
      route_code: route.route_code,
      origin_key: originKey || "PUNE",
      destination_key: destinationKey || "BANGALORE",
      via_keys: viaKeys,
      distance_km: route.distance_km || "",
      expected_time_hours: route.expected_time_hours || "",
      is_active: route.is_active,
    });
    setEditingRouteId(route.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const origin = HUB_LOOKUP[form.origin_key];
      const destination = HUB_LOOKUP[form.destination_key];
      if (!origin || !destination) {
        throw new Error("Select valid origin and destination hubs");
      }
      const waypoints = [origin, ...form.via_keys.map((key) => HUB_LOOKUP[key]).filter(Boolean), destination];
      if (waypoints.length < 2) {
        throw new Error("Provide at least origin and destination");
      }
      const encoded_polyline = encodePolyline(waypoints.map((hub) => [hub.lat, hub.lng]));
      const via_hubs = waypoints.slice(1, -1).map((hub) => ({ name: hub.label, lat: hub.lat, lng: hub.lng }));
      const payload = {
        route_code: form.route_code,
        origin_hub: origin.label,
        destination_hub: destination.label,
        via_hubs,
        distance_km: Number(form.distance_km) || 0,
        expected_time_hours: Number(form.expected_time_hours) || 0,
        encoded_polyline,
        is_active: form.is_active,
      };
      if (!payload.route_code) {
        throw new Error("Route code is required");
      }
      if (editingRouteId) {
        await fleetService.updateRoute(editingRouteId, payload);
      } else {
        await fleetService.createRoute(payload);
      }
      setForm(defaultForm);
      setEditingRouteId(null);
      await loadRoutes();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to save route");
    } finally {
      setSaving(false);
    }
  };

  const routeStats = useMemo(() => {
    if (!routes.length) {
      return { active: 0, totalDistance: 0 };
    }
    const active = routes.filter((route) => route.is_active).length;
    const totalDistance = routes.reduce((sum, route) => sum + (Number(route.distance_km) || 0), 0);
    return { active, totalDistance };
  }, [routes]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Route Master</h1>
          <p className="text-slate-600">Reusable linehaul corridors for load planning and live tracking.</p>
        </div>
        <button
          onClick={loadRoutes}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <RouteStatCard icon={<Route size={16} />} label="Active Routes" value={routeStats.active} hint="Ready for planning" />
        <RouteStatCard icon={<ArrowLeftRight size={16} />} label="Cumulative Distance" value={`${routeStats.totalDistance.toFixed(0)} km`} hint="Network coverage" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Map size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Corridor Library</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Loading routes...</div>
            ) : routes.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No routes configured yet</div>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{route.route_code}</p>
                      <p className="text-xs text-slate-500">
                        {route.origin_hub} → {route.destination_hub}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          route.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {route.is_active ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => startEdit(route)}
                        className="rounded border border-slate-200 p-2 text-slate-600 hover:text-slate-900"
                        title="Edit route"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                    <div>
                      <p className="text-slate-500">Distance</p>
                      <p className="font-semibold text-slate-900">{Number(route.distance_km || 0).toFixed(0)} km</p>
                    </div>
                    <div>
                      <p className="text-slate-500">ETA</p>
                      <p className="font-semibold text-slate-900">{route.expected_time_hours || 0} hrs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Via Hubs</p>
                      <p className="font-semibold text-slate-900">
                        {(route.via_hubs || []).length ? (route.via_hubs || []).map((hub) => hub.name).join(", ") : "Direct"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {editingRouteId ? <Save size={18} className="text-emerald-600" /> : <Plus size={18} className="text-emerald-600" />}
            <h2 className="text-lg font-semibold text-slate-900">{editingRouteId ? "Update Route" : "Create Route"}</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Route Code</label>
              <input
                name="route_code"
                value={form.route_code}
                onChange={handleFormChange}
                placeholder="PUN-BLR"
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Origin" name="origin_key" value={form.origin_key} onChange={handleFormChange} />
              <SelectField label="Destination" name="destination_key" value={form.destination_key} onChange={handleFormChange} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Via Hubs</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {HUBS.filter((hub) => hub.key !== form.origin_key && hub.key !== form.destination_key).map((hub) => (
                  <button
                    type="button"
                    key={hub.key}
                    onClick={() => toggleVia(hub.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      form.via_keys.includes(hub.key) ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {hub.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Distance (km)</label>
                <input
                  type="number"
                  name="distance_km"
                  value={form.distance_km}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">ETA (hours)</label>
                <input
                  type="number"
                  name="expected_time_hours"
                  value={form.expected_time_hours}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Route live for planning
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingRouteId ? "Update Route" : "Create Route"}
              </button>
              {editingRouteId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRouteId(null);
                    setForm(defaultForm);
                  }}
                  className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-slate-500">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
      >
        {HUBS.map((hub) => (
          <option key={hub.key} value={hub.key}>
            {hub.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RouteStatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</div>
        <div>
          <p className="text-xs uppercase text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}

const findHubKey = (label) => {
  if (!label) {
    return null;
  }
  const normalized = label.trim().toUpperCase();
  const match = HUBS.find((hub) => hub.label.toUpperCase() === normalized || hub.key === normalized);
  return match ? match.key : null;
};
