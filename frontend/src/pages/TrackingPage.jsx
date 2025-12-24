import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  AlertCircle,
  CheckCircle,
  Clock4,
  MapPin,
  Navigation2,
  Radio,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";
import { MapContainer, TileLayer, Polyline as LeafletPolyline, Marker, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trackingService } from "../services/trackingService";

const statusStyles = {
  CREATED: "bg-slate-100 text-slate-700",
  MANIFESTED: "bg-blue-100 text-blue-700",
  HUB_IN_SCAN: "bg-indigo-100 text-indigo-700",
  HUB_OUT_SCAN: "bg-sky-100 text-sky-700",
  IN_TRANSIT: "bg-amber-100 text-amber-700",
  OUT_FOR_DELIVERY: "bg-emerald-100 text-emerald-700",
  DELIVERED: "bg-emerald-600 text-white",
  RTO: "bg-rose-100 text-rose-700",
};

const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = "© OpenStreetMap contributors";
const DEFAULT_CENTER = [20.5937, 78.9629];

const createVehicleIcon = (bearing = 0) =>
  L.divIcon({
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#059669;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 10px 25px rgba(5,150,105,0.35);transform:rotate(${bearing}deg);">🚚</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const formatDateTime = (value) => (value ? dayjs(value).format("DD MMM, hh:mm A") : "—");
const formatDateShort = (value) => (value ? dayjs(value).format("DD MMM YYYY") : "—");
const formatDistance = (value) =>
  typeof value === "number" && !Number.isNaN(value) ? `${value.toFixed(1)} km` : "—";
const maskPhone = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
};

export default function TrackingPage() {
  const [search, setSearch] = useState("");
  const [activeCN, setActiveCN] = useState("");
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const shipment = tracking?.shipment;
  const route = tracking?.route;
  const liveLocation = tracking?.live_location;
  const timeline = tracking?.timeline || [];
  const metrics = tracking?.metrics;

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!activeCN) return undefined;
    const interval = setInterval(() => {
      handleLiveRefresh(activeCN, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeCN]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!search.trim()) {
      setError("Enter a CN or AWB number");
      return;
    }
    fetchTracking(search.trim());
  };

  const fetchTracking = async (consignment) => {
    setLoading(true);
    setError("");
    try {
      const response = await trackingService.getShipmentTracking(consignment);
      if (!response?.data) {
        setTracking(null);
        throw new Error("Missing tracking payload");
      }
      setTracking(response.data);
      setActiveCN(consignment);
    } catch (err) {
      setTracking(null);
      setActiveCN("");
      setError(err?.response?.data?.message || "Unable to fetch tracking data");
    } finally {
      setLoading(false);
    }
  };

  const handleLiveRefresh = async (consignment, silent = false) => {
    if (!consignment) return;
    if (!silent) {
      setRefreshing(true);
      setError("");
    }
    try {
      const response = await trackingService.getShipmentLive(consignment);
      if (response?.data) {
        setTracking((prev) =>
          prev
            ? {
                ...prev,
                live_location: response.data.live_location,
                metrics: response.data.metrics,
                route: response.data.route || prev.route,
              }
            : prev
        );
      }
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || "Unable to refresh live tracking");
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  const progress = useMemo(() => {
    if (!liveLocation?.percent_complete && liveLocation?.percent_complete !== 0) return 0;
    return Math.min(100, Math.max(0, liveLocation.percent_complete));
  }, [liveLocation]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
          <p className="text-slate-600">Map-grade GPS telemetry, hub scans, and delivery health in one view.</p>
        </div>
        <button
          onClick={() => handleLiveRefresh(activeCN)}
          disabled={!activeCN || refreshing}
          className="inline-flex items-center gap-2 rounded border border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : undefined} /> Live Refresh
        </button>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Consignment / AWB Number</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded border border-slate-300 py-2 pl-10 pr-3 text-slate-900"
                placeholder="Enter CN-XXXXXXXX"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Track Shipment
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-emerald-200 bg-white p-10 text-center text-slate-600">
          Fetching live tracking data...
        </div>
      ) : !tracking ? (
        <div className="rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-10 text-center text-slate-500">
          Enter a consignment number to visualize the end-to-end journey.
        </div>
      ) : (
        <div className="space-y-6">
          <ShipmentSummary shipment={shipment} metrics={metrics} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveRouteMap route={route} liveLocation={liveLocation} progress={progress} mapReady={mapReady} />
            </div>
            <TimelinePanel timeline={timeline} />
          </div>

          <LiveInsights shipment={shipment} liveLocation={liveLocation} metrics={metrics} route={route} />
        </div>
      )}
    </div>
  );
}

