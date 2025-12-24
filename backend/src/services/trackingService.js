import { getDb } from "../config/database.js";
import { HUB_LOCATIONS } from "./deliveryService.js";

const STATUS_SEQUENCE = [
  "CREATED",
  "MANIFESTED",
  "HUB_IN_SCAN",
  "HUB_OUT_SCAN",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RTO",
];

const STATUS_LABELS = {
  CREATED: "Shipment Created",
  MANIFESTED: "Manifested",
  HUB_IN_SCAN: "Hub In-Scan",
  HUB_OUT_SCAN: "Hub Out-Scan",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  RTO: "Return To Origin",
};

const CITY_COORDINATES = {
  PUNE: { lat: 18.5204, lng: 73.8567, label: "Pune" },
  MUMBAI: { lat: 19.076, lng: 72.8777, label: "Mumbai" },
  DELHI: { lat: 28.6139, lng: 77.209, label: "Delhi" },
  BANGALORE: { lat: 12.9716, lng: 77.5946, label: "Bangalore" },
  HYDERABAD: { lat: 17.385, lng: 78.4867, label: "Hyderabad" },
  CHENNAI: { lat: 13.0827, lng: 80.2707, label: "Chennai" },
  KOLKATA: { lat: 22.5726, lng: 88.3639, label: "Kolkata" },
  AHMEDABAD: { lat: 23.0225, lng: 72.5714, label: "Ahmedabad" },
  JAIPUR: { lat: 26.9124, lng: 75.7873, label: "Jaipur" },
  HUBLI: { lat: 15.3647, lng: 75.124, label: "Hubli" },
  KOLHAPUR: { lat: 16.7049, lng: 74.2433, label: "Kolhapur" },
  SATARA: { lat: 17.6806, lng: 73.9934, label: "Satara" },
  BELAGAVI: { lat: 15.8497, lng: 74.4977, label: "Belagavi" },
  DAVANGERE: { lat: 14.4668, lng: 75.9237, label: "Davangere" },
  TUMKUR: { lat: 13.3392, lng: 77.1135, label: "Tumkur" },
};

const DEFAULT_ROUTES = {
  "PUNE|BANGALORE": ["PUNE", "SATARA", "KOLHAPUR", "BELAGAVI", "HUBLI", "DAVANGERE", "TUMKUR", "BANGALORE"],
  "MUMBAI|BANGALORE": ["MUMBAI", "PUNE", "SATARA", "KOLHAPUR", "BELAGAVI", "HUBLI", "DAVANGERE", "TUMKUR", "BANGALORE"],
  "DELHI|MUMBAI": ["DELHI", "JAIPUR", "AHMEDABAD", "MUMBAI"],
};

const createNotFoundError = () => {
  const error = new Error("Shipment not found");
  error.code = "NOT_FOUND";
  return error;
};

const toIsoString = (value) => (value ? new Date(value).toISOString() : null);

const normalizeCityKey = (value) => (value ? value.trim().toUpperCase() : null);

const sanitizeCityValue = (value) => {
  if (!value) return value;
  return value.replace(/hub/i, "").replace(/city/i, "").trim();
};

const deriveCityKey = (...values) => {
  for (const value of values) {
    const key = normalizeCityKey(sanitizeCityValue(value));
    if (key && CITY_COORDINATES[key]) {
      return key;
    }
  }
  return null;
};

const getCityCoordinate = (city) => {
  const key = normalizeCityKey(city);
  if (!key) return null;
  return CITY_COORDINATES[key] || null;
};

const getRouteKey = (originKey, destinationKey) => {
  if (!originKey || !destinationKey) {
    return null;
  }
  return `${originKey}|${destinationKey}`;
};

const getDefaultRouteKeys = (originKey, destinationKey) => {
  const key = getRouteKey(originKey, destinationKey);
  if (key && DEFAULT_ROUTES[key]) {
    return DEFAULT_ROUTES[key];
  }
  const reverseKey = getRouteKey(destinationKey, originKey);
  if (reverseKey && DEFAULT_ROUTES[reverseKey]) {
    return [...DEFAULT_ROUTES[reverseKey]].reverse();
  }
  return null;
};

