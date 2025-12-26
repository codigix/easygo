import { getDb } from "../config/database.js";
import { calculateBookingRate } from "./rateCalculationService.js";
import { evaluateDiscountRules } from "./discountRuleService.js";
import { evaluateCoupon, recordCouponUsage } from "./couponService.js";
import { debitWallet } from "./walletService.js";

const generateShipmentCN = async (franchiseId) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `CN-${franchiseId}-${dateStr}-${randomStr}`;
};

export const validateShipmentData = (data) => {
  const errors = [];

  if (!data.sender_name) errors.push("Sender name is required");
  if (!data.sender_phone) errors.push("Sender phone is required");
  if (!data.sender_address) errors.push("Sender address is required");
  if (!data.sender_pincode) errors.push("Sender pincode is required");

  if (!data.receiver_name) errors.push("Receiver name is required");
  if (!data.receiver_phone) errors.push("Receiver phone is required");
  if (!data.receiver_address) errors.push("Receiver address is required");
  if (!data.receiver_pincode) errors.push("Receiver pincode is required");

  if (!data.weight || parseFloat(data.weight) <= 0) {
    errors.push("Weight must be greater than 0");
  }

  if (parseFloat(data.weight) > 30) {
    errors.push("Weight cannot exceed 30 kg");
  }

  if (!data.service_type) errors.push("Service type is required");

  if (!data.shipment_source) errors.push("Shipment source is required");

  if ((data.payment_source === "WALLET" || data.use_wallet) && !data.customer_id) {
    errors.push("Customer ID is required for wallet payment");
  }

  if (data.coupon_code && !data.customer_id) {
    errors.push("Customer ID is required when applying a coupon");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateBulkShipmentRow = (row, rowNumber) => {
  const errors = [];

  if (!row.sender_name) errors.push(`Row ${rowNumber}: Sender name required`);
  if (!row.sender_phone) errors.push(`Row ${rowNumber}: Sender phone required`);
  if (!row.sender_address) errors.push(`Row ${rowNumber}: Sender address required`);
  if (!row.sender_pincode) errors.push(`Row ${rowNumber}: Sender pincode required`);

  if (!row.receiver_name) errors.push(`Row ${rowNumber}: Receiver name required`);
  if (!row.receiver_phone) errors.push(`Row ${rowNumber}: Receiver phone required`);
  if (!row.receiver_address) errors.push(`Row ${rowNumber}: Receiver address required`);
  if (!row.receiver_pincode) errors.push(`Row ${rowNumber}: Receiver pincode required`);

  if (!row.weight || parseFloat(row.weight) <= 0) {
    errors.push(`Row ${rowNumber}: Weight must be greater than 0`);
  }

  if (parseFloat(row.weight) > 30) {
    errors.push(`Row ${rowNumber}: Weight cannot exceed 30 kg`);
  }

  if (!row.service_type) errors.push(`Row ${rowNumber}: Service type required`);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createShipment = async (data, franchiseId) => {
  const validation = validateShipmentData(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  const connection = await getDb().getConnection();
  let transactionStarted = false;

  try {
    if (data.pickup_id) {
      const [pickups] = await connection.query(
        "SELECT status FROM pickup_requests WHERE id = ? AND franchise_id = ?",
        [data.pickup_id, franchiseId]
      );
      if (pickups.length === 0) {
        throw new Error("Pickup not found");
      }
      if (pickups[0].status !== "PICKED_UP") {
        throw new Error("Pickup must be completed before creating shipment");
      }
    }

    const shipmentCN = await generateShipmentCN(franchiseId);
    const now = new Date();

    const rates = await calculateBookingRate(
      franchiseId,
      data.sender_pincode,
      data.receiver_pincode,
      data.service_type,
      parseFloat(data.weight),
      data.pieces || 1,
      parseFloat(data.other_charges) || 0
    );

    if (!rates) {
      throw new Error("No rate found for this pincode route and service type");
    }

    const baseAmount = rates.netAmount;
    let discountRuleId = null;
    let discountAmount = 0;
    let discountSource = null;

    if (data.customer_id) {
      const discountResult = await evaluateDiscountRules({
        franchiseId,
        context: {
          amount: baseAmount,
          customer_id: data.customer_id,
          customer_tier: data.customer_tier,
          service_type: data.service_type,
          from_pincode: data.sender_pincode,
          to_pincode: data.receiver_pincode,
          applies_to: "SHIPMENT",
        },
        connection,
      });
      if (discountResult) {
        discountRuleId = discountResult.rule.id;
        discountAmount = Number(discountResult.discount.toFixed(2));
        discountSource = discountResult.rule.rule_name || discountResult.rule.rule_type;
      }
    }

    const couponCode = data.coupon_code ? data.coupon_code.trim().toUpperCase() : null;
    let couponInfo = null;
    let couponDiscount = 0;
    if (couponCode && data.customer_id) {
      const evaluation = await evaluateCoupon({
        franchiseId,
        customerId: data.customer_id,
        couponCode,
        amount: Math.max(baseAmount - discountAmount, 0),
        context: "SHIPMENT",
        connection,
      });
      couponInfo = evaluation;
      couponDiscount = Number((evaluation.discount || 0).toFixed(2));
    }

    const finalPayable = Number(
      Math.max(baseAmount - discountAmount - couponDiscount, 0).toFixed(2)
    );
    const paymentSource =
      data.payment_source || (data.use_wallet ? "WALLET" : "INVOICE");

    const pricingBreakup = JSON.stringify({
      base_amount: baseAmount,
      discount_amount: discountAmount,
      coupon_discount: couponDiscount,
      payable: finalPayable,
    });

    await connection.beginTransaction();
    transactionStarted = true;

    const [result] = await connection.query(
      `INSERT INTO shipments 
       (franchise_id, shipment_cn, pickup_id, customer_id, shipment_source,
        sender_name, sender_phone, sender_address, sender_pincode, sender_city, sender_state,
        receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city, receiver_state,
        weight, dimensions, pieces, content_description, declared_value,
        service_type, freight_charge, fuel_surcharge, gst_amount, other_charges, total_charge,
        discount_rule_id, discount_amount, discount_source,
        coupon_id, coupon_code, coupon_discount,
        final_payable, wallet_debit, payment_source, wallet_transaction_id, pricing_breakup,
        status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        franchiseId,
        shipmentCN,
        data.pickup_id || null,
        data.customer_id || null,
        data.shipment_source || "MANUAL",
        data.sender_name,
        data.sender_phone,
        data.sender_address,
        data.sender_pincode,
        data.sender_city || null,
        data.sender_state || null,
        data.receiver_name,
        data.receiver_phone,
        data.receiver_address,
        data.receiver_pincode,
        data.receiver_city || null,
        data.receiver_state || null,
        parseFloat(data.weight),
        data.dimensions || null,
        data.pieces || 1,
        data.content_description || null,
        parseFloat(data.declared_value) || 0,
        data.service_type,
        rates.lineAmount,
        rates.fuelAmount,
        rates.taxAmount,
        parseFloat(data.other_charges) || 0,
        rates.netAmount,
        discountRuleId,
        discountAmount,
        discountSource,
        couponInfo ? couponInfo.coupon.id : null,
        couponInfo ? couponInfo.coupon.code : null,
        couponDiscount,
        finalPayable,
        0,
        paymentSource,
        null,
        pricingBreakup,
        "CREATED",
        now,
        now,
      ]
    );

    let walletTransactionId = null;
    let walletDebit = 0;
    if (paymentSource === "WALLET" && finalPayable > 0) {
      const walletResult = await debitWallet({
        franchiseId,
        customerId: data.customer_id,
        amount: finalPayable,
        source: "SHIPMENT",
        referenceId: shipmentCN,
        metadata: { shipment_id: result.insertId },
        connection,
      });
      walletTransactionId = walletResult.transaction_id;
      walletDebit = finalPayable;
      await connection.query(
        "UPDATE shipments SET wallet_debit = ?, wallet_transaction_id = ? WHERE id = ?",
        [walletDebit, walletTransactionId, result.insertId]
      );
    }

    if (couponInfo) {
      await recordCouponUsage(connection, {
        coupon: couponInfo.coupon,
        franchiseId,
        customerId: data.customer_id,
        context: "SHIPMENT",
        discountAmount: couponDiscount,
        shipmentId: result.insertId,
      });
    }

    await connection.commit();

    return {
      id: result.insertId,
      shipment_cn: shipmentCN,
      status: "CREATED",
      weight: parseFloat(data.weight),
      total_charge: rates.netAmount,
      discount_amount: discountAmount,
      coupon_discount: couponDiscount,
      final_payable: finalPayable,
      wallet_debit: walletDebit,
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
};

export const getShipmentById = async (shipmentId, franchiseId) => {
  const db = getDb();
  const [shipments] = await db.query(
    "SELECT * FROM shipments WHERE id = ? AND franchise_id = ?",
    [shipmentId, franchiseId]
  );

  if (shipments.length === 0) {
    return null;
  }

  return shipments[0];
};

export const checkShipmentCanBeEdited = async (shipmentId, franchiseId) => {
  const shipment = await getShipmentById(shipmentId, franchiseId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  if (shipment.status !== "CREATED") {
    throw new Error(`Cannot edit shipment with status: ${shipment.status}`);
  }

  return true;
};

export const checkShipmentCanBeDeleted = async (shipmentId, franchiseId) => {
  const shipment = await getShipmentById(shipmentId, franchiseId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  if (shipment.status !== "CREATED") {
    throw new Error(`Cannot delete shipment with status: ${shipment.status}`);
  }

  return true;
};

export const createException = async (shipmentId, exceptionData, franchiseId) => {
  const db = getDb();

  // Verify shipment exists
  const shipment = await getShipmentById(shipmentId, franchiseId);
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const now = new Date();

  // Create exception
  const [result] = await db.query(
    `INSERT INTO shipment_exceptions 
     (shipment_id, franchise_id, exception_type, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      shipmentId,
      franchiseId,
      exceptionData.exception_type,
      exceptionData.description || null,
      "PENDING",
      now,
      now,
    ]
  );

  // Update shipment status
  await db.query(
    `UPDATE shipments SET status = 'EXCEPTION', sub_status = NULL, exception_type = ?, exception_notes = ?, updated_at = ? WHERE id = ?`,
    [exceptionData.exception_type, exceptionData.description || null, now, shipmentId]
  );

  return {
    id: result.insertId,
    shipment_id: shipmentId,
    exception_type: exceptionData.exception_type,
    status: "PENDING",
  };
};

export const resolveException = async (exceptionId, resolution, franchiseId) => {
  const db = getDb();

  // Get exception
  const [exceptions] = await db.query(
    "SELECT * FROM shipment_exceptions WHERE id = ? AND franchise_id = ?",
    [exceptionId, franchiseId]
  );

  if (exceptions.length === 0) {
    throw new Error("Exception not found");
  }

  const exception = exceptions[0];
  const now = new Date();

  // Update exception
  await db.query(
    "UPDATE shipment_exceptions SET status = ?, resolution_notes = ?, resolved_at = ?, updated_at = ? WHERE id = ?",
    [resolution.status || "RESOLVED", resolution.resolution_notes || null, now, now, exceptionId]
  );

  // Update shipment status based on resolution
  if (resolution.new_status) {
    await db.query(
      "UPDATE shipments SET status = ?, sub_status = NULL, exception_type = NULL, exception_notes = NULL, updated_at = ? WHERE id = ?",
      [resolution.new_status, now, exception.shipment_id]
    );
  }

  return true;
};
