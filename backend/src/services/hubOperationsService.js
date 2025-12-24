import { getDb } from "../config/database.js";

const generateManifestNumber = async (franchiseId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `MF-${franchiseId}-${dateStr}-${randomStr}`;
};

const generateRTOManifestNumber = async (franchiseId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RTO-${franchiseId}-${dateStr}-${randomStr}`;
};

export const validateManifestCreation = (data) => {
  const errors = [];

  if (!data.origin_hub_id) errors.push("Origin hub is required");
  if (!data.courier_company_id) errors.push("Courier company is required");
  if (!data.shipment_ids || data.shipment_ids.length === 0) {
    errors.push("At least one shipment is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createManifest = async (data, franchiseId) => {
  const db = getDb();
  const validation = validateManifestCreation(data);

  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  const manifestNumber = await generateManifestNumber(franchiseId);
  const now = new Date();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [shipments] = await conn.query(
      `SELECT id, total_charge, weight FROM shipments 
       WHERE id IN (?) AND franchise_id = ? AND status = 'CREATED'`,
      [data.shipment_ids, franchiseId]
    );

    if (shipments.length !== data.shipment_ids.length) {
      throw new Error("Some shipments are not in CREATED status or belong to different franchise");
    }

    const totalWeight = shipments.reduce((sum, s) => sum + parseFloat(s.weight), 0);
    const totalCharge = shipments.reduce((sum, s) => sum + parseFloat(s.total_charge), 0);

    const [manifestResult] = await conn.query(
      `INSERT INTO manifests 
       (franchise_id, manifest_number, courier_company_id, origin_hub_id, status, total_shipments, total_weight, total_charge, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        manifestNumber,
        data.courier_company_id,
        data.origin_hub_id,
        "OPEN",
        shipments.length,
        totalWeight,
        totalCharge,
        now,
        now,
      ]
    );

    const manifestId = manifestResult.insertId;

    for (const shipment of shipments) {
      await conn.query(
        `INSERT INTO manifest_shipments (manifest_id, shipment_id, franchise_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [manifestId, shipment.id, franchiseId, now, now]
      );

      await conn.query(
        `UPDATE shipments SET status = 'MANIFESTED', updated_at = ? WHERE id = ?`,
        [now, shipment.id]
      );
    }

    await conn.commit();

    return {
      id: manifestId,
      manifest_number: manifestNumber,
      status: "OPEN",
      total_shipments: shipments.length,
      total_weight: totalWeight,
      total_charge: totalCharge,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getManifests = async (franchiseId, filters = {}) => {
  const db = getDb();

  let query = `SELECT m.*, 
    COUNT(ms.id) as shipment_count,
    SUM(s.weight) as weight_sum
    FROM manifests m
    LEFT JOIN manifest_shipments ms ON m.id = ms.manifest_id
    LEFT JOIN shipments s ON ms.shipment_id = s.id
    WHERE m.franchise_id = ?`;

  const params = [franchiseId];

  if (filters.status) {
    query += ` AND m.status = ?`;
    params.push(filters.status);
  }

  if (filters.origin_hub_id) {
    query += ` AND m.origin_hub_id = ?`;
    params.push(filters.origin_hub_id);
  }

  if (filters.courier_company_id) {
    query += ` AND m.courier_company_id = ?`;
    params.push(filters.courier_company_id);
  }

  query += ` GROUP BY m.id ORDER BY m.created_at DESC LIMIT ? OFFSET ?`;
  params.push(20, (filters.page - 1) * 20 || 0);

  const [manifests] = await db.query(query, params);
  return manifests;
};

export const getManifestById = async (manifestId, franchiseId) => {
  const db = getDb();

  const [manifests] = await db.query(
    `SELECT * FROM manifests WHERE id = ? AND franchise_id = ?`,
    [manifestId, franchiseId]
  );

  if (manifests.length === 0) return null;

  const manifest = manifests[0];

  const [shipments] = await db.query(
    `SELECT s.*, ms.status as manifest_status 
     FROM shipments s
     JOIN manifest_shipments ms ON s.id = ms.shipment_id
     WHERE ms.manifest_id = ?`,
    [manifestId]
  );

  manifest.shipments = shipments;
  return manifest;
};

export const closeManifest = async (manifestId, franchiseId) => {
  const db = getDb();

  const [manifests] = await db.query(
    `SELECT status FROM manifests WHERE id = ? AND franchise_id = ?`,
    [manifestId, franchiseId]
  );

  if (manifests.length === 0) {
    throw new Error("Manifest not found");
  }

  if (manifests[0].status !== "OPEN") {
    throw new Error("Only OPEN manifests can be closed");
  }

  const now = new Date();
  await db.query(
    `UPDATE manifests SET status = 'CLOSED', closed_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, manifestId]
  );

  return { success: true };
};