const toPolyline = (cityKeys = []) =>
  cityKeys
    .map((key) => CITY_COORDINATES[key])
    .filter(Boolean)
    .map((city) => [city.lat, city.lng]);

const getHubMeta = (hubId) => {
  if (!hubId) return null;
  const hub = HUB_LOCATIONS[hubId];
  if (!hub) return null;
  return { id: hub.id, name: hub.name, lat: hub.lat, lng: hub.lng };
};

const fetchShipmentRow = async (db, franchiseId, shipmentCn) => {
  const [rows] = await db.query(
    `SELECT
        s.id,
        s.franchise_id,
        s.shipment_cn,
        s.status,
        s.service_type,
        s.weight,
        s.pieces,
        s.sender_city,
        s.sender_state,
        s.sender_pincode,
        s.receiver_city,
        s.receiver_state,
        s.receiver_pincode,
        s.created_at,
        s.manifested_at,
        s.delivered_at,
        s.updated_at,
        s.total_charge,
        da.id AS assignment_id,
        da.status AS assignment_status,
        da.delivery_executive_name,
        da.delivery_executive_phone,
        da.vehicle_number,
        da.route_code,
        da.route_name,
        da.started_at AS delivery_started_at,
        da.delivered_at AS delivery_completed_at,
        sht.current_hub_id,
        sht.current_hub_in_scan_time,
        sht.current_hub_out_scan_time,
        sht.next_hub_id,
        sht.route_code AS tracking_route_code,
        sht.vehicle_id AS tracking_vehicle_id,
        (SELECT m.origin_hub_id
           FROM manifest_shipments ms
           JOIN manifests m ON m.id = ms.manifest_id
           WHERE ms.shipment_id = s.id AND ms.franchise_id = s.franchise_id
           ORDER BY ms.id DESC LIMIT 1) AS origin_hub_id,
        (SELECT m.destination_hub_id
           FROM manifest_shipments ms
           JOIN manifests m ON m.id = ms.manifest_id
           WHERE ms.shipment_id = s.id AND ms.franchise_id = s.franchise_id
           ORDER BY ms.id DESC LIMIT 1) AS destination_hub_id
      FROM shipments s
      LEFT JOIN delivery_assignments da ON da.shipment_id = s.id AND da.is_active = 1
      LEFT JOIN shipment_hub_tracking sht ON sht.shipment_id = s.id
      WHERE s.franchise_id = ? AND s.shipment_cn = ?
      LIMIT 1`,
    [franchiseId, shipmentCn]
  );

  if (!rows.length) {
    throw createNotFoundError();
  }

  return rows[0];
};

const fetchTimelineData = async (db, shipmentId) => {
  const [statusLogs] = await db.query(
    `SELECT id, to_status, notes, reason, location, created_at
     FROM shipment_status_logs
     WHERE shipment_id = ?
     ORDER BY created_at ASC`,
    [shipmentId]
  );

  const [hubScans] = await db.query(
    `SELECT id, hub_id, scan_type, scan_time, notes
     FROM hub_scans
     WHERE shipment_id = ? AND status = 'SCANNED'
     ORDER BY scan_time ASC`,
    [shipmentId]
  );

  return { statusLogs, hubScans };
};

