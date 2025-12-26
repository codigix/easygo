import { getDb } from "../config/database.js";

const VEHICLE_ASSIGNABLE_STATUS = "AVAILABLE";
const DRIVER_ASSIGNABLE_STATUS = "AVAILABLE";

const decodePolyline = (encoded = "") => {
  if (!encoded) {
    return [];
  }
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
};

const haversine = (from, to) => {
  if (!from || !to) {
    return 0;
  }
  const R = 6371;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from[0] * Math.PI) / 180) *
      Math.cos((to[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPolylineDistance = (polyline = []) => {
  if (!polyline.length) {
    return 0;
  }
  let distance = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    distance += haversine(polyline[i - 1], polyline[i]);
  }
  return distance;
};

const getPositionOnPolyline = (polyline, percent) => {
  if (!polyline || polyline.length === 0) {
    return null;
  }
  if (polyline.length === 1) {
    return {
      lat: polyline[0][0],
      lng: polyline[0][1],
      bearing: 0,
    };
  }
  const targetDistance = (percent / 100) * getPolylineDistance(polyline);
  let traveled = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    const start = polyline[i - 1];
    const end = polyline[i];
    const segment = haversine(start, end);
    if (traveled + segment >= targetDistance) {
      const ratio = segment === 0 ? 0 : (targetDistance - traveled) / segment;
      const lat = start[0] + (end[0] - start[0]) * ratio;
      const lng = start[1] + (end[1] - start[1]) * ratio;
      const bearing = computeBearing(start, end);
      return { lat, lng, bearing };
    }
    traveled += segment;
  }
  const last = polyline[polyline.length - 1];
  const prev = polyline[polyline.length - 2];
  return {
    lat: last[0],
    lng: last[1],
    bearing: computeBearing(prev, last),
  };
};

const computeBearing = (from, to) => {
  if (!from || !to) {
    return 0;
  }
  const fromLat = (from[0] * Math.PI) / 180;
  const fromLng = (from[1] * Math.PI) / 180;
  const toLat = (to[0] * Math.PI) / 180;
  const toLng = (to[1] * Math.PI) / 180;
  const y = Math.sin(toLng - fromLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLng - fromLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const normalizeCoordinate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const distancePointToSegmentKm = (point, start, end) => {
  if (!point || !start || !end) {
    return null;
  }
  if (start[0] === end[0] && start[1] === end[1]) {
    return haversine(point, start);
  }
  const refLatRad = (((start[0] + end[0]) / 2) * Math.PI) / 180;
  const yScale = 110.574;
  const xScale = 111.32 * Math.cos(refLatRad || 0);
  const dx = (end[1] - start[1]) * xScale;
  const dy = (end[0] - start[0]) * yScale;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return haversine(point, start);
  }
  const pointX = (point[1] - start[1]) * xScale;
  const pointY = (point[0] - start[0]) * yScale;
  let t = (pointX * dx + pointY * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const projX = t * dx;
  const projY = t * dy;
  const diffX = pointX - projX;
  const diffY = pointY - projY;
  return Math.sqrt(diffX * diffX + diffY * diffY);
};

const distancePointToPolylineKm = (point, polyline = []) => {
  if (!point || !Array.isArray(polyline) || polyline.length === 0) {
    return null;
  }
  if (polyline.length === 1) {
    return haversine(point, polyline[0]);
  }
  let minDistance = Infinity;
  for (let i = 1; i < polyline.length; i += 1) {
    const distance = distancePointToSegmentKm(point, polyline[i - 1], polyline[i]);
    if (distance !== null && distance < minDistance) {
      minDistance = distance;
    }
  }
  return Number.isFinite(minDistance) ? minDistance : null;
};

const isWithinGeofence = (point, polyline, radiusKm = 0.5) => {
  if (!point || !Array.isArray(polyline) || polyline.length === 0) {
    return false;
  }
  const destination = polyline[polyline.length - 1];
  if (!destination) {
    return false;
  }
  return haversine(point, destination) <= radiusKm;
};

const computeRouteDeviation = (point, polyline, thresholdKm = 0.5) => {
  if (!point || !Array.isArray(polyline) || polyline.length === 0) {
    return { distance_km: null, is_deviation: false };
  }
  const distanceKm = distancePointToPolylineKm(point, polyline);
  if (distanceKm === null) {
    return { distance_km: null, is_deviation: false };
  }
  return {
    distance_km: Number(distanceKm.toFixed(3)),
    is_deviation: distanceKm > thresholdKm,
  };
};

const parseJson = (value, fallback = []) => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const generateLoadNumber = (franchiseId) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `LP-${franchiseId}-${datePart}-${randomPart}`;
};

const normalizeLocation = (value) => {
  if (!value) {
    return null;
  }
  return value.toString().trim().toUpperCase();
};

const buildVehicleDTO = (row) => ({
  id: row.id,
  vehicle_number: row.vehicle_number,
  vehicle_type: row.vehicle_type,
  capacity_kg: toNumber(row.capacity_kg),
  volume_cuft: toNumber(row.volume_cuft),
  fuel_type: row.fuel_type,
  gps_device_id: row.gps_device_id,
  status: row.status,
  current_hub: row.current_hub,
  last_lat: row.last_lat === null || row.last_lat === undefined ? null : Number(row.last_lat),
  last_lng: row.last_lng === null || row.last_lng === undefined ? null : Number(row.last_lng),
  last_ping_at: row.last_ping_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildDriverDTO = (row) => ({
  id: row.id,
  driver_code: row.driver_code,
  name: row.name,
  phone: row.phone,
  license_number: row.license_number,
  license_expiry: row.license_expiry,
  assigned_vehicle_id: row.assigned_vehicle_id,
  current_hub: row.current_hub,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildRouteDTO = (row, withGeometry = false) => ({
  id: row.id,
  route_code: row.route_code,
  origin_hub: row.origin_hub,
  destination_hub: row.destination_hub,
  via_hubs: parseJson(row.via_hubs),
  distance_km: toNumber(row.distance_km),
  expected_time_hours: row.expected_time_hours ? Number(row.expected_time_hours) : 0,
  encoded_polyline: row.encoded_polyline,
  polyline: withGeometry ? decodePolyline(row.encoded_polyline) : undefined,
  is_active: !!row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildLoadPlanningInsights = (route, vehicles = [], shipments = []) => {
  if (!route || !vehicles.length) {
    return null;
  }
  const totalWeight = shipments.reduce((sum, shipment) => sum + toNumber(shipment.weight), 0);
  const rankedVehicles = vehicles
    .map((vehicle) => {
      const capacity = toNumber(vehicle.capacity_kg);
      const residual = capacity - totalWeight;
      return {
        ...vehicle,
        capacity,
        residual,
        canCarry: capacity > 0 && totalWeight > 0 ? residual >= 0 : capacity > 0,
      };
    })
    .sort((a, b) => {
      if (a.canCarry && b.canCarry) {
        return Math.abs(a.residual) - Math.abs(b.residual);
      }
      if (a.canCarry) {
        return -1;
      }
      if (b.canCarry) {
        return 1;
      }
      return b.capacity - a.capacity;
    });
  const suggested = rankedVehicles[0];
  const utilizationPercent =
    suggested && totalWeight > 0 && suggested.capacity > 0
      ? Math.min(100, (totalWeight / suggested.capacity) * 100)
      : 0;
  return {
    suggested_vehicle_id: suggested?.id || null,
    suggested_vehicle_number: suggested?.vehicle_number || null,
    suggested_route_id: route.id,
    total_manifest_weight: Number(totalWeight.toFixed(2)),
    utilization_percent: Number(utilizationPercent.toFixed(1)),
    under_utilized: utilizationPercent > 0 && utilizationPercent < 70,
    advisory:
      utilizationPercent === 0
        ? "Select shipments to enable AI guidance"
        : utilizationPercent < 70
        ? "Underutilized: add more shipments for efficiency"
        : utilizationPercent > 95
        ? "Vehicle will depart near full capacity"
        : "Capacity utilization is optimal",
  };
};

const insertStatusLogs = async (conn, franchiseId, userId, logs = []) => {
  if (!logs.length) {
    return;
  }
  await conn.query(
    `INSERT INTO shipment_status_logs (shipment_id, franchise_id, from_status, to_status, reason, updated_by, notes)
     VALUES ?`,
    [
      logs.map((log) => [
        log.shipment_id,
        franchiseId,
        log.from_status,
        log.to_status,
        log.reason || null,
        userId || null,
        log.notes || null,
      ]),
    ]
  );
};

const computeLoadProgress = (plan) => {
  if (plan.status === "COMPLETED") {
    return 100;
  }
  if (plan.status === "PLANNED") {
    return 0;
  }
  if (!plan.dispatched_at || !plan.eta) {
    return 35;
  }
  const start = new Date(plan.dispatched_at).getTime();
  const end = new Date(plan.eta).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 50;
  }
  const percent = ((Date.now() - start) / (end - start)) * 100;
  return Math.max(5, Math.min(95, percent));
};

const buildLiveLocationForPlan = (plan, route, progress) => {
  const polyline = decodePolyline(route.encoded_polyline);
  const anchor = getPositionOnPolyline(polyline, progress);
  return {
    lat: anchor?.lat || plan.current_lat || null,
    lng: anchor?.lng || plan.current_lng || null,
    bearing: anchor?.bearing || null,
    percent_complete: Number(progress.toFixed(1)),
    eta: plan.eta,
    label: plan.current_leg || `${route.origin_hub} → ${route.destination_hub}`,
    updated_at: plan.last_telemetry_at || plan.updated_at,
  };
};

const buildLoadPlanMeta = (row) => ({
  id: row.id,
  load_number: row.load_number,
  status: row.status,
  total_shipments: row.total_shipments,
  total_weight: toNumber(row.total_weight),
  total_volume: toNumber(row.total_volume),
  utilization_percent: toNumber(row.utilization_percent),
  scheduled_at: row.scheduled_at,
  dispatched_at: row.dispatched_at,
  completed_at: row.completed_at,
  eta: row.eta,
  current_leg: row.current_leg,
  current_lat: row.current_lat === null || row.current_lat === undefined ? null : Number(row.current_lat),
  current_lng: row.current_lng === null || row.current_lng === undefined ? null : Number(row.current_lng),
  completion_source: row.completion_source || "MANUAL",
  route_deviation: {
    detected: !!row.route_deviation_flag,
    distance_km: toNumber(row.route_deviation_distance_km),
    triggered_at: row.route_deviation_triggered_at,
  },
  route: {
    id: row.route_id,
    route_code: row.route_code,
    origin_hub: row.origin_hub,
    destination_hub: row.destination_hub,
  },
  vehicle: {
    id: row.vehicle_id,
    vehicle_number: row.vehicle_number,
    vehicle_type: row.vehicle_type,
  },
  driver: {
    id: row.driver_id,
    name: row.driver_name,
    phone: row.driver_phone,
  },
});

const buildLoadPlanDetail = (row, shipments) => {
  const progress = computeLoadProgress(row);
  const live_location = buildLiveLocationForPlan(row, row.route, progress);
  return {
    id: row.id,
    load_number: row.load_number,
    status: row.status,
    total_shipments: row.total_shipments,
    total_weight: toNumber(row.total_weight),
    total_volume: toNumber(row.total_volume),
    utilization_percent: toNumber(row.utilization_percent),
    scheduled_at: row.scheduled_at,
    dispatched_at: row.dispatched_at,
    completed_at: row.completed_at,
    eta: row.eta,
    notes: row.notes,
    completion_source: row.completion_source || "MANUAL",
    route_deviation: {
      detected: !!row.route_deviation_flag,
      distance_km: toNumber(row.route_deviation_distance_km),
      triggered_at: row.route_deviation_triggered_at,
    },
    route: {
      id: row.route_id,
      route_code: row.route.route_code,
      origin_hub: row.route.origin_hub,
      destination_hub: row.route.destination_hub,
      via_hubs: row.route.via_hubs,
      distance_km: row.route.distance_km,
      expected_time_hours: row.route.expected_time_hours,
      encoded_polyline: row.route.encoded_polyline,
      polyline: decodePolyline(row.route.encoded_polyline),
    },
    vehicle: buildVehicleDTO(row.vehicle),
    driver: buildDriverDTO(row.driver),
    shipments,
    live_location,
    metrics: {
      progress_percent: live_location.percent_complete,
      distance_km: row.route.distance_km,
      utilization_percent: toNumber(row.utilization_percent),
    },
  };
};

const fetchVehicle = async (conn, vehicleId, franchiseId, lock = false) => {
  const [rows] = await conn.query(
    `SELECT * FROM fleet_vehicles WHERE id = ? AND franchise_id = ? ${lock ? "FOR UPDATE" : ""}`,
    [vehicleId, franchiseId]
  );
  return rows[0] || null;
};

const fetchDriver = async (conn, driverId, franchiseId, lock = false) => {
  const [rows] = await conn.query(
    `SELECT * FROM fleet_drivers WHERE id = ? AND franchise_id = ? ${lock ? "FOR UPDATE" : ""}`,
    [driverId, franchiseId]
  );
  return rows[0] || null;
};

const fetchRoute = async (conn, routeId, franchiseId, lock = false) => {
  const [rows] = await conn.query(
    `SELECT * FROM fleet_routes WHERE id = ? AND franchise_id = ? AND is_active = 1 ${lock ? "FOR UPDATE" : ""}`,
    [routeId, franchiseId]
  );
  return rows[0] || null;
};

const fetchShipmentsForLoad = async (conn, franchiseId, shipmentIds, lock = false) => {
  if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    throw new Error("Select at least one shipment");
  }
  const [rows] = await conn.query(
    `SELECT id, shipment_cn, status, weight FROM shipments WHERE franchise_id = ? AND id IN (?) ${lock ? "FOR UPDATE" : ""}`,
    [franchiseId, shipmentIds]
  );
  if (rows.length !== shipmentIds.length) {
    throw new Error("Some shipments were not found");
  }
  const invalid = rows.filter((row) => row.status !== "MANIFESTED");
  if (invalid.length) {
    throw new Error("Only manifested shipments can be load planned");
  }
  return rows;
};

const upsertShipmentTracking = async (conn, franchiseId, shipmentId, routeCode, vehicleNumber) => {
  const [result] = await conn.query(
    `UPDATE shipment_hub_tracking SET route_code = ?, vehicle_id = ?, updated_at = ? WHERE shipment_id = ?`,
    [routeCode, vehicleNumber, new Date(), shipmentId]
  );
  if (result.affectedRows === 0) {
    await conn.query(
      `INSERT INTO shipment_hub_tracking (shipment_id, franchise_id, route_code, vehicle_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shipmentId, franchiseId, routeCode, vehicleNumber, new Date(), new Date()]
    );
  }
};

export const getFleetOverview = async (franchiseId) => {
  const db = getDb();
  const [[vehicleStats]] = await db.query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
       SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit,
       SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance
     FROM fleet_vehicles
     WHERE franchise_id = ?`,
    [franchiseId]
  );
  const [[driverStats]] = await db.query(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
       SUM(CASE WHEN status = 'ON_ROUTE' THEN 1 ELSE 0 END) as on_route
     FROM fleet_drivers
     WHERE franchise_id = ?`,
    [franchiseId]
  );
  const [[loadStats]] = await db.query(
    `SELECT
       SUM(CASE WHEN status = 'DISPATCHED' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN DATE(dispatched_at) = CURRENT_DATE THEN 1 ELSE 0 END) as dispatched_today,
       AVG(utilization_percent) as avg_utilization
     FROM load_plans
     WHERE franchise_id = ?`,
    [franchiseId]
  );
  const [[manifested]] = await db.query(
    `SELECT COUNT(*) as count FROM shipments WHERE franchise_id = ? AND status = 'MANIFESTED'`,
    [franchiseId]
  );
  return {
    vehicles: {
      total: Number(vehicleStats?.total || 0),
      available: Number(vehicleStats?.available || 0),
      in_transit: Number(vehicleStats?.in_transit || 0),
      maintenance: Number(vehicleStats?.maintenance || 0),
    },
    drivers: {
      total: Number(driverStats?.total || 0),
      available: Number(driverStats?.available || 0),
      on_route: Number(driverStats?.on_route || 0),
    },
    loads: {
      active: Number(loadStats?.active || 0),
      dispatched_today: Number(loadStats?.dispatched_today || 0),
      avg_utilization: Number(loadStats?.avg_utilization || 0),
    },
    shipments_ready: Number(manifested?.count || 0),
  };
};

export const getVehicles = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT * FROM fleet_vehicles WHERE franchise_id = ? ORDER BY created_at DESC`,
    [franchiseId]
  );
  const stats = rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    {}
  );
  return {
    vehicles: rows.map(buildVehicleDTO),
    stats: {
      AVAILABLE: stats.AVAILABLE || 0,
      IN_TRANSIT: stats.IN_TRANSIT || 0,
      MAINTENANCE: stats.MAINTENANCE || 0,
      INACTIVE: stats.INACTIVE || 0,
    },
  };
};

export const createVehicle = async (franchiseId, payload) => {
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `INSERT INTO fleet_vehicles
       (franchise_id, vehicle_number, vehicle_type, capacity_kg, volume_cuft, fuel_type, gps_device_id, status, current_hub, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      franchiseId,
      payload.vehicle_number,
      payload.vehicle_type || "TRUCK",
      payload.capacity_kg || 0,
      payload.volume_cuft || 0,
      payload.fuel_type || "DIESEL",
      payload.gps_device_id || null,
      payload.status || "AVAILABLE",
      payload.current_hub || null,
      now,
      now,
    ]
  );
  const [[vehicle]] = await db.query(`SELECT * FROM fleet_vehicles WHERE id = ?`, [result.insertId]);
  return buildVehicleDTO(vehicle);
};

export const updateVehicle = async (vehicleId, franchiseId, payload) => {
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `UPDATE fleet_vehicles
     SET vehicle_number = ?, vehicle_type = ?, capacity_kg = ?, volume_cuft = ?, fuel_type = ?, gps_device_id = ?, current_hub = ?, updated_at = ?
     WHERE id = ? AND franchise_id = ?`,
    [
      payload.vehicle_number,
      payload.vehicle_type || "TRUCK",
      payload.capacity_kg || 0,
      payload.volume_cuft || 0,
      payload.fuel_type || "DIESEL",
      payload.gps_device_id || null,
      payload.current_hub || null,
      now,
      vehicleId,
      franchiseId,
    ]
  );
  if (result.affectedRows === 0) {
    throw new Error("Vehicle not found");
  }
  const [[vehicle]] = await db.query(`SELECT * FROM fleet_vehicles WHERE id = ?`, [vehicleId]);
  return buildVehicleDTO(vehicle);
};

export const updateVehicleStatus = async (vehicleId, franchiseId, status) => {
  const db = getDb();
  const allowed = ["AVAILABLE", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"];
  if (!allowed.includes(status)) {
    throw new Error("Invalid vehicle status");
  }
  const now = new Date();
  const [result] = await db.query(
    `UPDATE fleet_vehicles SET status = ?, updated_at = ? WHERE id = ? AND franchise_id = ?`,
    [status, now, vehicleId, franchiseId]
  );
  if (result.affectedRows === 0) {
    throw new Error("Vehicle not found");
  }
  const [[vehicle]] = await db.query(`SELECT * FROM fleet_vehicles WHERE id = ?`, [vehicleId]);
  return buildVehicleDTO(vehicle);
};

export const updateVehicleTelemetry = async (vehicleId, franchiseId, payload) => {
  const db = getDb();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const now = new Date();
    const hasLat = hasOwn(payload, "lat");
    const hasLng = hasOwn(payload, "lng");
    const latValue = normalizeCoordinate(payload.lat);
    const lngValue = normalizeCoordinate(payload.lng);
    const updateFields = [];
    const updateParams = [];
    if (hasLat) {
      updateFields.push("last_lat = ?");
      updateParams.push(latValue);
    }
    if (hasLng) {
      updateFields.push("last_lng = ?");
      updateParams.push(lngValue);
    }
    updateFields.push("last_ping_at = ?");
    updateParams.push(now);
    updateFields.push("current_hub = COALESCE(?, current_hub)");
    updateParams.push(payload.current_hub ?? null);
    updateFields.push("updated_at = ?");
    updateParams.push(now);
    updateParams.push(vehicleId, franchiseId);
    const vehicleUpdateSql = `UPDATE fleet_vehicles SET ${updateFields.join(", ")} WHERE id = ? AND franchise_id = ?`;
    const [result] = await conn.query(vehicleUpdateSql, updateParams);
    if (result.affectedRows === 0) {
      throw new Error("Vehicle not found");
    }
    const shouldUpdateLoad = hasLat || hasLng || hasOwn(payload, "current_leg");
    if (shouldUpdateLoad) {
      const [activeLoads] = await conn.query(
        `SELECT lp.id, lp.route_id, lp.vehicle_id, lp.status, lp.current_leg, r.encoded_polyline
         FROM load_plans lp
         JOIN fleet_routes r ON r.id = lp.route_id
         WHERE lp.vehicle_id = ? AND lp.status = 'DISPATCHED'
         LIMIT 1 FOR UPDATE`,
        [vehicleId]
      );
      if (activeLoads.length) {
        const activePlan = activeLoads[0];
        const loadFields = [];
        const loadParams = [];
        if (hasLat) {
          loadFields.push("current_lat = ?");
          loadParams.push(latValue);
        }
        if (hasLng) {
          loadFields.push("current_lng = ?");
          loadParams.push(lngValue);
        }
        loadFields.push("last_telemetry_at = ?");
        loadParams.push(now);
        if (hasOwn(payload, "current_leg")) {
          loadFields.push("current_leg = ?");
          loadParams.push(payload.current_leg || null);
        }
        loadFields.push("updated_at = ?");
        loadParams.push(now);
        loadParams.push(activePlan.id);
        await conn.query(`UPDATE load_plans SET ${loadFields.join(", ")} WHERE id = ?`, loadParams);
        const hasGeo = hasLat && hasLng && latValue !== null && lngValue !== null;
        if (hasGeo) {
          const polyline = decodePolyline(activePlan.encoded_polyline);
          const point = [latValue, lngValue];
          const deviation = computeRouteDeviation(point, polyline);
          if (deviation.distance_km !== null) {
            await conn.query(
              `UPDATE load_plans SET route_deviation_flag = ?, route_deviation_distance_km = ?, route_deviation_triggered_at = ? WHERE id = ?`,
              [deviation.is_deviation ? 1 : 0, deviation.distance_km, deviation.is_deviation ? now : null, activePlan.id]
            );
          }
          if (isWithinGeofence(point, polyline)) {
            await finalizeLoadPlan(conn, franchiseId, activePlan.id, { lat: latValue, lng: lngValue }, null, "GEOFENCE");
          }
        }
      }
    }
    await conn.commit();
    const [[vehicle]] = await db.query(`SELECT * FROM fleet_vehicles WHERE id = ?`, [vehicleId]);
    return buildVehicleDTO(vehicle);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getDrivers = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT * FROM fleet_drivers WHERE franchise_id = ? ORDER BY created_at DESC`,
    [franchiseId]
  );
  return rows.map(buildDriverDTO);
};

export const createDriver = async (franchiseId, payload) => {
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `INSERT INTO fleet_drivers
       (franchise_id, driver_code, name, phone, license_number, license_expiry, assigned_vehicle_id, current_hub, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      franchiseId,
      payload.driver_code || null,
      payload.name,
      payload.phone,
      payload.license_number,
      payload.license_expiry,
      payload.assigned_vehicle_id || null,
      payload.current_hub || null,
      payload.status || "AVAILABLE",
      now,
      now,
    ]
  );
  const [[driver]] = await db.query(`SELECT * FROM fleet_drivers WHERE id = ?`, [result.insertId]);
  return buildDriverDTO(driver);
};

export const updateDriver = async (driverId, franchiseId, payload) => {
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `UPDATE fleet_drivers
     SET driver_code = ?, name = ?, phone = ?, license_number = ?, license_expiry = ?, assigned_vehicle_id = ?, current_hub = ?, updated_at = ?
     WHERE id = ? AND franchise_id = ?`,
    [
      payload.driver_code || null,
      payload.name,
      payload.phone,
      payload.license_number,
      payload.license_expiry,
      payload.assigned_vehicle_id || null,
      payload.current_hub || null,
      now,
      driverId,
      franchiseId,
    ]
  );
  if (result.affectedRows === 0) {
    throw new Error("Driver not found");
  }
  const [[driver]] = await db.query(`SELECT * FROM fleet_drivers WHERE id = ?`, [driverId]);
  return buildDriverDTO(driver);
};

export const updateDriverStatus = async (driverId, franchiseId, status) => {
  const allowed = ["AVAILABLE", "ON_ROUTE", "INACTIVE"];
  if (!allowed.includes(status)) {
    throw new Error("Invalid driver status");
  }
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `UPDATE fleet_drivers SET status = ?, updated_at = ? WHERE id = ? AND franchise_id = ?`,
    [status, now, driverId, franchiseId]
  );
  if (result.affectedRows === 0) {
    throw new Error("Driver not found");
  }
  const [[driver]] = await db.query(`SELECT * FROM fleet_drivers WHERE id = ?`, [driverId]);
  return buildDriverDTO(driver);
};

export const getRoutes = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT * FROM fleet_routes WHERE franchise_id = ? ORDER BY created_at DESC`,
    [franchiseId]
  );
  return rows.map((row) => buildRouteDTO(row, false));
};

export const createRoute = async (franchiseId, payload) => {
  if (!payload.encoded_polyline) {
    throw new Error("Route geometry is required");
  }
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `INSERT INTO fleet_routes
       (franchise_id, route_code, origin_hub, destination_hub, via_hubs, distance_km, expected_time_hours, encoded_polyline, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      franchiseId,
      payload.route_code,
      payload.origin_hub,
      payload.destination_hub,
      JSON.stringify(payload.via_hubs || []),
      payload.distance_km || 0,
      payload.expected_time_hours || 0,
      payload.encoded_polyline,
      payload.is_active !== false,
      now,
      now,
    ]
  );
  const [[route]] = await db.query(`SELECT * FROM fleet_routes WHERE id = ?`, [result.insertId]);
  return buildRouteDTO(route, true);
};

export const updateRoute = async (routeId, franchiseId, payload) => {
  const db = getDb();
  const now = new Date();
  const [result] = await db.query(
    `UPDATE fleet_routes
     SET route_code = ?, origin_hub = ?, destination_hub = ?, via_hubs = ?, distance_km = ?, expected_time_hours = ?, encoded_polyline = ?, is_active = ?, updated_at = ?
     WHERE id = ? AND franchise_id = ?`,
    [
      payload.route_code,
      payload.origin_hub,
      payload.destination_hub,
      JSON.stringify(payload.via_hubs || []),
      payload.distance_km || 0,
      payload.expected_time_hours || 0,
      payload.encoded_polyline,
      payload.is_active !== false,
      now,
      routeId,
      franchiseId,
    ]
  );
  if (result.affectedRows === 0) {
    throw new Error("Route not found");
  }
  const [[route]] = await db.query(`SELECT * FROM fleet_routes WHERE id = ?`, [routeId]);
  return buildRouteDTO(route, true);
};

export const getLoadPlanningOptions = async (franchiseId, routeId) => {
  const db = getDb();
  const [routeRows] = await db.query(
    `SELECT * FROM fleet_routes WHERE franchise_id = ? AND is_active = 1 ORDER BY created_at DESC`,
    [franchiseId]
  );
  const [vehicleRows] = await db.query(
    `SELECT * FROM fleet_vehicles WHERE franchise_id = ? AND status = ? ORDER BY created_at DESC`,
    [franchiseId, VEHICLE_ASSIGNABLE_STATUS]
  );
  const [driverRows] = await db.query(
    `SELECT * FROM fleet_drivers WHERE franchise_id = ? AND status = ? ORDER BY created_at DESC`,
    [franchiseId, DRIVER_ASSIGNABLE_STATUS]
  );
  let shipments = [];
  if (routeId) {
    const [[route]] = await db.query(
      `SELECT * FROM fleet_routes WHERE id = ? AND franchise_id = ? AND is_active = 1`,
      [routeId, franchiseId]
    );
    if (!route) {
      throw new Error("Route not found");
    }
    const destination = normalizeLocation(route.destination_hub);
    const [rows] = await db.query(
      `SELECT id, shipment_cn, weight, receiver_city, receiver_state, receiver_pincode, status
       FROM shipments
       WHERE franchise_id = ? AND status = 'MANIFESTED' AND UPPER(TRIM(receiver_city)) = ?
       ORDER BY created_at ASC
       LIMIT 250`,
      [franchiseId, destination]
    );
    shipments = rows;
  }
  const routes = routeRows.map((row) => buildRouteDTO(row, false));
  const vehicles = vehicleRows.map(buildVehicleDTO);
  const drivers = driverRows.map(buildDriverDTO);
  const selectedRoute = routeId ? routes.find((route) => route.id === routeId) || null : null;
  const insights = selectedRoute ? buildLoadPlanningInsights(selectedRoute, vehicles, shipments) : null;
  return {
    routes,
    vehicles,
    drivers,
    shipments,
    insights,
  };
};

export const getLoadPlans = async (franchiseId, filters = {}) => {
  const db = getDb();
  const params = [franchiseId];
  let where = "WHERE lp.franchise_id = ?";
  if (filters.status) {
    where += " AND lp.status = ?";
    params.push(filters.status);
  }
  const [rows] = await db.query(
    `SELECT lp.*, r.route_code, r.origin_hub, r.destination_hub, v.vehicle_number, v.vehicle_type, d.name as driver_name, d.phone as driver_phone
     FROM load_plans lp
     JOIN fleet_routes r ON r.id = lp.route_id
     JOIN fleet_vehicles v ON v.id = lp.vehicle_id
     JOIN fleet_drivers d ON d.id = lp.driver_id
     ${where}
     ORDER BY lp.created_at DESC
     LIMIT 100`,
    params
  );
  return rows.map(buildLoadPlanMeta);
};

export const getLoadPlanDetail = async (franchiseId, loadPlanId) => {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT lp.*, r.route_code, r.origin_hub, r.destination_hub, r.via_hubs, r.distance_km, r.expected_time_hours, r.encoded_polyline,
            v.id as vehicle_id, v.vehicle_number, v.vehicle_type, v.capacity_kg, v.volume_cuft, v.fuel_type, v.gps_device_id, v.status as vehicle_status,
            v.current_hub as vehicle_current_hub, v.last_lat as vehicle_last_lat, v.last_lng as vehicle_last_lng, v.last_ping_at as vehicle_last_ping_at,
            v.created_at as vehicle_created_at, v.updated_at as vehicle_updated_at,
            d.id as driver_id, d.driver_code, d.name as driver_name, d.phone as driver_phone, d.license_number, d.license_expiry, d.status as driver_status,
            d.current_hub as driver_current_hub, d.created_at as driver_created_at, d.updated_at as driver_updated_at
     FROM load_plans lp
     JOIN fleet_routes r ON r.id = lp.route_id
     JOIN fleet_vehicles v ON v.id = lp.vehicle_id
     JOIN fleet_drivers d ON d.id = lp.driver_id
     WHERE lp.id = ? AND lp.franchise_id = ?
     LIMIT 1`,
    [loadPlanId, franchiseId]
  );
  if (!rows.length) {
    throw new Error("Load plan not found");
  }
  const planRow = rows[0];
  const [shipments] = await db.query(
    `SELECT s.id, s.shipment_cn, s.status, s.weight, s.receiver_city, s.receiver_state, s.receiver_pincode
     FROM load_plan_shipments lps
     JOIN shipments s ON s.id = lps.shipment_id
     WHERE lps.load_plan_id = ?
     ORDER BY s.created_at ASC`,
    [loadPlanId]
  );
  const plan = {
    ...planRow,
    route: {
      route_code: planRow.route_code,
      origin_hub: planRow.origin_hub,
      destination_hub: planRow.destination_hub,
      via_hubs: parseJson(planRow.via_hubs),
      distance_km: toNumber(planRow.distance_km),
      expected_time_hours: planRow.expected_time_hours ? Number(planRow.expected_time_hours) : 0,
      encoded_polyline: planRow.encoded_polyline,
    },
    vehicle: {
      id: planRow.vehicle_id,
      franchise_id: franchiseId,
      vehicle_number: planRow.vehicle_number,
      vehicle_type: planRow.vehicle_type,
      capacity_kg: planRow.capacity_kg,
      volume_cuft: planRow.volume_cuft,
      fuel_type: planRow.fuel_type,
      gps_device_id: planRow.gps_device_id,
      status: planRow.vehicle_status,
      current_hub: planRow.vehicle_current_hub,
      last_lat: planRow.vehicle_last_lat,
      last_lng: planRow.vehicle_last_lng,
      last_ping_at: planRow.vehicle_last_ping_at,
      created_at: planRow.vehicle_created_at,
      updated_at: planRow.vehicle_updated_at,
    },
    driver: {
      id: planRow.driver_id,
      franchise_id: franchiseId,
      driver_code: planRow.driver_code,
      name: planRow.driver_name,
      phone: planRow.driver_phone,
      license_number: planRow.license_number,
      license_expiry: planRow.license_expiry,
      status: planRow.driver_status,
      assigned_vehicle_id: planRow.vehicle_id,
      current_hub: planRow.driver_current_hub,
      created_at: planRow.driver_created_at,
      updated_at: planRow.driver_updated_at,
    },
    route_deviation_flag: planRow.route_deviation_flag,
    route_deviation_distance_km: planRow.route_deviation_distance_km,
    route_deviation_triggered_at: planRow.route_deviation_triggered_at,
    completion_source: planRow.completion_source,
  };
  return buildLoadPlanDetail(plan, shipments);
};

export const createLoadPlan = async (franchiseId, payload, userId) => {
  const db = getDb();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const route = await fetchRoute(conn, payload.route_id, franchiseId, true);
    if (!route) {
      throw new Error("Route not found");
    }
    const vehicle = await fetchVehicle(conn, payload.vehicle_id, franchiseId, true);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    if (vehicle.status !== VEHICLE_ASSIGNABLE_STATUS) {
      throw new Error("Vehicle is not available");
    }
    const driver = await fetchDriver(conn, payload.driver_id, franchiseId, true);
    if (!driver) {
      throw new Error("Driver not found");
    }
    if (driver.status !== DRIVER_ASSIGNABLE_STATUS) {
      throw new Error("Driver is not available");
    }
    if (new Date(driver.license_expiry) < new Date()) {
      throw new Error("Driver license expired");
    }
    const shipmentIds = Array.isArray(payload.shipment_ids) ? payload.shipment_ids : [];
    const shipments = await fetchShipmentsForLoad(conn, franchiseId, shipmentIds, true);
    const totalWeight = shipments.reduce((sum, row) => sum + toNumber(row.weight), 0);
    if (vehicle.capacity_kg && totalWeight > Number(vehicle.capacity_kg)) {
      throw new Error("Selected shipments exceed vehicle capacity");
    }
    const loadNumber = generateLoadNumber(franchiseId);
    const now = new Date();
    const eta = route.expected_time_hours
      ? new Date(now.getTime() + route.expected_time_hours * 60 * 60 * 1000)
      : new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const utilization = vehicle.capacity_kg
      ? Math.min(100, (totalWeight / Number(vehicle.capacity_kg)) * 100)
      : 0;
    const [result] = await conn.query(
      `INSERT INTO load_plans
         (franchise_id, load_number, route_id, vehicle_id, driver_id, status, total_shipments, total_weight, total_volume, utilization_percent,
          scheduled_at, dispatched_at, eta, current_leg, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'DISPATCHED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        loadNumber,
        route.id,
        vehicle.id,
        driver.id,
        shipments.length,
        totalWeight,
        payload.total_volume || 0,
        utilization,
        payload.scheduled_at || now,
        now,
        eta,
        `${route.origin_hub} → ${route.destination_hub}`,
        payload.notes || null,
        now,
        now,
      ]
    );
    const loadPlanId = result.insertId;
    await conn.query(
      `INSERT INTO load_plan_shipments (load_plan_id, shipment_id, weight)
       VALUES ?`,
      [shipments.map((row) => [loadPlanId, row.id, row.weight || 0])]
    );
    await conn.query(
      `UPDATE shipments SET status = 'HUB_OUT_SCAN', sub_status = NULL, updated_at = ? WHERE id IN (?)`,
      [now, shipments.map((row) => row.id)]
    );
    await insertStatusLogs(
      conn,
      franchiseId,
      userId,
      shipments.map((row) => ({
        shipment_id: row.id,
        from_status: row.status,
        to_status: "HUB_OUT_SCAN",
        reason: "Load dispatched",
      }))
    );
    await Promise.all(
      shipments.map((row) =>
        upsertShipmentTracking(conn, franchiseId, row.id, route.route_code, vehicle.vehicle_number)
      )
    );
    const firstPoint = decodePolyline(route.encoded_polyline)[0] || null;
    await conn.query(
      `UPDATE load_plans
       SET current_lat = ?, current_lng = ?, last_telemetry_at = ?, updated_at = ?
       WHERE id = ?`,
      [firstPoint ? firstPoint[0] : null, firstPoint ? firstPoint[1] : null, now, now, loadPlanId]
    );
    await conn.query(
      `UPDATE fleet_vehicles SET status = 'IN_TRANSIT', current_hub = ?, updated_at = ? WHERE id = ?`,
      [route.origin_hub, now, vehicle.id]
    );
    await conn.query(
      `UPDATE fleet_drivers SET status = 'ON_ROUTE', assigned_vehicle_id = ?, updated_at = ? WHERE id = ?`,
      [vehicle.id, now, driver.id]
    );
    await conn.commit();
    return getLoadPlanDetail(franchiseId, loadPlanId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const finalizeLoadPlan = async (
  conn,
  franchiseId,
  loadPlanId,
  payload = {},
  userId,
  completionSource = "MANUAL"
) => {
  const [rows] = await conn.query(
    `SELECT lp.*, r.destination_hub
     FROM load_plans lp
     JOIN fleet_routes r ON r.id = lp.route_id
     WHERE lp.id = ? AND lp.franchise_id = ? FOR UPDATE`,
    [loadPlanId, franchiseId]
  );
  if (!rows.length) {
    throw new Error("Load plan not found");
  }
  const plan = rows[0];
  if (plan.status !== "DISPATCHED") {
    throw new Error("Only dispatched loads can be completed");
  }
  const now = new Date();
  const [shipments] = await conn.query(
    `SELECT shipment_id FROM load_plan_shipments WHERE load_plan_id = ?`,
    [loadPlanId]
  );
  const shipmentIds = shipments.map((row) => row.shipment_id);
  const targetLat = normalizeCoordinate(payload.lat);
  const targetLng = normalizeCoordinate(payload.lng);
  const appliedLat = targetLat ?? plan.current_lat;
  const appliedLng = targetLng ?? plan.current_lng;
  await conn.query(
    `UPDATE load_plans SET status = 'COMPLETED', completed_at = ?, current_lat = ?, current_lng = ?, last_telemetry_at = ?, current_leg = ?, updated_at = ?, route_deviation_flag = 0, route_deviation_distance_km = 0, route_deviation_triggered_at = NULL, completion_source = ? WHERE id = ?`,
    [
      now,
      appliedLat ?? null,
      appliedLng ?? null,
      now,
      `${plan.destination_hub} arrival`,
      now,
      completionSource,
      loadPlanId,
    ]
  );
  if (shipmentIds.length) {
    await conn.query(
      `UPDATE shipments SET status = 'HUB_IN_SCAN', sub_status = NULL, updated_at = ? WHERE id IN (?)`,
      [now, shipmentIds]
    );
    await insertStatusLogs(
      conn,
      franchiseId,
      userId,
      shipmentIds.map((id) => ({
        shipment_id: id,
        from_status: "HUB_OUT_SCAN",
        to_status: "HUB_IN_SCAN",
        reason: completionSource === "GEOFENCE" ? "Auto geofence arrival" : "Load arrival",
      }))
    );
  }
  await conn.query(
    `UPDATE fleet_vehicles SET status = 'AVAILABLE', current_hub = ?, last_lat = COALESCE(?, last_lat), last_lng = COALESCE(?, last_lng), last_ping_at = ?, updated_at = ? WHERE id = ?`,
    [plan.destination_hub, appliedLat ?? plan.current_lat, appliedLng ?? plan.current_lng, now, now, plan.vehicle_id]
  );
  await conn.query(
    `UPDATE fleet_drivers SET status = 'AVAILABLE', assigned_vehicle_id = NULL, updated_at = ? WHERE id = ?`,
    [now, plan.driver_id]
  );
};

export const completeLoadPlan = async (franchiseId, loadPlanId, payload, userId) => {
  const db = getDb();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await finalizeLoadPlan(conn, franchiseId, loadPlanId, payload || {}, userId, "MANUAL");
    await conn.commit();
    return getLoadPlanDetail(franchiseId, loadPlanId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