function ShipmentSummary({ shipment, metrics }) {
  if (!shipment) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Consignment</p>
          <p className="text-2xl font-semibold text-slate-900">{shipment.shipment_cn}</p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryItem label="Service" value={shipment.service_type} />
        <SummaryItem label="Weight" value={`${Number(shipment.weight || 0).toFixed(2)} kg`} />
        <SummaryItem
          label="From"
          value={`${shipment.sender?.city || "—"}, ${shipment.sender?.state || "—"}`}
          hint={shipment.sender?.pincode}
        />
        <SummaryItem
          label="To"
          value={`${shipment.receiver?.city || "—"}, ${shipment.receiver?.state || "—"}`}
          hint={shipment.receiver?.pincode}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryItem label="Created" value={formatDateShort(shipment.created_at)} />
        <SummaryItem label="Estimated Delivery" value={formatDateShort(metrics?.eta || shipment.estimated_delivery)} />
        <SummaryItem label="Progress" value={`${metrics?.percent_complete ?? 0}%`} />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, hint }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value || "—"}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-200 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${style}`}>
      {status}
    </span>
  );
}

function LiveRouteMap({ route, liveLocation, progress, mapReady }) {
  const positions = route?.polyline || [];
  const checkpoints = route?.checkpoints || [];
  const livePosition =
    liveLocation?.lat && liveLocation?.lng ? [liveLocation.lat, liveLocation.lng] : positions[positions.length - 1];
  const vehicleIcon = useMemo(() => createVehicleIcon(liveLocation?.bearing || 0), [liveLocation?.bearing]);

  return (
    <div className="h-full rounded-lg border border-emerald-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
        <span className="inline-flex items-center gap-2">
          <Navigation2 size={16} /> Live Route Map
        </span>
        <span className="text-emerald-700">ETA {formatDateTime(liveLocation?.eta)}</span>
      </div>
      <div className="h-80 overflow-hidden rounded-2xl border border-emerald-100 bg-slate-100">
        {!mapReady ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-600">Loading map tiles...</div>
        ) : positions.length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-600">
            Insufficient waypoints to plot this corridor.
          </div>
        ) : (
          <MapContainer center={livePosition || DEFAULT_CENTER} zoom={6} className="h-full w-full" zoomControl={false}>
            <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} />
            <LeafletPolyline positions={positions} pathOptions={{ color: "#059669", weight: 5, opacity: 0.85 }} />
            {checkpoints.map((checkpoint) => (
              <CircleMarker
                key={checkpoint.key}
                center={[checkpoint.lat, checkpoint.lng]}
                radius={checkpoint.type === "checkpoint" ? 5 : 7}
                pathOptions={{
                  color: checkpoint.type === "destination" ? "#0f172a" : "#059669",
                  weight: 2,
                  fillColor: checkpoint.type === "destination" ? "#0f172a" : "#059669",
                  fillOpacity: 0.9,
                }}
              />
            ))}
            {liveLocation?.lat && liveLocation?.lng && <Marker position={livePosition} icon={vehicleIcon}></Marker>}
            <MapAutoFit positions={positions} livePosition={livePosition} />
          </MapContainer>
        )}
      </div>
      <div className="space-y-2">
        <div className="relative h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }}></div>
          <div className="absolute -top-3" style={{ left: `calc(${progress}% - 18px)` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
              <Truck size={16} />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Origin</span>
          <span>{progress}%</span>
          <span>Destination</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-600">
        <div>
          <p className="text-xs uppercase text-slate-500">Current Leg</p>
          <p className="font-semibold text-slate-900">{liveLocation?.label || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Distance Remaining</p>
          <p className="font-semibold text-slate-900">{formatDistance(liveLocation?.distance_remaining_km)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Avg Speed</p>
          <p className="font-semibold text-slate-900">
            {liveLocation?.speed_kmph ? `${liveLocation.speed_kmph} km/h` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MapAutoFit({ positions, livePosition }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (livePosition) {
      map.flyTo(livePosition, Math.min(12, Math.max(map.getZoom(), 8)), { duration: 0.8 });
      return;
    }
    if (positions?.length) {
      map.fitBounds(positions);
    }
  }, [positions, livePosition, map]);
  return null;
}

function TimelinePanel({ timeline }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm space-y-4">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Clock4 size={16} /> Journey Timeline
      </div>
      <div className="space-y-4">
        {timeline.length === 0 && <p className="text-sm text-slate-500">No tracking events recorded yet.</p>}
        {timeline.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <EventIcon state={event.state} />
              <div className="mt-1 h-full w-px bg-slate-200"></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{event.label}</p>
              <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
              {event.hub?.name && <p className="text-xs text-slate-500">{event.hub.name}</p>}
              {event.description && <p className="text-xs text-slate-500">{event.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventIcon({ state }) {
  if (state === "done") {
    return <CheckCircle size={18} className="text-emerald-600" />;
  }
  if (state === "current") {
    return <Radio size={18} className="text-amber-500" />;
  }
  return <MapPin size={18} className="text-slate-300" />;
}

function LiveInsights({ shipment, liveLocation, metrics, route }) {
  const assignment = shipment?.assignment;
  const corridor = (route?.checkpoints || [])
    .filter((checkpoint) => checkpoint.type !== "current")
    .map((checkpoint) => checkpoint.label)
    .filter(Boolean)
    .join(" • ");

  const cards = [
    { label: "Current Status", value: shipment?.status },
    { label: "Current Leg", value: liveLocation?.label || "—" },
    { label: "ETA", value: formatDateTime(metrics?.eta || liveLocation?.eta) },
    { label: "Progress", value: `${metrics?.percent_complete ?? 0}%` },
    { label: "Distance Remaining", value: formatDistance(metrics?.distance_remaining_km) },
    { label: "Distance Covered", value: formatDistance(metrics?.distance_travelled_km) },
    { label: "Route Corridor", value: corridor || assignment?.route_name || assignment?.route_code || "—" },
    { label: "Delivery Partner", value: assignment?.delivery_executive_name || "—", hint: maskPhone(assignment?.delivery_executive_phone) },
    { label: "Vehicle", value: assignment?.vehicle_number || "—" },
  ];

  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label}>
            <p className="text-xs uppercase text-slate-500">{card.label}</p>
            <p className="text-sm font-semibold text-slate-900">{card.value}</p>
            {card.hint && <p className="text-xs text-slate-500">{card.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