const buildTimeline = (row, statusLogs, hubScans) => {
  const entries = [];

  if (row.created_at) {
    entries.push({
      id: "base-created",
      type: "STATUS",
      status: "CREATED",
      label: STATUS_LABELS.CREATED,
      timestamp: row.created_at,
      description: "Shipment booked",
    });
  }

  statusLogs.forEach((log) => {
    entries.push({
      id: `status-${log.id}`,
      type: "STATUS",
      status: log.to_status,
      label: STATUS_LABELS[log.to_status] || log.to_status,
      timestamp: log.created_at,
      description: log.notes || log.reason || null,
      hub: log.location ? { name: log.location } : null,
    });
  });

  hubScans.forEach((scan) => {
    const hub = getHubMeta(scan.hub_id);
    entries.push({
      id: `scan-${scan.id}`,
      type: "SCAN",
      status: scan.scan_type === "IN_SCAN" ? "HUB_IN_SCAN" : "HUB_OUT_SCAN",
      label: scan.scan_type === "IN_SCAN" ? "Hub In-Scan" : "Hub Out-Scan",
      timestamp: scan.scan_time,
      description: scan.notes || null,
      hub,
    });
  });

  entries.sort((a, b) => new Date(a.timestamp || row.created_at) - new Date(b.timestamp || row.created_at));

  const currentIndex = Math.max(STATUS_SEQUENCE.indexOf(row.status || ""), 0);

  return entries.map((entry) => {
    const entryIndex = STATUS_SEQUENCE.indexOf(entry.status || "");
    let state = "pending";
    if (entryIndex === -1) {
      state = entry.timestamp && new Date(entry.timestamp) <= new Date(row.updated_at || row.created_at)
        ? "done"
        : "pending";
    } else if (entryIndex < currentIndex) {
      state = "done";
    } else if (entryIndex === currentIndex) {
      state = "current";
    }

    return {
      ...entry,
      timestamp: toIsoString(entry.timestamp),
      state,
    };
  });
};

