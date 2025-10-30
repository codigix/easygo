import { getDb } from "../config/database.js";
import { calculateBookingRate } from "../services/rateCalculationService.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";

const upload = multer({ dest: "uploads/temp/" });

/**
 * ============================================================================
 * CORRECTED BOOKING CONTROLLER
 * ============================================================================
 *
 * CHANGES FROM OLD VERSION:
 * ✅ Uses correct database field names from bookings table
 * ✅ No manual char_wt input - calculates from document
 * ✅ No manual dtdc_amt - calculates from rate master
 * ✅ Includes all required sender/receiver details
 * ✅ Generates booking_number automatically
 * ✅ Proper field mapping: weight, pieces, service_type, freight_charge, etc.
 * ✅ Lowercase status values (booked, not Booked)
 * ✅ Calculates all charges through rate master
 *
 * WORKFLOW:
 * 1. Upload document file → Extract weight
 * 2. Calculate weight from document
 * 3. Fetch rate from rate_master using service_type + weight
 * 4. Calculate freight_charge, gst_amount, fuel_surcharge
 * 5. Store booking with all required fields
 * ============================================================================
 */

export const getAllBookings = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { page = 1, limit = 20, status, search, unbilledOnly } = req.query;
    const offset = (page - 1) * limit;

    const db = getDb();
    let whereClause = "WHERE franchise_id = ?";
    const params = [franchiseId];

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (search) {
      whereClause +=
        " AND (consignment_number LIKE ? OR receiver_name LIKE ? OR receiver_phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (unbilledOnly === "true") {
      whereClause += " AND payment_status = 'unpaid'";
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM bookings ${whereClause}`,
      params
    );

    // Get bookings
    const [bookings] = await db.query(
      `SELECT * FROM bookings ${whereClause} 
       ORDER BY booking_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResult[0].total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const [bookings] = await db.query(
      "SELECT * FROM bookings WHERE id = ? AND franchise_id = ?",
      [id, franchiseId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get tracking history
    const [tracking] = await db.query(
      "SELECT * FROM tracking WHERE booking_id = ? ORDER BY status_date DESC",
      [id]
    );

    res.json({
      success: true,
      data: {
        booking: bookings[0],
        tracking,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

/**
 * Extract weight from uploaded document file
 * Supports: Excel files (.xlsx, .xls)
 *
 * @param {string} filePath - Path to uploaded file
 * @returns {number} - Extracted weight in kg
 */
const extractWeightFromDocument = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new Error("No data found in document");
    }

    // Look for weight field (case-insensitive)
    const firstRow = jsonData[0];
    let weight = null;

    // Try common column names for weight
    const weightColumns = [
      "weight",
      "Weight",
      "wt",
      "Wt",
      "Weight (kg)",
      "weight_kg",
    ];

    for (const col of weightColumns) {
      if (firstRow[col]) {
        weight = parseFloat(firstRow[col]);
        if (!isNaN(weight)) break;
      }
    }

    // Try to find weight in any numeric column if not found
    if (!weight) {
      for (const key in firstRow) {
        const value = parseFloat(firstRow[key]);
        if (!isNaN(value) && value > 0 && value < 1000) {
          // Reasonable weight range
          weight = value;
          break;
        }
      }
    }

    if (!weight || isNaN(weight)) {
      throw new Error("Could not extract weight from document");
    }

    return weight;
  } catch (error) {
    console.error("Error extracting weight:", error);
    throw error;
  }
};

/**
 * Generate unique booking number
 * Format: BK-[TIMESTAMP]-[RANDOM]
 */
const generateBookingNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `BK-${timestamp}-${random}`;
};

/**
 * CREATE BOOKING - CORRECTED VERSION
 *
 * REQUEST BODY (from Document Upload):
 * {
 *   consignment_number: "CN123456",
 *   booking_date: "2024-01-15",
 *   service_type: "Air",              // Air, Surface, Express
 *
 *   sender_name: "John Doe",
 *   sender_phone: "9876543210",
 *   sender_address: "123 Main St",
 *   sender_pincode: "110001",
 *   sender_city: "Delhi",
 *   sender_state: "Delhi",
 *
 *   receiver_name: "Jane Doe",
 *   receiver_phone: "9876543211",
 *   receiver_address: "456 Side St",
 *   receiver_pincode: "400001",
 *   receiver_city: "Mumbai",
 *   receiver_state: "Maharashtra",
 *
 *   content_description: "Documents",
 *   declared_value: 5000,
 *   other_charges: 100,
 *   payment_mode: "cash",
 *   remarks: "Handle with care"
 * }
 *
 * FILE: Document containing weight data
 *
 * WORKFLOW:
 * 1. Extract weight from document ✅
 * 2. Calculate rate using service_type + weight ✅
 * 3. Generate all charges automatically ✅
 * 4. Store in database with correct field names ✅
 */
export const createBooking = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const {
      consignment_number,
      booking_date,
      service_type,

      sender_name,
      sender_phone,
      sender_address,
      sender_pincode,
      sender_city,
      sender_state,

      receiver_name,
      receiver_phone,
      receiver_address,
      receiver_pincode,
      receiver_city,
      receiver_state,

      content_description,
      declared_value = 0,
      other_charges = 0,
      payment_mode = "cash",
      remarks = null,
    } = req.body;

    // ============================================================================
    // STEP 1: VALIDATION
    // ============================================================================
    if (
      !consignment_number ||
      !booking_date ||
      !service_type ||
      !sender_name ||
      !sender_phone ||
      !receiver_name ||
      !receiver_phone ||
      !receiver_pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: consignment_number, booking_date, service_type, sender/receiver details",
      });
    }

    // Check for document file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file required to extract weight",
      });
    }

    const db = getDb();

    // ============================================================================
    // STEP 2: CHECK DUPLICATE CONSIGNMENT
    // ============================================================================
    const [existing] = await db.query(
      "SELECT id FROM bookings WHERE consignment_number = ? AND franchise_id = ?",
      [consignment_number, franchiseId]
    );

    if (existing.length > 0) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        message: "Consignment number already exists",
      });
    }

    try {
      // ============================================================================
      // STEP 3: EXTRACT WEIGHT FROM DOCUMENT
      // ============================================================================
      console.log(`📄 Extracting weight from document: ${req.file.filename}`);
      const extractedWeight = extractWeightFromDocument(req.file.path);
      console.log(`✅ Weight extracted: ${extractedWeight} kg`);

      // ============================================================================
      // STEP 4: CALCULATE PIECES (QUANTITY) - Default to 1 if not in document
      // ============================================================================
      const pieces = 1; // Default, can be enhanced to extract from document

      // ============================================================================
      // STEP 5: FETCH RATE FROM RATE_MASTER
      // ============================================================================
      console.log(
        `🔍 Fetching rate for: franchise=${franchiseId}, service_type=${service_type}, weight=${extractedWeight}`
      );

      let rateCalculation = null;
      let freightCharge = 0;
      let gstAmount = 0;
      let fuelSurcharge = 0;
      let gstPercentage = 18;

      try {
        rateCalculation = await calculateBookingRate(
          franchiseId,
          sender_pincode, // from_pincode
          receiver_pincode, // to_pincode
          service_type,
          extractedWeight,
          pieces,
          parseFloat(other_charges || 0)
        );

        if (rateCalculation) {
          freightCharge = rateCalculation.lineAmount;
          gstAmount = rateCalculation.taxAmount;
          fuelSurcharge = rateCalculation.fuelAmount;
          gstPercentage = rateCalculation.gstPercent;
          console.log(`✅ Rate calculated:`, rateCalculation);
        } else {
          return res.status(404).json({
            success: false,
            message: `No matching rate found for service_type: ${service_type}, weight: ${extractedWeight}`,
          });
        }
      } catch (rateError) {
        console.error("Rate calculation error:", rateError);
        fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: "Failed to calculate rate from RateMaster",
          error: rateError.message,
        });
      }

      // ============================================================================
      // STEP 6: CALCULATE TOTAL AMOUNT
      // ============================================================================
      const otherChargesValue = parseFloat(other_charges || 0);
      const totalAmount =
        freightCharge + gstAmount + fuelSurcharge + otherChargesValue;

      // ============================================================================
      // STEP 7: BUILD BOOKING DATA WITH CORRECT FIELD NAMES
      // ============================================================================
      const bookingNumber = generateBookingNumber();

      const bookingData = {
        franchise_id: franchiseId,
        booking_number: bookingNumber,
        consignment_number,
        booking_date,

        // Sender Details - CORRECT FIELD NAMES
        sender_name,
        sender_phone,
        sender_address,
        sender_pincode,
        sender_city,
        sender_state,

        // Receiver Details - CORRECT FIELD NAMES
        receiver_name,
        receiver_phone,
        receiver_address,
        receiver_pincode,
        receiver_city,
        receiver_state,

        // Package Details - CORRECT FIELD NAMES
        service_type, // NOT mode, NOT char_wt
        weight: extractedWeight, // Extracted from document, NOT char_wt
        pieces, // NOT qty
        content_description,
        declared_value: parseFloat(declared_value || 0),

        // Billing Details - CORRECT FIELD NAMES & CALCULATED
        freight_charge: parseFloat(freightCharge.toFixed(2)), // Calculated, NOT amount/dtdc_amt
        fuel_surcharge: parseFloat(fuelSurcharge.toFixed(2)), // Calculated from rate_master
        gst_amount: parseFloat(gstAmount.toFixed(2)), // Calculated, NOT tax_amount
        other_charges: parseFloat(otherChargesValue.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)), // NOT total

        // Payment Details
        payment_mode, // cash, online, card, to_pay
        payment_status: "unpaid", // Will be updated when payment received
        paid_amount: 0,

        // Status - LOWERCASE VALUE
        status: "booked", // NOT "Booked"
        remarks,
      };

      // ============================================================================
      // STEP 8: INSERT BOOKING INTO DATABASE
      // ============================================================================
      console.log(`💾 Inserting booking with data:`, bookingData);
      const [result] = await db.query("INSERT INTO bookings SET ?", [
        bookingData,
      ]);

      const bookingId = result.insertId;
      console.log(`✅ Booking created with ID: ${bookingId}`);

      // ============================================================================
      // STEP 9: CREATE INITIAL TRACKING ENTRY
      // ============================================================================
      await db.query("INSERT INTO tracking SET ?", {
        booking_id: bookingId,
        consignment_number,
        status: "booked",
        location: "Origin",
        remarks: "Consignment booked successfully",
        status_date: new Date(),
        updated_by: req.user.full_name,
      });

      // ============================================================================
      // STEP 10: CLEANUP & RESPONSE
      // ============================================================================
      fs.unlinkSync(req.file.path); // Delete temporary file

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: {
          id: bookingId,
          booking_number: bookingNumber,
          consignment_number,
          weight_extracted: extractedWeight,
          freight_charge: parseFloat(freightCharge.toFixed(2)),
          gst_amount: parseFloat(gstAmount.toFixed(2)),
          fuel_surcharge: parseFloat(fuelSurcharge.toFixed(2)),
          total_amount: parseFloat(totalAmount.toFixed(2)),
        },
      });
    } catch (processingError) {
      // Cleanup on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Booking creation error:", processingError);
      res.status(500).json({
        success: false,
        message: "Failed to create booking",
        error: processingError.message,
      });
    }
  } catch (error) {
    console.error("Create booking error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

/**
 * UPDATE BOOKING
 * Only certain fields can be updated
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    // Check if booking exists
    const [existing] = await db.query(
      "SELECT * FROM bookings WHERE id = ? AND franchise_id = ?",
      [id, franchiseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // List of updatable columns
    const allowedColumns = [
      "receiver_name",
      "receiver_phone",
      "receiver_address",
      "receiver_pincode",
      "receiver_city",
      "receiver_state",
      "content_description",
      "declared_value",
      "other_charges",
      "payment_mode",
      "payment_status",
      "paid_amount",
      "remarks",
      "status",
    ];

    // Build dynamic SET clause
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedColumns.includes(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Update booking
    const [result] = await db.query(
      "UPDATE bookings SET ?, updated_at = NOW() WHERE id = ? AND franchise_id = ?",
      [updates, id, franchiseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to update booking",
      });
    }

    res.json({
      success: true,
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

/**
 * DELETE BOOKING
 */
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const [result] = await db.query(
      "DELETE FROM bookings WHERE id = ? AND franchise_id = ?",
      [id, franchiseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Delete associated tracking records
    await db.query("DELETE FROM tracking WHERE booking_id = ?", [id]);

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};

export const getBookingByConsignment = async (req, res) => {
  try {
    const { consignment_number } = req.params;
    const franchiseId = req.user.franchise_id;
    const db = getDb();

    const [bookings] = await db.query(
      "SELECT * FROM bookings WHERE consignment_number = ? AND franchise_id = ?",
      [consignment_number, franchiseId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      data: bookings[0],
    });
  } catch (error) {
    console.error("Get booking by consignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};
