/**
 * Rate Calculation Service
 * Centralizes all rate calculation logic for bookings and invoices
 * Follows the workflow: RateMaster → Booking → Invoice
 */

import { getDb } from "../config/database.js";

/**
 * Calculate rate for a booking based on RateMaster
 * Workflow Step 1: Fetch matching rate from RateMaster
 */
export const fetchRateFromMaster = async (
  franchiseId,
  fromPincode,
  toPincode,
  serviceType,
  weight
) => {
  try {
    const db = getDb();
    const normalizedServiceType = (serviceType || "").trim().toUpperCase();

    if (!normalizedServiceType) {
      throw new Error("Service type is required for rate lookup");
    }

    // Query RateMaster matching the booking parameters
    const [[rate]] = await db.query(
      `SELECT * FROM rate_master 
       WHERE franchise_id = ? 
       AND (from_pincode = ? OR from_pincode = '*')
       AND (to_pincode = ? OR to_pincode = '*')
       AND UPPER(service_type) = ?
       AND weight_from <= ?
       AND (weight_to >= ? OR weight_to IS NULL)
       AND status = 'active'
       ORDER BY 
         CASE WHEN from_pincode = ? THEN 0 ELSE 1 END,
         CASE WHEN to_pincode = ? THEN 0 ELSE 1 END,
         weight_from DESC
       LIMIT 1`,
      [
        franchiseId,
        fromPincode,
        toPincode,
        normalizedServiceType,
        weight,
        weight,
        fromPincode,
        toPincode,
      ]
    );

    return rate || null;
  } catch (error) {
    console.error("Error fetching rate from master:", error);
    throw error;
  }
};

/**
 * Workflow Step 2: Calculate line amount from rate
 * lineAmount = rate × quantity
 */
export const calculateLineAmount = (rate, quantity) => {
  if (!rate) {
    throw new Error("Rate not found for calculation");
  }
  return parseFloat(rate) * parseFloat(quantity);
};

/**
 * Workflow Step 3: Calculate tax amount
 * taxAmount = lineAmount × (gst_percentage / 100)
 */
export const calculateTaxAmount = (lineAmount, gstPercentage = 18) => {
  const gstPercent = parseFloat(gstPercentage) || 18;
  return parseFloat(lineAmount) * (gstPercent / 100);
};

/**
 * Calculate fuel surcharge
 * fuelAmount = lineAmount × (fuel_surcharge / 100)
 */
export const calculateFuelSurcharge = (
  lineAmount,
  fuelSurchargePercent = 0
) => {
  if (!fuelSurchargePercent) return 0;
  return parseFloat(lineAmount) * (parseFloat(fuelSurchargePercent) / 100);
};

/**
 * Workflow Step 4: Calculate net amount (final total)
 * netAmount = lineAmount + taxAmount + fuelAmount + otherCharges
 */
export const calculateNetAmount = (
  lineAmount,
  taxAmount = 0,
  fuelAmount = 0,
  otherCharges = 0
) => {
  return (
    parseFloat(lineAmount) +
    parseFloat(taxAmount) +
    parseFloat(fuelAmount) +
    parseFloat(otherCharges)
  );
};

/**
 * Complete rate calculation for booking
 * Used when creating a booking
 *
 * Returns: {
 *   rate,
 *   lineAmount,
 *   taxAmount,
 *   fuelAmount,
 *   netAmount,
 *   gstPercent,
 *   fuelPercent
 * }
 */
export const calculateBookingRate = async (
  franchiseId,
  fromPincode,
  toPincode,
  serviceType,
  weight,
  quantity,
  otherCharges = 0
) => {
  try {
    // Step 1: Fetch rate from master
    const rateMaster = await fetchRateFromMaster(
      franchiseId,
      fromPincode,
      toPincode,
      serviceType,
      weight
    );

    if (!rateMaster) {
      return null; // Return null if no rate found
    }

    // Step 2: Calculate line amount
    const lineAmount = calculateLineAmount(rateMaster.rate, quantity);

    // Step 3: Calculate tax
    const gstPercent = parseFloat(rateMaster.gst_percentage) || 18;
    const taxAmount = calculateTaxAmount(lineAmount, gstPercent);

    // Calculate fuel surcharge
    const fuelPercent = parseFloat(rateMaster.fuel_surcharge) || 0;
    const fuelAmount = calculateFuelSurcharge(lineAmount, fuelPercent);

    // Step 4: Calculate net amount
    const netAmount = calculateNetAmount(
      lineAmount,
      taxAmount,
      fuelAmount,
      otherCharges
    );

    return {
      rate: parseFloat(rateMaster.rate),
      lineAmount: parseFloat(lineAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      fuelAmount: parseFloat(fuelAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      gstPercent,
      fuelPercent,
      rateMasterId: rateMaster.id,
    };
  } catch (error) {
    console.error("Error calculating booking rate:", error);
    throw error;
  }
};

/**
 * Calculate invoice totals from multiple bookings
 * Used when generating invoice from multiple bookings
 *
 * Returns: {
 *   subTotal,
 *   gstTotal,
 *   fuelTotal,
 *   otherTotal,
 *   netAmount
 * }
 */
export const calculateInvoiceTotals = (bookings) => {
  try {
    const totals = {
      subTotal: 0,
      gstTotal: 0,
      fuelTotal: 0,
      otherTotal: 0,
      netAmount: 0,
    };

    if (!bookings || bookings.length === 0) {
      return totals;
    }

    bookings.forEach((booking) => {
      totals.subTotal += parseFloat(booking.lineAmount || booking.amount || 0);
      totals.gstTotal += parseFloat(booking.tax_amount || 0);
      totals.fuelTotal += parseFloat(booking.fuel_amount || 0);
      totals.otherTotal += parseFloat(booking.other_charges || 0);
    });

    totals.netAmount =
      totals.subTotal + totals.gstTotal + totals.fuelTotal + totals.otherTotal;

    return {
      subTotal: parseFloat(totals.subTotal.toFixed(2)),
      gstTotal: parseFloat(totals.gstTotal.toFixed(2)),
      fuelTotal: parseFloat(totals.fuelTotal.toFixed(2)),
      otherTotal: parseFloat(totals.otherTotal.toFixed(2)),
      netAmount: parseFloat(totals.netAmount.toFixed(2)),
    };
  } catch (error) {
    console.error("Error calculating invoice totals:", error);
    throw error;
  }
};

/**
 * Format currency values (for display/logging)
 */
export const formatCurrency = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

/**
 * Validate rate calculation result
 */
export const validateRateCalculation = (calculation) => {
  const required = [
    "rate",
    "lineAmount",
    "taxAmount",
    "fuelAmount",
    "netAmount",
  ];
  const missing = required.filter((field) => calculation[field] === undefined);

  if (missing.length > 0) {
    throw new Error(
      `Missing fields in rate calculation: ${missing.join(", ")}`
    );
  }

  // Verify calculations are correct
  const expectedNet =
    calculation.lineAmount + calculation.taxAmount + calculation.fuelAmount;
  const difference = Math.abs(expectedNet - calculation.netAmount);

  if (difference > 0.01) {
    // Allow 1 paisa difference for rounding
    throw new Error(
      `Rate calculation verification failed. Expected: ${expectedNet}, Got: ${calculation.netAmount}`
    );
  }

  return true;
};
