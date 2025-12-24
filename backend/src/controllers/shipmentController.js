import { getDb } from "../config/database.js";
import {
  createShipment,
  getShipmentById,
  validateShipmentData,
  validateBulkShipmentRow,
  checkShipmentCanBeEdited,
  checkShipmentCanBeDeleted,
  createException,
  resolveException,
} from "../services/shipmentService.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

export const createNewShipment = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const data = req.body;
    data.shipment_source = data.shipment_source || "MANUAL";

    const shipment = await createShipment(data, franchiseId);

    res.json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create shipment",
    });
  }
};

export const getShipments = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { page = 1, limit = 20, status, search, shipment_source } = req.query;
    const offset = (page - 1) * limit;

    const db = getDb();
    let whereClause = "WHERE franchise_id = ?";
    const params = [franchiseId];

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (shipment_source) {
      whereClause += " AND shipment_source = ?";
      params.push(shipment_source);
    }

    if (search) {
      whereClause +=
        " AND (shipment_cn LIKE ? OR receiver_name LIKE ? OR receiver_phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM shipments ${whereClause}`,
      params
    );

    // Get shipments
    const [shipments] = await db.query(
      `SELECT * FROM shipments ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: {
        shipments: shipments || [],
        pagination: {
          total: countResult[0]?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((countResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};

export const getShipmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;

    const shipment = await getShipmentById(id, franchiseId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Get exceptions if any
    const db = getDb();
    const [exceptions] = await db.query(
      "SELECT * FROM shipment_exceptions WHERE shipment_id = ? ORDER BY created_at DESC",
      [id]
    );

    res.json({
      success: true,
      data: {
        shipment,
        exceptions: exceptions || [],
      },
    });
  } catch (error) {
    console.error("Get shipment detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipment",
    });
  }
};

export const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, manifested_at, delivered_at } = req.body;
    const franchiseId = req.user.franchise_id;

    const shipment = await getShipmentById(id, franchiseId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Validate status transitions
    const validStatuses = [
      "CREATED",
      "MANIFESTED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "RTO",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Cannot modify if exception exists
    if (shipment.status === "EXCEPTION") {
      return res.status(400).json({
        success: false,
        message: "Cannot update shipment with active exception",
      });
    }

    const db = getDb();
    const now = new Date();
    const updates = {
      status,
      updated_at: now,
      ...(manifested_at && { manifested_at }),
      ...(delivered_at && { delivered_at }),
    };

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), id, franchiseId];

    await db.query(
      `UPDATE shipments SET ${setClause} WHERE id = ? AND franchise_id = ?`,
      values
    );

    res.json({
      success: true,
      message: "Shipment status updated successfully",
    });
  } catch (error) {
    console.error("Update shipment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update shipment",
    });
  }
};

export const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;

    // Check if can be deleted
    await checkShipmentCanBeDeleted(id, franchiseId);

    const db = getDb();
    await db.query("DELETE FROM shipments WHERE id = ? AND franchise_id = ?", [
      id,
      franchiseId,
    ]);

    res.json({
      success: true,
      message: "Shipment deleted successfully",
    });
  } catch (error) {
    console.error("Delete shipment error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete shipment",
    });
  }
};

export const bulkUploadShipments = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Clean temp file
    fs.unlinkSync(req.file.path);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    const successIds = [];
    const errors = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and include header

      // Validate row
      const validation = validateBulkShipmentRow(row, rowNumber);

      if (!validation.isValid) {
        errors.push(...validation.errors);
        continue;
      }

      // Create shipment
      try {
        const shipmentData = {
          sender_name: row.sender_name,
          sender_phone: row.sender_phone,
          sender_address: row.sender_address,
          sender_pincode: row.sender_pincode,
          sender_city: row.sender_city,
          sender_state: row.sender_state,
          receiver_name: row.receiver_name,
          receiver_phone: row.receiver_phone,
          receiver_address: row.receiver_address,
          receiver_pincode: row.receiver_pincode,
          receiver_city: row.receiver_city,
          receiver_state: row.receiver_state,
          weight: row.weight,
          dimensions: row.dimensions,
          pieces: row.pieces || 1,
          content_description: row.content_description,
          declared_value: row.declared_value,
          service_type: row.service_type,
          shipment_source: "BULK",
        };

        const shipment = await createShipment(shipmentData, franchiseId);
        successIds.push(shipment.id);
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    res.json({
      success: errors.length === 0,
      message: `Processed ${rows.length} rows. Created ${successIds.length} shipments.`,
      data: {
        total_rows: rows.length,
        success_count: successIds.length,
        error_count: errors.length,
        shipment_ids: successIds,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk upload",
    });
  }
};

export const createShipmentException = async (req, res) => {
  try {
    const { id } = req.params;
    const { exception_type, description } = req.body;
    const franchiseId = req.user.franchise_id;

    if (!exception_type) {
      return res.status(400).json({
        success: false,
        message: "Exception type is required",
      });
    }

    const exception = await createException(
      id,
      {
        exception_type,
        description,
      },
      franchiseId
    );

    res.json({
      success: true,
      message: "Exception created successfully",
      data: exception,
    });
  } catch (error) {
    console.error("Create exception error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create exception",
    });
  }
};

export const resolveShipmentException = async (req, res) => {
  try {
    const { id, exceptionId } = req.params;
    const { status, resolution_notes, new_status } = req.body;
    const franchiseId = req.user.franchise_id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    await resolveException(
      exceptionId,
      {
        status,
        resolution_notes,
        new_status,
      },
      franchiseId
    );

    res.json({
      success: true,
      message: "Exception resolved successfully",
    });
  } catch (error) {
    console.error("Resolve exception error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to resolve exception",
    });
  }
};

export const getShipmentExceptions = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const db = getDb();
    let whereClause = "WHERE se.franchise_id = ?";
    const params = [franchiseId];

    if (status) {
      whereClause += " AND se.status = ?";
      params.push(status);
    }

    // Get count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM shipment_exceptions se ${whereClause}`,
      params
    );

    // Get exceptions with shipment info
    const [exceptions] = await db.query(
      `SELECT se.*, s.shipment_cn, s.receiver_name, s.receiver_phone, s.status as shipment_status
       FROM shipment_exceptions se
       JOIN shipments s ON se.shipment_id = s.id
       ${whereClause}
       ORDER BY se.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: {
        exceptions: exceptions || [],
        pagination: {
          total: countResult[0]?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((countResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get exceptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exceptions",
    });
  }
};
