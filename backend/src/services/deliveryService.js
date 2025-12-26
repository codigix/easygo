import { getDb } from "../config/database.js";
import { initiateRTO } from "./hubOperationsService.js";

const ASSIGNABLE_STATUSES = ["HUB_OUT_SCAN", "IN_TRANSIT"];
const ACTIVE_ASSIGNMENT_STATUSES = ["ASSIGNED", "OUT_FOR_DELIVERY"];
export const HUB_LOCATIONS = {
  1: { id: 1, name: "Pune Hub", lat: 18.5204, lng: 73.8567 },
  2: { id: 2, name: "Mumbai Hub", lat: 19.076, lng: 72.8777 },
  3: { id: 3, name: "Delhi Hub", lat: 28.6139, lng: 77.209 },
  4: { id: 4, name: "Bangalore Hub", lat: 12.9716, lng: 77.5946 },
};

const mapFailureReasonToRTO = (reason) => {
  const normalized = (reason || "").toLowerCase();
  if (normalized.includes("refused")) return "CUSTOMER_REFUSED";
  if (normalized.includes("address")) return "ADDRESS_UNSERVICEABLE";
  if (normalized.includes("payment") || normalized.includes("cod")) return "PAYMENT_ISSUE";
  if (normalized.includes("damage")) return "DAMAGED_PARCEL";
  if (normalized.includes("lost")) return "LOST_PARCEL";
  return "DELIVERY_FAILED";
};

const buildSearchFilter = (search) => {
  if (!search) {
    return { clause: "", params: [] };
  }
  const likeValue = `%${search}%`;
  return {
    clause: " AND (s.shipment_cn LIKE ? OR s.receiver_name LIKE ? OR s.receiver_phone LIKE ?)",
    params: [likeValue, likeValue, likeValue],
  };
};

const getPaginationMeta = (total, page, limit) => {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const pages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    page: safePage,
    limit: safeLimit,
    total,
    pages,
  };
};

const insertStatusLogs = async (conn, franchiseId, userId, logs) => {
  if (!logs || logs.length === 0) {
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

export const getDeliveryExecutives = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT id, full_name, username, phone, role
     FROM users
     WHERE franchise_id = ? AND status = 'active'
     ORDER BY full_name IS NULL, full_name ASC`,
    [franchiseId]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.full_name || row.username,
    phone: row.phone || null,
    role: row.role,
  }));
};

export const getAssignableShipments = async (franchiseId, filters = {}) => {
  const db = getDb();
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 25;
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const offset = (page - 1) * limit;

  let baseQuery = `FROM shipments s
    LEFT JOIN delivery_assignments da ON da.shipment_id = s.id AND da.is_active = 1
    WHERE s.franchise_id = ?
      AND s.status IN ('HUB_OUT_SCAN', 'IN_TRANSIT')
      AND da.id IS NULL`;
  const params = [franchiseId];

  if (filters.hub_id) {
    baseQuery += " AND s.origin_hub_id = ?";
    params.push(filters.hub_id);
  }

  const searchFilter = buildSearchFilter(filters.search);
  baseQuery += searchFilter.clause;
  params.push(...searchFilter.params);

  const [shipments] = await db.query(
    `SELECT s.id, s.shipment_cn, s.receiver_name, s.receiver_phone, s.receiver_address, s.receiver_pincode,
            s.weight, s.status, s.updated_at
     ${baseQuery}
     ORDER BY s.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countResult]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    params
  );

  return {
    shipments,
    pagination: getPaginationMeta(countResult?.total || 0, page, limit),
  };
};

