import { getDb } from "../config/database.js";

const generatePickupRequestId = async (franchiseId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `PKP-${franchiseId}-${dateStr}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const createPickupRequest = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const {
      pickupDate,
      timeSlot,
      pickupType,
      priority,
      customerName,
      mobileNumber,
      email,
      companyName,
      addressLine,
      city,
      pincode,
      zone,
      noOfParcels,
      approxWeight,
      serviceType,
      paymentMode,
      specialInstructions,
      isFragile,
    } = req.body;

    if (!pickupDate || !timeSlot || !customerName || !mobileNumber || !addressLine || !city || !pincode || !noOfParcels) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const pickupRequestId = await generatePickupRequestId(franchiseId);
    const now = new Date();

    const [result] = await db.query(
      `INSERT INTO pickup_requests 
       (franchise_id, pickup_request_id, pickup_date, time_slot, pickup_type, priority, 
        customer_name, mobile_number, email, company_name, address_line, city, pincode, zone,
        no_of_parcels, approx_weight, service_type, payment_mode, special_instructions, 
        is_fragile, status, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        pickupRequestId,
        pickupDate,
        timeSlot,
        pickupType || "Door Pickup",
        priority || "Normal",
        customerName,
        mobileNumber,
        email || null,
        companyName || null,
        addressLine,
        city,
        pincode,
        zone || "Auto",
        noOfParcels,
        approxWeight || null,
        serviceType || "NON-DOX",
        paymentMode || "Prepaid",
        specialInstructions || null,
        isFragile ? 1 : 0,
        "REQUESTED",
        now,
      ]
    );

    res.json({
      success: true,
      message: "Pickup request created successfully",
      data: {
        id: result.insertId,
        pickupRequestId,
        status: "REQUESTED",
      },
    });
  } catch (error) {
    console.error("Create pickup request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pickup request",
    });
  }
};

export const getPickupRequests = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const db = getDb();
    let whereClause = "WHERE franchise_id = ?";
    const params = [franchiseId];

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (pickup_request_id LIKE ? OR customer_name LIKE ? OR mobile_number LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const countParams = [...params];
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM pickup_requests ${whereClause}`,
      countParams
    );

    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    const [pickups] = await db.query(
      `SELECT * FROM pickup_requests ${whereClause} 
       ORDER BY pickup_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      queryParams
    );

    res.json({
      success: true,
      data: {
        pickups: pickups || [],
        pagination: {
          total: countResult[0]?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((countResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get pickup requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup requests",
      error: error.message,
    });
  }
};

export const getPickupRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const [pickups] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (pickups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    res.json({
      success: true,
      data: pickups[0],
    });
  } catch (error) {
    console.error("Get pickup request by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup request",
    });
  }
};

export const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, failureReason, driverName, vehicleNo, routeArea, expectedPickupTime } = req.body;
    const franchiseId = req.user.franchise_id;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    const updateData = {
      status: status || existing[0].status,
      last_updated: now,
      remarks: remarks !== undefined ? remarks : existing[0].remarks,
    };

    if (failureReason !== undefined) updateData.failure_reason = failureReason;
    if (driverName !== undefined) updateData.driver_name = driverName;
    if (vehicleNo !== undefined) updateData.vehicle_no = vehicleNo;
    if (routeArea !== undefined) updateData.route_area = routeArea;
    if (expectedPickupTime !== undefined) updateData.expected_pickup_time = expectedPickupTime;

    const setClause = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updateData), id, franchiseId];

    await db.query(
      `UPDATE pickup_requests SET ${setClause} WHERE id = ? AND franchise_id = ?`,
      values
    );

    res.json({
      success: true,
      message: "Pickup request updated successfully",
    });
  } catch (error) {
    console.error("Update pickup request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pickup request",
    });
  }
};

export const schedulePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, timeSlot } = req.body;
    const franchiseId = req.user.franchise_id;
    const db = getDb();
    const now = new Date();

    if (!pickupDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Pickup date and time slot are required",
      });
    }

    const [existing] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    await db.query(
      `UPDATE pickup_requests 
       SET status = 'SCHEDULED', pickup_date = ?, time_slot = ?, last_updated = ? 
       WHERE id = ? AND franchise_id = ?`,
      [pickupDate, timeSlot, now, id, franchiseId]
    );

    res.json({
      success: true,
      message: "Pickup scheduled successfully",
    });
  } catch (error) {
    console.error("Schedule pickup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule pickup",
    });
  }
};

export const assignPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, vehicleNo, routeArea, expectedPickupTime } = req.body;
    const franchiseId = req.user.franchise_id;
    const db = getDb();
    const now = new Date();

    if (!driverName) {
      return res.status(400).json({
        success: false,
        message: "Driver name is required",
      });
    }

    const [existing] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    await db.query(
      `UPDATE pickup_requests 
       SET status = 'ASSIGNED', driver_name = ?, vehicle_no = ?, route_area = ?, 
           expected_pickup_time = ?, last_updated = ? 
       WHERE id = ? AND franchise_id = ?`,
      [driverName, vehicleNo || null, routeArea || null, expectedPickupTime || null, now, id, franchiseId]
    );

    res.json({
      success: true,
      message: "Pickup assigned successfully",
    });
  } catch (error) {
    console.error("Assign pickup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign pickup",
    });
  }
};

export const markPickupComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    await db.query(
      `UPDATE pickup_requests 
       SET status = 'PICKED_UP', last_updated = ? 
       WHERE id = ? AND franchise_id = ?`,
      [now, id, franchiseId]
    );

    res.json({
      success: true,
      message: "Pickup marked as completed",
    });
  } catch (error) {
    console.error("Mark pickup complete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete pickup",
    });
  }
};

export const markPickupFailed = async (req, res) => {
  try {
    const { id } = req.params;
    const { failureReason, remarks } = req.body;
    const franchiseId = req.user.franchise_id;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.query(
      `SELECT * FROM pickup_requests WHERE id = ? AND franchise_id = ?`,
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    await db.query(
      `UPDATE pickup_requests 
       SET status = 'FAILED', failure_reason = ?, remarks = ?, last_updated = ? 
       WHERE id = ? AND franchise_id = ?`,
      [failureReason || null, remarks || null, now, id, franchiseId]
    );

    res.json({
      success: true,
      message: "Pickup marked as failed",
    });
  } catch (error) {
    console.error("Mark pickup failed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark pickup as failed",
    });
  }
};

export const getPickupStats = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const [stats] = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM pickup_requests 
       WHERE franchise_id = ?
       GROUP BY status`,
      [franchiseId]
    );

    const result = {
      REQUESTED: 0,
      SCHEDULED: 0,
      ASSIGNED: 0,
      PICKED_UP: 0,
      FAILED: 0,
    };

    if (stats && Array.isArray(stats)) {
      stats.forEach((row) => {
        if (result.hasOwnProperty(row.status)) {
          result[row.status] = row.count;
        }
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get pickup stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup stats",
      error: error.message,
    });
  }
};