export const hubInScan = async (data, franchiseId) => {
  const db = getDb();
  const { shipment_cn, hub_id, scanned_by, device_id = null } = data;

  const [shipments] = await db.query(
    `SELECT s.*, m.origin_hub_id, m.status as manifest_status FROM shipments s
     LEFT JOIN manifest_shipments ms ON s.id = ms.shipment_id
     LEFT JOIN manifests m ON ms.manifest_id = m.id
     WHERE s.shipment_cn = ? AND s.franchise_id = ?`,
    [shipment_cn, franchiseId]
  );

  if (shipments.length === 0) {
    throw new Error("Shipment not found");
  }

  const shipment = shipments[0];

  if (shipment.status !== "MANIFESTED") {
    throw new Error("Shipment must be MANIFESTED to in-scan at hub");
  }

  if (!shipment.manifest_status || (shipment.manifest_status !== "CLOSED" && shipment.manifest_status !== "PICKUP_ASSIGNED")) {
    throw new Error("Manifest must be CLOSED or PICKUP_ASSIGNED before hub scan");
  }

  const [existingScan] = await db.query(
    `SELECT id FROM hub_scans WHERE shipment_id = ? AND scan_type = 'IN_SCAN' AND status = 'SCANNED'`,
    [shipment.id]
  );

  if (existingScan.length > 0) {
    throw new Error("Shipment already in-scanned at this hub");
  }

  const now = new Date();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [scanResult] = await conn.query(
      `INSERT INTO hub_scans 
       (shipment_id, franchise_id, hub_id, scan_type, status, scanned_by, device_id, scan_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipment.id, franchiseId, hub_id, "IN_SCAN", "SCANNED", scanned_by, device_id, now, now, now]
    );

    await conn.query(
      `UPDATE shipments SET status = 'HUB_IN_SCAN', updated_at = ? WHERE id = ?`,
      [now, shipment.id]
    );

    await conn.query(
      `INSERT INTO shipment_hub_tracking (shipment_id, franchise_id, current_hub_id, current_hub_in_scan_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       current_hub_id = ?, 
       current_hub_in_scan_time = ?,
       updated_at = ?`,
      [shipment.id, franchiseId, hub_id, now, now, now, hub_id, now, now]
    );

    await conn.commit();

    return {
      scan_id: scanResult.insertId,
      shipment_cn,
      status: "HUB_IN_SCAN",
      hub_id,
      scan_time: now,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const hubOutScan = async (data, franchiseId) => {
  const db = getDb();
  const { shipment_cn, hub_id, next_hub_id, route_code = null, vehicle_id = null } = data;

  const [shipments] = await db.query(
    `SELECT s.* FROM shipments s WHERE s.shipment_cn = ? AND s.franchise_id = ?`,
    [shipment_cn, franchiseId]
  );

  if (shipments.length === 0) {
    throw new Error("Shipment not found");
  }

  const shipment = shipments[0];

  if (shipment.status !== "HUB_IN_SCAN") {
    throw new Error("Shipment must be HUB_IN_SCAN to out-scan");
  }

  const [inScan] = await db.query(
    `SELECT id FROM hub_scans WHERE shipment_id = ? AND scan_type = 'IN_SCAN' AND hub_id = ? AND status = 'SCANNED'`,
    [shipment.id, hub_id]
  );

  if (inScan.length === 0) {
    throw new Error("Shipment was not in-scanned at this hub");
  }

  const [existingOutScan] = await db.query(
    `SELECT id FROM hub_scans WHERE shipment_id = ? AND scan_type = 'OUT_SCAN' AND hub_id = ? AND status = 'SCANNED'`,
    [shipment.id, hub_id]
  );

  if (existingOutScan.length > 0) {
    throw new Error("Shipment already out-scanned from this hub");
  }

  const now = new Date();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [scanResult] = await conn.query(
      `INSERT INTO hub_scans 
       (shipment_id, franchise_id, hub_id, scan_type, status, scanned_by, scan_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipment.id, franchiseId, hub_id, "OUT_SCAN", "SCANNED", data.scanned_by, now, now, now]
    );

    const nextStatus = next_hub_id ? "IN_TRANSIT" : "OUT_FOR_DELIVERY";

    await conn.query(
      `UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`,
      [nextStatus, now, shipment.id]
    );

    await conn.query(
      `UPDATE shipment_hub_tracking 
       SET current_hub_out_scan_time = ?, next_hub_id = ?, route_code = ?, vehicle_id = ?, updated_at = ?
       WHERE shipment_id = ?`,
      [now, next_hub_id || null, route_code, vehicle_id, now, shipment.id]
    );

    await conn.commit();

    return {
      scan_id: scanResult.insertId,
      shipment_cn,
      status: nextStatus,
      hub_id,
      next_hub_id: next_hub_id || null,
      scan_time: now,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const remanifest = async (data, franchiseId) => {
  const db = getDb();
  const { manifest_id, shipment_ids, reason = null } = data;

  const [manifest] = await db.query(
    `SELECT * FROM manifests WHERE id = ? AND franchise_id = ?`,
    [manifest_id, franchiseId]
  );

  if (manifest.length === 0) {
    throw new Error("Manifest not found");
  }

  if (manifest[0].status === "CANCELLED") {
    throw new Error("Cannot remanifest from cancelled manifest");
  }

  const now = new Date();
  const newManifestNumber = await generateManifestNumber(franchiseId);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [shippingDetails] = await conn.query(
      `SELECT SUM(s.weight) as total_weight, SUM(s.total_charge) as total_charge, COUNT(s.id) as shipment_count
       FROM shipments s
       WHERE s.id IN (?) AND s.franchise_id = ?`,
      [shipment_ids, franchiseId]
    );

    const newTotalWeight = shippingDetails[0]?.total_weight || 0;
    const newTotalCharge = shippingDetails[0]?.total_charge || 0;
    const shipmentCount = shippingDetails[0]?.shipment_count || 0;

    const [newManifestResult] = await conn.query(
      `INSERT INTO manifests 
       (franchise_id, manifest_number, courier_company_id, origin_hub_id, status, total_shipments, total_weight, total_charge, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        newManifestNumber,
        manifest[0].courier_company_id,
        manifest[0].origin_hub_id,
        "OPEN",
        shipmentCount,
        newTotalWeight,
        newTotalCharge,
        `Re-manifested from ${manifest[0].manifest_number}. Reason: ${reason || "System remanifest"}`,
        now,
        now,
      ]
    );

    const newManifestId = newManifestResult.insertId;

    for (const shipmentId of shipment_ids) {
      await conn.query(
        `INSERT INTO manifest_shipments (manifest_id, shipment_id, franchise_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newManifestId, shipmentId, franchiseId, "ADDED", now, now]
      );

      await conn.query(
        `UPDATE manifest_shipments SET status = 'REMOVED' 
         WHERE manifest_id = ? AND shipment_id = ?`,
        [manifest_id, shipmentId]
      );
    }

    const [remainingShipments] = await conn.query(
      `SELECT SUM(s.weight) as total_weight, SUM(s.total_charge) as total_charge, COUNT(s.id) as shipment_count
       FROM shipments s
       JOIN manifest_shipments ms ON s.id = ms.shipment_id
       WHERE ms.manifest_id = ? AND ms.status = 'ADDED'`,
      [manifest_id]
    );

    const oldTotalWeight = remainingShipments[0]?.total_weight || 0;
    const oldTotalCharge = remainingShipments[0]?.total_charge || 0;
    const oldShipmentCount = remainingShipments[0]?.shipment_count || 0;

    await conn.query(
      `UPDATE manifests SET total_shipments = ?, total_weight = ?, total_charge = ?, updated_at = ? WHERE id = ?`,
      [oldShipmentCount, oldTotalWeight, oldTotalCharge, now, manifest_id]
    );

    await conn.commit();

    return {
      new_manifest_id: newManifestId,
      new_manifest_number: newManifestNumber,
      shipments_remanifested: shipment_ids.length,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const initiateRTO = async (data, franchiseId) => {
  const db = getDb();
  const {
    shipment_ids,
    rto_reason,
    notes = null,
    origin_hub_id: originHubOverride = null,
    return_destination_hub_id: returnDestinationHubIdInput = null,
  } = data;

  const rtoManifestNumber = await generateRTOManifestNumber(franchiseId);
  const now = new Date();

  const [shipments] = await db.query(
    `SELECT s.id, s.shipment_cn, s.sender_pincode, s.receiver_pincode, s.status,
            ms.manifest_id, m.origin_hub_id,
            sht.current_hub_id, latest_scan.hub_id as last_scan_hub_id
     FROM shipments s 
     LEFT JOIN (
       SELECT ms1.*
       FROM manifest_shipments ms1
       JOIN (
         SELECT shipment_id, MAX(id) as max_id
         FROM manifest_shipments
         GROUP BY shipment_id
       ) latest ON ms1.shipment_id = latest.shipment_id AND ms1.id = latest.max_id
     ) ms ON s.id = ms.shipment_id
     LEFT JOIN manifests m ON ms.manifest_id = m.id
     LEFT JOIN shipment_hub_tracking sht ON s.id = sht.shipment_id
     LEFT JOIN (
       SELECT hs1.shipment_id, hs1.hub_id
       FROM hub_scans hs1
       JOIN (
         SELECT shipment_id, MAX(id) as max_id
         FROM hub_scans
         WHERE status = 'SCANNED'
         GROUP BY shipment_id
       ) latest_hs ON hs1.shipment_id = latest_hs.shipment_id AND hs1.id = latest_hs.max_id
     ) latest_scan ON latest_scan.shipment_id = s.id
     WHERE s.id IN (?) AND s.franchise_id = ?`,
    [shipment_ids, franchiseId]
  );

  if (shipments.length === 0) {
    throw new Error("Shipments not found");
  }

  const currentHubId = shipments.find((shipment) => shipment.current_hub_id)?.current_hub_id;
  const manifestOriginHubId = shipments.find((shipment) => shipment.origin_hub_id)?.origin_hub_id;
  const lastScanHubId = shipments.find((shipment) => shipment.last_scan_hub_id)?.last_scan_hub_id;
  const originHubId = originHubOverride || currentHubId || manifestOriginHubId || lastScanHubId;

  if (!originHubId) {
    throw new Error("Origin hub could not be determined for selected shipments");
  }

  const returnDestinationHubId = returnDestinationHubIdInput || originHubId;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rtoResult] = await conn.query(
      `INSERT INTO rto_manifests 
       (franchise_id, rto_manifest_number, rto_reason, status, total_shipments, origin_shipment_hub_id, return_destination_hub_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        rtoManifestNumber,
        rto_reason,
        "INITIATED",
        shipment_ids.length,
        originHubId,
        returnDestinationHubId,
        notes,
        now,
        now,
      ]
    );

    for (const shipment of shipments) {
      await conn.query(
        `UPDATE shipments SET status = 'RTO', updated_at = ? WHERE id = ?`,
        [now, shipment.id]
      );
    }

    await conn.commit();

    return {
      rto_id: rtoResult.insertId,
      rto_manifest_number: rtoManifestNumber,
      shipments_count: shipment_ids.length,
      status: "INITIATED",
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getRTOManifests = async (franchiseId, filters = {}) => {
  const db = getDb();

  let query = `SELECT * FROM rto_manifests WHERE franchise_id = ?`;
  const params = [franchiseId];

  if (filters.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(20, (filters.page - 1) * 20 || 0);

  const [rtos] = await db.query(query, params);
  return rtos;
};

export const completeRTO = async (rtoId, franchiseId) => {
  const db = getDb();

  const [rtos] = await db.query(
    `SELECT * FROM rto_manifests WHERE id = ? AND franchise_id = ?`,
    [rtoId, franchiseId]
  );

  if (rtos.length === 0) {
    throw new Error("RTO manifest not found");
  }

  const now = new Date();
  await db.query(
    `UPDATE rto_manifests SET status = 'RETURNED', returned_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, rtoId]
  );

  return { success: true };
};