export const assignShipmentsToDelivery = async (payload, franchiseId, userId) => {
  const {
    shipment_ids,
    delivery_executive_id = null,
    delivery_executive_name,
    delivery_executive_phone = null,
    hub_id = null,
    route_code = null,
    route_name = null,
    vehicle_number = null,
  } = payload || {};

  if (!delivery_executive_name) {
    throw new Error("Delivery executive is required");
  }

  if (!Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    throw new Error("Select at least one shipment to assign");
  }

  const db = getDb();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [shipments] = await conn.query(
      `SELECT id, status FROM shipments WHERE franchise_id = ? AND id IN (?) FOR UPDATE`,
      [franchiseId, shipment_ids]
    );

    if (shipments.length !== shipment_ids.length) {
      throw new Error("Some shipments were not found for assignment");
    }

    const invalid = shipments.filter(
      (row) => !ASSIGNABLE_STATUSES.includes(row.status)
    );

    if (invalid.length > 0) {
      throw new Error("Only HUB_OUT_SCAN or IN_TRANSIT shipments can be assigned");
    }

    await conn.query(
      `UPDATE delivery_assignments SET is_active = 0 WHERE shipment_id IN (?) AND is_active = 1`,
      [shipment_ids]
    );

    const now = new Date();

    await conn.query(
      `UPDATE shipments SET status = 'OUT_FOR_DELIVERY', sub_status = NULL, updated_at = ? WHERE id IN (?)`,
      [now, shipment_ids]
    );

    await insertStatusLogs(
      conn,
      franchiseId,
      userId,
      shipments.map((row) => ({
        shipment_id: row.id,
        from_status: row.status,
        to_status: "OUT_FOR_DELIVERY",
        reason: "Delivery assignment",
      }))
    );

    await conn.query(
      `INSERT INTO delivery_assignments
        (franchise_id, shipment_id, delivery_executive_id, delivery_executive_name, delivery_executive_phone,
         vehicle_number, hub_id, route_code, route_name, status, is_active, assigned_by, assigned_at, created_at, updated_at)
       VALUES ?`,
      [
        shipments.map((row) => [
          franchiseId,
          row.id,
          delivery_executive_id,
          delivery_executive_name,
          delivery_executive_phone,
          vehicle_number,
          hub_id,
          route_code,
          route_name,
          "ASSIGNED",
          true,
          userId,
          now,
          now,
          now,
        ]),
      ]
    );

    await conn.commit();

    return {
      assigned: shipments.length,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getOutForDeliveryAssignments = async (franchiseId, filters = {}) => {
  const db = getDb();
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 25;
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const offset = (page - 1) * limit;

  let baseQuery = `FROM delivery_assignments da
    JOIN shipments s ON s.id = da.shipment_id
    WHERE da.franchise_id = ?
      AND da.is_active = 1
      AND da.status IN ('ASSIGNED', 'OUT_FOR_DELIVERY')`;
  const params = [franchiseId];

  if (filters.status && ACTIVE_ASSIGNMENT_STATUSES.includes(filters.status)) {
    baseQuery += " AND da.status = ?";
    params.push(filters.status);
  }

  if (filters.delivery_executive_id) {
    baseQuery += " AND da.delivery_executive_id = ?";
    params.push(filters.delivery_executive_id);
  }

  if (filters.route_code) {
    baseQuery += " AND da.route_code = ?";
    params.push(filters.route_code);
  }

  const searchFilter = buildSearchFilter(filters.search);
  baseQuery += searchFilter.clause;
  params.push(...searchFilter.params);

  const [assignments] = await db.query(
    `SELECT da.id as assignment_id, da.status as assignment_status, da.delivery_executive_name,
            da.delivery_executive_phone, da.vehicle_number, da.route_code, da.route_name,
            da.assigned_at, da.started_at, da.hub_id,
            s.id as shipment_id, s.shipment_cn, s.receiver_name, s.receiver_phone, s.receiver_address,
            s.receiver_pincode, s.weight, s.status as shipment_status
     ${baseQuery}
     ORDER BY da.assigned_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countResult]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    params
  );

  return {
    assignments,
    pagination: getPaginationMeta(countResult?.total || 0, page, limit),
  };
};

export const startDeliveryAssignment = async (assignmentId, franchiseId) => {
  const db = getDb();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[assignment]] = await conn.query(
      `SELECT da.id, da.status
       FROM delivery_assignments da
       WHERE da.id = ? AND da.franchise_id = ? AND da.is_active = 1
       FOR UPDATE`,
      [assignmentId, franchiseId]
    );

    if (!assignment) {
      throw new Error("Delivery assignment not found");
    }

    if (assignment.status !== "ASSIGNED") {
      throw new Error("Delivery already started");
    }

    const now = new Date();

    await conn.query(
      `UPDATE delivery_assignments
       SET status = 'OUT_FOR_DELIVERY', started_at = ?, updated_at = ?
       WHERE id = ?`,
      [now, now, assignmentId]
    );

    await conn.commit();

    return {
      assignment_id: assignmentId,
      status: "OUT_FOR_DELIVERY",
      started_at: now,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const completeDeliveryAssignment = async (
  assignmentId,
  franchiseId,
  payload = {},
  userId
) => {
  const {
    pod_recipient_name = null,
    pod_recipient_phone = null,
    pod_notes = null,
    pod_signature_url = null,
    pod_photo_url = null,
  } = payload;

  const db = getDb();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[assignment]] = await conn.query(
      `SELECT da.id, da.status, da.shipment_id, s.status as shipment_status
       FROM delivery_assignments da
       JOIN shipments s ON s.id = da.shipment_id
       WHERE da.id = ? AND da.franchise_id = ? AND da.is_active = 1
       FOR UPDATE`,
      [assignmentId, franchiseId]
    );

    if (!assignment) {
      throw new Error("Delivery assignment not found");
    }

    if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status)) {
      throw new Error("Only active assignments can be completed");
    }

    const now = new Date();

    await conn.query(
      `UPDATE delivery_assignments
       SET status = 'DELIVERED', delivered_at = ?, is_active = 0,
           pod_recipient_name = ?, pod_recipient_phone = ?, pod_notes = ?, pod_signature_url = ?, pod_photo_url = ?, updated_at = ?
       WHERE id = ?`,
      [
        now,
        pod_recipient_name,
        pod_recipient_phone,
        pod_notes,
        pod_signature_url,
        pod_photo_url,
        now,
        assignmentId,
      ]
    );

    await conn.query(
      `UPDATE shipments SET status = 'DELIVERED', sub_status = NULL, delivered_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, assignment.shipment_id]
    );

    await insertStatusLogs(conn, franchiseId, userId, [
      {
        shipment_id: assignment.shipment_id,
        from_status: assignment.shipment_status,
        to_status: "DELIVERED",
        reason: "Proof of delivery submitted",
        notes: pod_notes,
      },
    ]);

    await conn.commit();

    return {
      assignment_id: assignmentId,
      status: "DELIVERED",
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const failDeliveryAssignment = async (
  assignmentId,
  franchiseId,
  payload = {},
  userId
) => {
  const {
    failure_reason,
    failure_notes = null,
    initiate_rto = true,
    return_to_hub_id = null,
  } = payload;

  const db = getDb();

  const [[assignment]] = await db.query(
    `SELECT da.id, da.status, da.shipment_id, da.hub_id, s.status as shipment_status
     FROM delivery_assignments da
     JOIN shipments s ON s.id = da.shipment_id
     WHERE da.id = ? AND da.franchise_id = ? AND da.is_active = 1`,
    [assignmentId, franchiseId]
  );

  if (!assignment) {
    throw new Error("Delivery assignment not found");
  }

  if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status)) {
    throw new Error("Only active assignments can be marked failed");
  }

  if (initiate_rto) {
    await initiateRTO(
      {
        shipment_ids: [assignment.shipment_id],
        rto_reason: mapFailureReasonToRTO(failure_reason),
        notes: failure_notes,
        origin_hub_id: assignment.hub_id || return_to_hub_id || null,
        return_destination_hub_id: assignment.hub_id || return_to_hub_id || null,
      },
      franchiseId
    );
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const now = new Date();
    const statusValue = initiate_rto ? "RTO" : "FAILED";

    await conn.query(
      `UPDATE delivery_assignments
       SET status = ?, failed_at = ?, failure_reason = ?, failure_notes = ?, is_active = 0, updated_at = ?
       WHERE id = ?`,
      [statusValue, now, failure_reason || null, failure_notes, now, assignmentId]
    );

    if (!initiate_rto) {
      await conn.query(
        `UPDATE shipments SET status = 'IN_TRANSIT', sub_status = NULL, updated_at = ? WHERE id = ?`,
        [now, assignment.shipment_id]
      );

      await insertStatusLogs(conn, franchiseId, userId, [
        {
          shipment_id: assignment.shipment_id,
          from_status: assignment.shipment_status,
          to_status: "IN_TRANSIT",
          reason: failure_reason || "Delivery failed",
          notes: failure_notes,
        },
      ]);
    } else {
      await insertStatusLogs(conn, franchiseId, userId, [
        {
          shipment_id: assignment.shipment_id,
          from_status: assignment.shipment_status,
          to_status: "RTO",
          reason: failure_reason || "Delivery failed - RTO initiated",
          notes: failure_notes,
        },
      ]);
    }

    await conn.commit();

    return {
      assignment_id: assignmentId,
      status: statusValue,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getFailedDeliveries = async (franchiseId, filters = {}) => {
  const db = getDb();
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 25;
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const offset = (page - 1) * limit;

  let baseQuery = `FROM delivery_assignments da
    JOIN shipments s ON s.id = da.shipment_id
    WHERE da.franchise_id = ?
      AND da.status IN ('FAILED', 'RTO')`;
  const params = [franchiseId];

  if (filters.failure_reason) {
    baseQuery += " AND da.failure_reason = ?";
    params.push(filters.failure_reason);
  }

  const searchFilter = buildSearchFilter(filters.search);
  baseQuery += searchFilter.clause;
  params.push(...searchFilter.params);

  const [failures] = await db.query(
    `SELECT da.id as assignment_id, da.status as assignment_status, da.failure_reason, da.failure_notes,
            da.failed_at, da.delivery_executive_name, da.delivery_executive_phone,
            s.id as shipment_id, s.shipment_cn, s.receiver_name, s.receiver_phone, s.receiver_address,
            s.status as shipment_status
     ${baseQuery}
     ORDER BY da.failed_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countResult]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    params
  );

  return {
    failures,
    pagination: getPaginationMeta(countResult?.total || 0, page, limit),
  };
};

export const getDeliveryPerformanceMetrics = async (franchiseId, filters = {}) => {
  const db = getDb();
  const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
  const startDate = filters.start_date
    ? new Date(filters.start_date)
    : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [summaryRows] = await db.query(
    `SELECT
       COUNT(*) as total_assignments,
       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
       SUM(CASE WHEN status IN ('FAILED', 'RTO') THEN 1 ELSE 0 END) as failed,
       SUM(CASE WHEN status = 'RTO' THEN 1 ELSE 0 END) as rto_count,
       SUM(CASE WHEN status IN ('ASSIGNED', 'OUT_FOR_DELIVERY') THEN 1 ELSE 0 END) as active
     FROM delivery_assignments
     WHERE franchise_id = ? AND DATE(assigned_at) BETWEEN ? AND ?`,
    [franchiseId, startDate, endDate]
  );

  const summary = summaryRows[0] || {};

  const [onTimeRows] = await db.query(
    `SELECT
        SUM(CASE WHEN status = 'DELIVERED' AND TIMESTAMPDIFF(MINUTE, assigned_at, delivered_at) <= 480 THEN 1 ELSE 0 END) as on_time
     FROM delivery_assignments
     WHERE franchise_id = ? AND status = 'DELIVERED' AND DATE(assigned_at) BETWEEN ? AND ?`,
    [franchiseId, startDate, endDate]
  );

  const delivered = Number(summary.delivered || 0);
  const onTime = Number(onTimeRows[0]?.on_time || 0);
  const onTimeRate = delivered === 0 ? 0 : Math.round((onTime / delivered) * 100);

  const [executiveRows] = await db.query(
    `SELECT delivery_executive_name as name,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status IN ('FAILED', 'RTO') THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status IN ('ASSIGNED', 'OUT_FOR_DELIVERY') THEN 1 ELSE 0 END) as active
     FROM delivery_assignments
     WHERE franchise_id = ? AND DATE(assigned_at) BETWEEN ? AND ?
     GROUP BY delivery_executive_name
     ORDER BY delivered DESC
     LIMIT 5`,
    [franchiseId, startDate, endDate]
  );

  const [dailyRows] = await db.query(
    `SELECT DATE(assigned_at) as day,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status IN ('FAILED', 'RTO') THEN 1 ELSE 0 END) as failed
     FROM delivery_assignments
     WHERE franchise_id = ? AND DATE(assigned_at) BETWEEN ? AND ?
     GROUP BY DATE(assigned_at)
     ORDER BY day DESC
     LIMIT 14`,
    [franchiseId, startDate, endDate]
  );

  return {
    summary: {
      total_assignments: Number(summary.total_assignments || 0),
      delivered,
      failed: Number(summary.failed || 0),
      rto_count: Number(summary.rto_count || 0),
      active: Number(summary.active || 0),
      on_time_rate: onTimeRate,
    },
    executives: executiveRows,
    timeline: dailyRows.reverse(),
    window: {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    },
  };
};

export const getLiveTrackingShipments = async (franchiseId) => {
  const db = getDb();

  const [rows] = await db.query(
    `SELECT s.id as shipment_id, s.shipment_cn, s.receiver_name, s.receiver_phone, s.status,
            da.status as assignment_status, da.delivery_executive_name, da.vehicle_number, da.route_code, da.route_name, da.hub_id,
            sht.current_hub_id, sht.current_hub_in_scan_time, sht.current_hub_out_scan_time,
            sht.next_hub_id, sht.route_code as tracking_route_code, sht.vehicle_id as tracking_vehicle_id
     FROM shipments s
     LEFT JOIN delivery_assignments da ON da.shipment_id = s.id AND da.is_active = 1
     LEFT JOIN shipment_hub_tracking sht ON sht.shipment_id = s.id
     WHERE s.franchise_id = ? AND s.status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RTO')`,
    [franchiseId]
  );

  return rows.map((row) => {
    const hub =
      HUB_LOCATIONS[row.current_hub_id] ||
      HUB_LOCATIONS[row.hub_id] ||
      (row.next_hub_id ? HUB_LOCATIONS[row.next_hub_id] : null);

    return {
      shipment_id: row.shipment_id,
      shipment_cn: row.shipment_cn,
      receiver_name: row.receiver_name,
      receiver_phone: row.receiver_phone,
      shipment_status: row.status,
      assignment_status: row.assignment_status,
      delivery_executive_name: row.delivery_executive_name,
      vehicle_number: row.vehicle_number || row.tracking_vehicle_id,
      route_code: row.route_code || row.tracking_route_code,
      route_name: row.route_name,
      hub,
    };
  });
};
