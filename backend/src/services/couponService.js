import dayjs from "dayjs";
import { getDb } from "../config/database.js";

const normalizeCode = (code) => code.trim().toUpperCase();

const parseMeta = (value) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const toAmount = (value) => {
  const parsed = parseFloat(value || 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const couponColumns = [
  "id",
  "franchise_id",
  "code",
  "title",
  "description",
  "discount_type",
  "value",
  "max_discount",
  "min_order_value",
  "usage_limit",
  "per_user_limit",
  "applicable_on",
  "status",
  "valid_from",
  "valid_to",
  "metadata",
  "created_at",
  "updated_at",
];

export const listCoupons = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT " + couponColumns.join(",") + " FROM coupons WHERE franchise_id = ? ORDER BY created_at DESC",
    [franchiseId]
  );
  return rows.map((row) => ({ ...row, metadata: parseMeta(row.metadata) }));
};

export const createCoupon = async (franchiseId, payload) => {
  const db = getDb();
  const code = normalizeCode(payload.code);
  const [[existing]] = await db.query(
    "SELECT id FROM coupons WHERE franchise_id = ? AND code = ?",
    [franchiseId, code]
  );
  if (existing) {
    throw new Error("Coupon code already exists");
  }
  const [result] = await db.query(
    `INSERT INTO coupons 
      (franchise_id, code, title, description, discount_type, value, max_discount, min_order_value, usage_limit, per_user_limit, applicable_on, status, valid_from, valid_to, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      franchiseId,
      code,
      payload.title,
      payload.description || null,
      payload.discount_type,
      toAmount(payload.value),
      toAmount(payload.max_discount),
      toAmount(payload.min_order_value),
      payload.usage_limit || null,
      payload.per_user_limit || null,
      payload.applicable_on || "SHIPMENT",
      payload.status || "ACTIVE",
      payload.valid_from || null,
      payload.valid_to || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ]
  );
  return { id: result.insertId };
};

export const updateCoupon = async (franchiseId, couponId, payload) => {
  const db = getDb();
  const fields = [];
  const values = [];
  const allowed = [
    "title",
    "description",
    "discount_type",
    "value",
    "max_discount",
    "min_order_value",
    "usage_limit",
    "per_user_limit",
    "applicable_on",
    "status",
    "valid_from",
    "valid_to",
    "metadata",
  ];
  allowed.forEach((key) => {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === "metadata" && payload[key]) {
        values.push(JSON.stringify(payload[key]));
      } else if (["value", "max_discount", "min_order_value"].includes(key)) {
        values.push(toAmount(payload[key]));
      } else {
        values.push(payload[key]);
      }
    }
  });
  if (fields.length === 0) {
    return;
  }
  values.push(franchiseId, couponId);
  const [result] = await db.query(
    `UPDATE coupons SET ${fields.join(", ")}, updated_at = NOW() WHERE franchise_id = ? AND id = ?`,
    values
  );
  if (result.affectedRows === 0) {
    throw new Error("Coupon not found");
  }
};

export const toggleCouponStatus = async (franchiseId, couponId, status) => {
  const db = getDb();
  const [result] = await db.query(
    "UPDATE coupons SET status = ?, updated_at = NOW() WHERE franchise_id = ? AND id = ?",
    [status, franchiseId, couponId]
  );
  if (result.affectedRows === 0) {
    throw new Error("Coupon not found");
  }
};

const fetchCouponByCode = async (connection, franchiseId, code) => {
  const db = connection || getDb();
  const [[coupon]] = await db.query(
    "SELECT * FROM coupons WHERE franchise_id = ? AND code = ?",
    [franchiseId, normalizeCode(code)]
  );
  if (!coupon) {
    throw new Error("Coupon not found");
  }
  return coupon;
};

const ensureCouponActive = (coupon) => {
  if (coupon.status !== "ACTIVE") {
    throw new Error("Coupon is not active");
  }
  const now = dayjs();
  if (coupon.valid_from && now.isBefore(dayjs(coupon.valid_from))) {
    throw new Error("Coupon is not yet valid");
  }
  if (coupon.valid_to && now.isAfter(dayjs(coupon.valid_to))) {
    throw new Error("Coupon has expired");
  }
};

const ensureCouponScope = (coupon, context) => {
  if (coupon.applicable_on === "BOTH") {
    return;
  }
  if (coupon.applicable_on !== context) {
    throw new Error("Coupon not applicable for this flow");
  }
};

const verifyUsageLimits = async (connection, coupon, customerId) => {
  if (!coupon.usage_limit && !coupon.per_user_limit) {
    return;
  }
  if (coupon.usage_limit) {
    const [[row]] = await connection.query(
      "SELECT COUNT(*) AS total FROM coupon_usage WHERE coupon_id = ?",
      [coupon.id]
    );
    if (row.total >= coupon.usage_limit) {
      throw new Error("Coupon usage limit reached");
    }
  }
  if (coupon.per_user_limit) {
    const [[row]] = await connection.query(
      "SELECT COUNT(*) AS total FROM coupon_usage WHERE coupon_id = ? AND customer_id = ?",
      [coupon.id, customerId]
    );
    if (row.total >= coupon.per_user_limit) {
      throw new Error("Coupon usage limit reached for this customer");
    }
  }
};

const calculateDiscount = (coupon, amount, context) => {
  const baseAmount = toAmount(amount);
  if (baseAmount < toAmount(coupon.min_order_value)) {
    throw new Error("Amount does not meet minimum value for coupon");
  }
  if (coupon.discount_type === "FLAT") {
    return { discount: Math.min(toAmount(coupon.value), baseAmount) };
  }
  if (coupon.discount_type === "PERCENT") {
    const percent = toAmount(coupon.value);
    const raw = (baseAmount * percent) / 100;
    const capped = coupon.max_discount ? Math.min(raw, toAmount(coupon.max_discount)) : raw;
    return { discount: Number(capped.toFixed(2)) };
  }
  if (coupon.discount_type === "BONUS" && context === "RECHARGE") {
    const bonus = coupon.max_discount ? Math.min(toAmount(coupon.value), toAmount(coupon.max_discount)) : toAmount(coupon.value);
    return { bonus: Number(bonus.toFixed(2)) };
  }
  throw new Error("Unsupported coupon type for this context");
};

export const evaluateCoupon = async ({
  franchiseId,
  customerId,
  couponCode,
  amount,
  context = "SHIPMENT",
  connection,
}) => {
  const db = connection || getDb();
  const coupon = await fetchCouponByCode(db, franchiseId, couponCode);
  ensureCouponActive(coupon);
  ensureCouponScope(coupon, context);
  await verifyUsageLimits(db, coupon, customerId);
  const breakdown = calculateDiscount(coupon, amount, context);
  return {
    coupon,
    discount: breakdown.discount || 0,
    bonus: breakdown.bonus || 0,
  };
};

export const recordCouponUsage = async (
  connection,
  {
    coupon,
    franchiseId,
    customerId,
    context,
    discountAmount,
    shipmentId,
    rechargeId,
  }
) => {
  await connection.query(
    `INSERT INTO coupon_usage
      (coupon_id, franchise_id, customer_id, context, discount_amount, shipment_id, recharge_id, used_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      coupon.id,
      franchiseId,
      customerId,
      context,
      discountAmount,
      shipmentId || null,
      rechargeId || null,
    ]
  );
};