const buildRoute = (row) => {
  const nodes = [];

  const originHub = getHubMeta(row.origin_hub_id);
  if (originHub) {
    nodes.push({ key: `origin-${originHub.id}`, type: "origin", label: originHub.name, ...originHub });
  } else {
    const city = getCityCoordinate(row.sender_city || row.sender_state);
    if (city) {
      nodes.push({
        key: "origin-city",
        type: "origin",
        label: city.label,
        lat: city.lat,
        lng: city.lng,
      });
    }
  }

  const currentHub = getHubMeta(row.current_hub_id);
  if (currentHub) {
    nodes.push({ key: `current-${currentHub.id}`, type: "current", label: currentHub.name, ...currentHub });
  }

  const nextHub = getHubMeta(row.next_hub_id);
  if (nextHub) {
    nodes.push({ key: `next-${nextHub.id}`, type: "next", label: nextHub.name, ...nextHub });
  }

  const destinationHub = getHubMeta(row.destination_hub_id);
  if (destinationHub) {
    nodes.push({ key: `destination-${destinationHub.id}`, type: "destination", label: destinationHub.name, ...destinationHub });
  } else {
    const city = getCityCoordinate(row.receiver_city || row.receiver_state);
    if (city) {
      nodes.push({
        key: "destination-city",
        type: "destination",
        label: city.label,
        lat: city.lat,
        lng: city.lng,
      });
    }
  }

  const seen = new Set();
  const uniqueNodes = nodes.filter((node) => {
    const dedupeKey = `${node.type}-${node.id || node.label}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });

  const originCityKey = deriveCityKey(row.sender_city, originHub?.name);
  const destinationCityKey = deriveCityKey(row.receiver_city, destinationHub?.name);
  const defaultRouteKeys = getDefaultRouteKeys(originCityKey, destinationCityKey);

  const checkpoints = defaultRouteKeys
    ? defaultRouteKeys
        .map((key, index) => {
          const city = CITY_COORDINATES[key];
          if (!city) return null;
          return {
            key: `${key}-${index}`,
            label: city.label,
            lat: city.lat,
            lng: city.lng,
            type:
              index === 0 ? "origin" : index === defaultRouteKeys.length - 1 ? "destination" : "checkpoint",
          };
        })
        .filter(Boolean)
    : uniqueNodes.map((node) => ({
        key: node.key,
        label: node.label,
        lat: node.lat,
        lng: node.lng,
        type: node.type,
      }));

  let polyline = defaultRouteKeys ? toPolyline(defaultRouteKeys) : [];

  if (!polyline.length) {
    polyline = uniqueNodes
      .filter((node) => typeof node.lat === "number" && typeof node.lng === "number")
      .map((node) => [node.lat, node.lng]);
  }

  return { nodes: uniqueNodes, polyline, checkpoints };
};

const haversine = (from, to) => {
  const R = 6371;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from[0] * Math.PI) / 180) * Math.cos((to[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculatePolylineDistance = (polyline) => {
  if (!polyline || polyline.length < 2) {
    return 0;
  }
  let distance = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    distance += haversine(polyline[i - 1], polyline[i]);
  }
  return distance;
};

const getNearestCheckpointLabel = (checkpoints = [], lat, lng) => {
  if (!checkpoints.length || typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }
  let closest = null;
  checkpoints.forEach((checkpoint) => {
    if (typeof checkpoint.lat !== "number" || typeof checkpoint.lng !== "number") {
      return;
    }
    const distance = haversine([lat, lng], [checkpoint.lat, checkpoint.lng]);
    if (!closest || distance < closest.distance) {
      closest = { distance, label: checkpoint.label };
    }
  });
  return closest?.label || null;
};

const calculateBearing = (from, to) => {
  if (!from || !to) return 0;
  const fromLat = (from[0] * Math.PI) / 180;
  const fromLng = (from[1] * Math.PI) / 180;
  const toLat = (to[0] * Math.PI) / 180;
  const toLng = (to[1] * Math.PI) / 180;
  const y = Math.sin(toLng - fromLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLng - fromLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

const getPositionOnPolyline = (polyline, targetDistance) => {
  if (!polyline || polyline.length === 0) {
    return null;
  }
  if (polyline.length === 1) {
    return { lat: polyline[0][0], lng: polyline[0][1], bearing: 0 };
  }
  let travelled = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    const start = polyline[i - 1];
    const end = polyline[i];
    const segment = haversine(start, end);
    if (travelled + segment >= targetDistance) {
      const remainder = targetDistance - travelled;
      const ratio = segment === 0 ? 0 : remainder / segment;
      const lat = start[0] + (end[0] - start[0]) * ratio;
      const lng = start[1] + (end[1] - start[1]) * ratio;
      return { lat, lng, bearing: calculateBearing(start, end) };
    }
    travelled += segment;
  }
  const last = polyline[polyline.length - 1];
  const prev = polyline[polyline.length - 2];
  return { lat: last[0], lng: last[1], bearing: calculateBearing(prev, last) };
};

const computeEta = (row) => {
  if (row.delivered_at) {
    return new Date(row.delivered_at);
  }
  const base = row.current_hub_out_scan_time || row.updated_at || row.created_at;
  const status = row.status;
  const hours = status === "OUT_FOR_DELIVERY" ? 6 : status === "IN_TRANSIT" ? 24 : 12;
  return new Date(new Date(base || Date.now()).getTime() + hours * 60 * 60 * 1000);
};

const deriveSpeed = (status) => {
  if (status === "IN_TRANSIT") return 58;
  if (status === "OUT_FOR_DELIVERY") return 18;
  if (status === "HUB_OUT_SCAN") return 35;
  return null;
};

const buildLiveLocation = (row, route, timeline, eta) => {
  const percent = Math.max(
    0,
    Math.min(
      100,
      Math.round((Math.max(STATUS_SEQUENCE.indexOf(row.status), 0) / (STATUS_SEQUENCE.length - 1)) * 100)
    )
  );

  const totalDistance = calculatePolylineDistance(route.polyline);
  const travelled = (percent / 100) * totalDistance;
  const remaining = Math.max(0, totalDistance - travelled);

  const anchorNode =
    route.nodes.find((node) => node.type === "current") ||
    route.nodes.find((node) => node.type === "next") ||
    route.nodes.find((node) => node.type === "origin") ||
    route.nodes[0] ||
    null;

  const lastTimelineEntry = timeline[timeline.length - 1];
  const positionOnPath = totalDistance > 0 ? getPositionOnPolyline(route.polyline, travelled) : null;
  const lat = positionOnPath?.lat ?? anchorNode?.lat ?? null;
  const lng = positionOnPath?.lng ?? anchorNode?.lng ?? null;
  const checkpointLabel = getNearestCheckpointLabel(route.checkpoints, lat, lng);

  return {
    status: row.status,
    label: checkpointLabel || anchorNode?.label || lastTimelineEntry?.label || row.status,
    lat,
    lng,
    bearing: positionOnPath?.bearing || null,
    updated_at: toIsoString(row.updated_at) || lastTimelineEntry?.timestamp || toIsoString(row.created_at),
    eta: eta ? eta.toISOString() : null,
    percent_complete: percent,
    total_distance_km: Number(totalDistance.toFixed(1)) || 0,
    distance_travelled_km: Number(travelled.toFixed(1)) || 0,
    distance_remaining_km: Number(remaining.toFixed(1)) || 0,
    speed_kmph: deriveSpeed(row.status),
  };
};

const buildShipmentSummary = (row, eta) => ({
  id: row.id,
  shipment_cn: row.shipment_cn,
  status: row.status,
  service_type: row.service_type,
  weight: Number(row.weight || 0),
  pieces: Number(row.pieces || 1),
  sender: {
    city: row.sender_city,
    state: row.sender_state,
    pincode: row.sender_pincode,
  },
  receiver: {
    city: row.receiver_city,
    state: row.receiver_state,
    pincode: row.receiver_pincode,
  },
  created_at: toIsoString(row.created_at),
  manifested_at: toIsoString(row.manifested_at),
  delivered_at: toIsoString(row.delivered_at),
  estimated_delivery: eta ? eta.toISOString() : null,
  current_hub: getHubMeta(row.current_hub_id),
  next_hub: getHubMeta(row.next_hub_id),
  origin_hub: getHubMeta(row.origin_hub_id),
  destination_hub: getHubMeta(row.destination_hub_id),
  assignment: row.assignment_id
    ? {
        id: row.assignment_id,
        status: row.assignment_status,
        delivery_executive_name: row.delivery_executive_name,
        delivery_executive_phone: row.delivery_executive_phone,
        vehicle_number: row.vehicle_number || row.tracking_vehicle_id,
        route_code: row.route_code || row.tracking_route_code,
        route_name: row.route_name,
        started_at: toIsoString(row.delivery_started_at),
        completed_at: toIsoString(row.delivery_completed_at),
      }
    : null,
});

const buildMetrics = (liveLocation) => ({
  eta: liveLocation.eta,
  percent_complete: liveLocation.percent_complete,
  total_distance_km: liveLocation.total_distance_km,
  distance_travelled_km: liveLocation.distance_travelled_km,
  distance_remaining_km: liveLocation.distance_remaining_km,
  status: liveLocation.status,
});

export const getShipmentTrackingDetails = async (franchiseId, shipmentCn) => {
  const db = getDb();
  const shipmentRow = await fetchShipmentRow(db, franchiseId, shipmentCn);
  const { statusLogs, hubScans } = await fetchTimelineData(db, shipmentRow.id);
  const timeline = buildTimeline(shipmentRow, statusLogs, hubScans);
  const route = buildRoute(shipmentRow);
  const eta = computeEta(shipmentRow);
  const shipment = buildShipmentSummary(shipmentRow, eta);
  const liveLocation = buildLiveLocation(shipmentRow, route, timeline, eta);
  const metrics = buildMetrics(liveLocation);

  return {
    shipment,
    timeline,
    route,
    live_location: liveLocation,
    metrics,
  };
};

export const getShipmentLiveLocation = async (franchiseId, shipmentCn) => {
  const db = getDb();
  const shipmentRow = await fetchShipmentRow(db, franchiseId, shipmentCn);
  const { statusLogs, hubScans } = await fetchTimelineData(db, shipmentRow.id);
  const route = buildRoute(shipmentRow);
  const eta = computeEta(shipmentRow);
  const timeline = buildTimeline(shipmentRow, statusLogs, hubScans);
  const liveLocation = buildLiveLocation(shipmentRow, route, timeline, eta);
  const metrics = buildMetrics(liveLocation);

  return {
    route,
    live_location: liveLocation,
    metrics,
  };
};
