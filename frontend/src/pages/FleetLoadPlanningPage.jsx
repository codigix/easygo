import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { MapContainer, Marker, Polyline as LeafletPolyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPinned,
  Navigation,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { fleetService } from "../services/fleetService";

const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = "© OpenStreetMap contributors";
const DEFAULT_CENTER = [20.5937, 78.9629];

const vehicleIcon = L.divIcon({
  html: `<div style="width:32px;height:32px;border-radius:999px;background:#059669;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 10px 25px rgba(5,150,105,0.35)">🚚</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function FleetLoadPlanningPage() {
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({ routes: [], vehicles: [], drivers: [], shipments: [], insights: null });
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [notes, setNotes] = useState("");
  const [activePlan, setActivePlan] = useState(null);
  const [loadPlans, setLoadPlans] = useState([]);
  const [bootstrappedRoute, setBootstrappedRoute] = useState(false);
  const [loading, setLoading] = useState({ options: true, loads: true, dispatch: false });
  const [error, setError] = useState("");

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!bootstrappedRoute && options.routes.length) {
      const firstRoute = options.routes[0];
      setSelectedRouteId(firstRoute.id);
      setBootstrappedRoute(true);
      loadOptions(firstRoute.id);
    }
  }, [options.routes, bootstrappedRoute]);

  useEffect(() => {
    if (options.vehicles.length && !selectedVehicleId) {
      setSelectedVehicleId(options.vehicles[0].id);
    }
  }, [options.vehicles, selectedVehicleId]);

  useEffect(() => {
    if (options.drivers.length && !selectedDriverId) {
      setSelectedDriverId(options.drivers[0].id);
    }
  }, [options.drivers, selectedDriverId]);

  const refreshAll = async () => {
    setLoading((prev) => ({ ...prev, options: true, loads: true }));
    try {
      await Promise.all([loadSummary(), loadOptions(), loadLoadPlans()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load planning data");
    } finally {
      setLoading((prev) => ({ ...prev, options: false, loads: false }));
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

  const loadOptions = async (routeId) => {
    try {
      const response = await fleetService.getLoadPlanningOptions(routeId);
      if (response?.success) {
        const nextOptions = {
          routes: response.data?.routes || [],
          vehicles: response.data?.vehicles || [],
          drivers: response.data?.drivers || [],
          shipments: response.data?.shipments || [],
          insights: response.data?.insights || null,
        };
        setOptions(nextOptions);
        if (routeId) {
          setSelectedShipmentIds([]);
        }
        if (nextOptions.insights?.suggested_vehicle_id) {
          setSelectedVehicleId((current) => current || Number(nextOptions.insights.suggested_vehicle_id));
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch planning options");
    }
  };

  const loadLoadPlans = async () => {
    try {
      const response = await fleetService.getLoadPlans();
      if (response?.success) {
        const plans = response.data || [];
        setLoadPlans(plans);
        const live = plans.find((plan) => plan.status === "DISPATCHED");
        if (live) {
          try {
            const detail = await fleetService.getLoadPlanDetail(live.id);
            setActivePlan(detail?.success ? detail.data : live);
          } catch (detailError) {
            console.error(detailError);
            setActivePlan(live);
          }
        } else {
          setActivePlan(null);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch load plans");
    }
  };

  const handleRouteChange = async (event) => {
    const routeId = Number(event.target.value);
    setSelectedRouteId(routeId);
    await loadOptions(routeId);
  };

  const toggleShipment = (shipmentId) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(shipmentId) ? prev.filter((id) => id !== shipmentId) : [...prev, shipmentId]
    );
  };

  const selectedRoute = useMemo(
    () => options.routes.find((route) => route.id === selectedRouteId),
    [options.routes, selectedRouteId]
  );
  const selectedVehicle = useMemo(
    () => options.vehicles.find((vehicle) => vehicle.id === selectedVehicleId),
    [options.vehicles, selectedVehicleId]
  );
  const selectedDriver = useMemo(
    () => options.drivers.find((driver) => driver.id === selectedDriverId),
    [options.drivers, selectedDriverId]
  );
  const selectedShipments = useMemo(
    () => options.shipments.filter((shipment) => selectedShipmentIds.includes(shipment.id)),
    [options.shipments, selectedShipmentIds]
  );

  const totalWeight = selectedShipments.reduce((sum, shipment) => sum + (Number(shipment.weight) || 0), 0);
  const vehicleCapacity = Number(selectedVehicle?.capacity_kg || 0);
  const utilization = vehicleCapacity ? Math.min(100, (totalWeight / vehicleCapacity) * 100) : 0;

  const canDispatch =
    selectedRoute &&
    selectedVehicle &&
    selectedDriver &&
    selectedShipmentIds.length > 0 &&
    totalWeight > 0 &&
    totalWeight <= vehicleCapacity &&
    !loading.dispatch;

  const handleDispatch = async () => {
    if (!canDispatch) {
      return;
    }
    setLoading((prev) => ({ ...prev, dispatch: true }));
    setError("");
    try {
      const response = await fleetService.createLoadPlan({
        route_id: selectedRouteId,
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId,
        shipment_ids: selectedShipmentIds,
        notes,
      });
      if (response?.success) {
        setActivePlan(response.data);
        setSelectedShipmentIds([]);
        setNotes("");
        await Promise.all([loadSummary(), loadOptions(selectedRouteId), loadLoadPlans()]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to dispatch load");
    } finally {
      setLoading((prev) => ({ ...prev, dispatch: false }));
    }
  };

  const handleComplete = async () => {
    if (!activePlan) {
      return;
    }
    try {
      const lastPoint = (activePlan.route?.polyline || [])[activePlan.route?.polyline?.length - 1] || null;
      const payload = lastPoint ? { lat: lastPoint[0], lng: lastPoint[1] } : {};
      const response = await fleetService.completeLoadPlan(activePlan.id, payload);
      if (response?.success) {
        setActivePlan(response.data);
        await Promise.all([loadSummary(), loadOptions(selectedRouteId), loadLoadPlans()]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to complete load");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Planning</h1>
          <p className="text-slate-600">Connect shipments, vehicles, drivers, and smart routes in one motion.</p>
        </div>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <PlanStatCard label="Available Vehicles" value={summary?.vehicles?.available || 0} hint="Ready for dispatch" />
        <PlanStatCard label="Available Drivers" value={summary?.drivers?.available || 0} hint="Cleared to drive" />
        <PlanStatCard label="Manifested Shipments" value={summary?.shipments_ready || 0} hint="Ready for hub-out" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4 rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Plan Load</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Route</label>
              <select
                value={selectedRouteId || ""}
                onChange={handleRouteChange}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              >
                {options.routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.route_code} ({route.origin_hub} → {route.destination_hub})
                  </option>
                ))}
              </select>
              {selectedRoute && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedRoute.distance_km || 0} km • {selectedRoute.expected_time_hours || 0} hrs • {selectedRoute.via_hubs?.length || 0} via hubs
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Vehicle</label>
                <select
                  value={selectedVehicleId || ""}
                  onChange={(event) => setSelectedVehicleId(Number(event.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  {options.vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} ({Number(vehicle.capacity_kg || 0).toFixed(0)} kg)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Driver</label>
                <select
                  value={selectedDriverId || ""}
                  onChange={(event) => setSelectedDriverId(Number(event.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  {options.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {options.insights && (
            <InsightsPanel
              insights={options.insights}
              onApply={() =>
                options.insights?.suggested_vehicle_id &&
                setSelectedVehicleId(Number(options.insights.suggested_vehicle_id))
              }
            />
          )}

          <div className="rounded-lg border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Manifested Shipments</h3>
                <p className="text-xs text-slate-500">Select consignments bound for the same destination hub</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Selected Weight</p>
                <p className="font-semibold text-slate-900">{totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {options.shipments.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No manifested shipments for this route</p>
              ) : (
                options.shipments.map((shipment) => (
                  <label key={shipment.id} className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedShipmentIds.includes(shipment.id)}
                        onChange={() => toggleShipment(shipment.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{shipment.shipment_cn}</p>
                        <p className="text-xs text-slate-500">
                          {shipment.receiver_city}, {shipment.receiver_state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{Number(shipment.weight || 0).toFixed(2)} kg</p>
                      <p>{shipment.status}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-xs uppercase text-slate-500">Capacity Utilization</p>
              <div className="mt-2">
                <div className="h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${utilization > 100 ? "bg-rose-500" : "bg-emerald-600"}`} style={{ width: `${Math.min(utilization, 120)}%` }}></div>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {totalWeight.toFixed(2)} kg of {vehicleCapacity.toFixed(2)} kg ({utilization.toFixed(1)}%)
                </p>
              </div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Dispatcher notes"
                className="mt-3 h-20 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border border-slate-100 p-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-emerald-600" />
                <span>{selectedVehicle?.vehicle_number || "Select vehicle"}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>{selectedDriver?.name || "Select driver"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-emerald-600" />
                <span>{selectedShipmentIds.length} shipments selected</span>
              </div>
              {selectedRoute && (
                <div className="flex items-center gap-2">
                  <MapPinned size={16} className="text-emerald-600" />
                  <span>
                    {selectedRoute.origin_hub} → {selectedRoute.destination_hub}
                  </span>
                </div>
              )}
              <button
                onClick={handleDispatch}
                disabled={!canDispatch}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading.dispatch ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />} Dispatch Load
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Live Load</h2>
          {activePlan ? (
            <ActiveLoadPanel plan={activePlan} onComplete={handleComplete} />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded border border-dashed border-emerald-200 bg-emerald-50 text-sm text-slate-500">
              No live load in transit
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Loads</h2>
          <p className="text-xs text-slate-500">Last {loadPlans.length} plans</p>
        </div>
        <div className="overflow-x-auto">
          {loading.loads ? (
            <div className="py-10 text-center text-slate-500">Loading load plans...</div>
          ) : loadPlans.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No load plans created yet</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="pb-2">Load</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Vehicle</th>
                  <th className="pb-2">Shipments</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadPlans.slice(0, 5).map((plan) => (
                  <tr key={plan.id} className="text-slate-700">
                    <td className="py-2 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {plan.load_number}
                        {plan.route_deviation?.detected && (
                          <AlertTriangle className="text-amber-600" size={14} title="Route deviation detected" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {plan.route.origin_hub} → {plan.route.destination_hub}
                    </td>
                    <td className="py-2">{plan.vehicle.vehicle_number}</td>
                    <td className="py-2">{plan.total_shipments}</td>
                    <td className="py-2">{Number(plan.total_weight || 0).toFixed(2)} kg</td>
                    <td className="py-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(plan.status)}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {plan.dispatched_at ? dayjs(plan.dispatched_at).format("DD MMM HH:mm") : "—"} → {plan.completed_at ? dayjs(plan.completed_at).format("DD MMM HH:mm") : "—"}
                      {plan.status === "COMPLETED" && (
                        <span className="mt-1 block text-[11px] uppercase text-emerald-600">
                          via {plan.completion_source || "MANUAL"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ insights, onApply }) {
  if (!insights) {
    return null;
  }
  const utilization = Number(insights.utilization_percent ?? 0);
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="flex items-center gap-2 font-semibold text-emerald-700">
        <Sparkles size={16} />
        <span>AI Suggestions</span>
      </div>
      <p className="mt-1 text-xs text-emerald-700">{insights.advisory}</p>
      <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-emerald-600 uppercase">Vehicle</p>
          <p className="text-base font-semibold">
            {insights.suggested_vehicle_number || "Not available"}
          </p>
        </div>
        <div>
          <p className="text-emerald-600 uppercase">Utilization</p>
          <p className="text-base font-semibold">{utilization.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-emerald-600 uppercase">Manifest Weight</p>
          <p className="text-base font-semibold">{Number(insights.total_manifest_weight || 0).toFixed(2)} kg</p>
        </div>
      </div>
      {insights.under_utilized && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
          <AlertTriangle size={12} />
          <span>Load is underutilized, consider adding more shipments.</span>
        </div>
      )}
      {insights.suggested_vehicle_id && (
        <button
          type="button"
          onClick={onApply}
          className="mt-3 inline-flex items-center gap-2 rounded border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Apply Recommendation
        </button>
      )}
    </div>
  );
}

function PlanStatCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function ActiveLoadPanel({ plan, onComplete }) {
  const positions = plan.route?.polyline || [];
  const live = plan.live_location;
  const markerPosition = live?.lat && live?.lng ? [live.lat, live.lng] : positions[0] || DEFAULT_CENTER;
  const progress = live?.percent_complete ?? plan.metrics?.progress_percent ?? 0;
  const routeDeviation = plan.route_deviation;

  return (
    <div className="space-y-4">
      {routeDeviation?.detected && (
        <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle size={12} />
          <span>Route deviation {Number(routeDeviation.distance_km || 0).toFixed(2)} km detected</span>
        </div>
      )}
      <div className="rounded border border-slate-100 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase text-slate-500">Load Number</p>
            <p className="font-semibold text-slate-900">{plan.load_number}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(plan.status)}`}>{plan.status}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {plan.route?.origin_hub} → {plan.route?.destination_hub}
        </p>
        {plan.status === "COMPLETED" && (
          <p className="text-[11px] uppercase text-slate-400">Completed via {plan.completion_source || "MANUAL"}</p>
        )}
        <div className="mt-3 text-xs text-slate-500">
          <p>
            Vehicle: <span className="font-semibold text-slate-900">{plan.vehicle?.vehicle_number}</span>
          </p>
          <p>
            Driver: <span className="font-semibold text-slate-900">{plan.driver?.name}</span>
          </p>
          <p>
            Shipments: <span className="font-semibold text-slate-900">{plan.total_shipments}</span>
          </p>
        </div>
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-emerald-100">
        {positions.length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Route geometry unavailable</div>
        ) : (
          <MapContainer center={markerPosition} zoom={6} className="h-full w-full" zoomControl={false}>
            <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} />
            <LeafletPolyline positions={positions} pathOptions={{ color: "#059669", weight: 5, opacity: 0.85 }} />
            {plan.route?.via_hubs?.map((hub, index) => (
              <Marker key={`${hub.name}-${index}`} position={[hub.lat, hub.lng]} icon={L.divIcon({ className: "", html: `<div style="width:8px;height:8px;border-radius:999px;background:#0f172a"></div>` })} />
            ))}
            <Marker position={markerPosition} icon={vehicleIcon} />
            <MapAutoFit positions={positions} livePosition={markerPosition} />
          </MapContainer>
        )}
      </div>
      <div>
        <div className="relative h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Origin</span>
          <span>{progress.toFixed(0)}%</span>
          <span>Destination</span>
        </div>
      </div>
      <button
        onClick={onComplete}
        disabled={plan.status !== "DISPATCHED"}
        className="flex w-full items-center justify-center gap-2 rounded border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        <CheckCircle2 size={16} /> Mark Completed
      </button>
    </div>
  );
}

function MapAutoFit({ positions, livePosition }) {
  const map = useMap();
  useEffect(() => {
    if (!map) {
      return;
    }
    if (livePosition) {
      map.flyTo(livePosition, Math.min(10, Math.max(map.getZoom(), 7)), { duration: 0.8 });
      return;
    }
    if (positions?.length) {
      map.fitBounds(positions);
    }
  }, [map, positions, livePosition]);
  return null;
}

const statusStyle = (status) => {
  if (status === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "DISPATCHED") {
    return "bg-sky-100 text-sky-700";
  }
  if (status === "PLANNED") {
    return "bg-slate-100 text-slate-600";
  }
  if (status === "CANCELLED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-100 text-slate-600";
};
