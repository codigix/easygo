import { getDb } from "../config/database.js";

const parseCondition = (value) => {
  if (!value) {
    return {};
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const toAmount = (value) => {
  const parsed = parseFloat(value || 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const listDiscountRules = async (franchiseId) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT * FROM discount_rules WHERE franchise_id = ? ORDER BY priority ASC",
    [franchiseId]
  );
  return rows.map((row) => ({ ...row, condition_json: parseCondition(row.condition_json) }));
};

export const createDiscountRule = async (franchiseId, payload) => {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO discount_rules
      (franchise_id, rule_name, rule_type, applies_to, discount_type, value, max_discount, priority, status, condition_json, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      franchiseId,
      payload.rule_name,
      payload.rule_type,
      payload.applies_to || "SHIPMENT",
      payload.discount_type,
      toAmount(payload.value),
      toAmount(payload.max_discount),
      payload.priority || 100,
      payload.status || "ACTIVE",
      JSON.stringify(payload.condition_json || {}),
      payload.description || null,
    ]
  );
  return { id: result.insertId };
};

export const updateDiscountRule = async (franchiseId, ruleId, payload) => {
  const db = getDb();
  const fields = [];
  const values = [];
  const entries = [
    "rule_name",
    "rule_type",
    "applies_to",
    "discount_type",
    "value",
    "max_discount",
    "priority",
    "status",
    "condition_json",
    "description",
  ];
  entries.forEach((key) => {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (["value", "max_discount"].includes(key)) {
        values.push(toAmount(payload[key]));
      } else if (key === "condition_json") {
        values.push(JSON.stringify(payload[key] || {}));
      } else {
        values.push(payload[key]);
      }
    }
  });
  if (fields.length === 0) {
    return;
  }
  values.push(franchiseId, ruleId);
  const [result] = await db.query(
    `UPDATE discount_rules SET ${fields.join(", ")}, updated_at = NOW() WHERE franchise_id = ? AND id = ?`,
    values
  );
  if (result.affectedRows === 0) {
    throw new Error("Discount rule not found");
  }
};

const matchList = (list, value) => {
  if (!list || list.length === 0) {
    return true;
  }
  if (!value) {
    return false;
  }
  return list.includes(value);
};

const routeMatches = (routes, from, to) => {
  if (!routes || routes.length === 0) {
    return true;
  }
  if (!from || !to) {
    return false;
  }
  return routes.some((route) => {
    const matchFrom = !route.from || route.from === from;
    const matchTo = !route.to || route.to === to;
    return matchFrom && matchTo;
  });
};

const matchesConditions = (conditions, context) => {
  if (!conditions) {
    return true;
  }
  if (!matchList(conditions.customer_ids, context.customer_id)) {
    return false;
  }
  if (!matchList(conditions.customer_tiers, context.customer_tier)) {
    return false;
  }
  if (!matchList(conditions.service_types, context.service_type)) {
    return false;
  }
  if (!matchList(conditions.from_pincodes, context.from_pincode)) {
    return false;
  }
  if (!matchList(conditions.to_pincodes, context.to_pincode)) {
    return false;
  }
  if (!routeMatches(conditions.routes, context.from_pincode, context.to_pincode)) {
    return false;
  }
  if (
    conditions.min_amount !== undefined &&
    conditions.min_amount !== null &&
    toAmount(context.amount) < toAmount(conditions.min_amount)
  ) {
    return false;
  }
  if (
    conditions.max_amount !== undefined &&
    conditions.max_amount !== null &&
    toAmount(context.amount) > toAmount(conditions.max_amount)
  ) {
    return false;
  }
  if (
    conditions.sla_delay_hours !== undefined &&
    conditions.sla_delay_hours !== null &&
    (!context.sla_delay_hours || context.sla_delay_hours < conditions.sla_delay_hours)
  ) {
    return false;
  }
  if (
    conditions.min_shipments &&
    context.shipment_count !== undefined &&
    context.shipment_count < conditions.min_shipments
  ) {
    return false;
  }
  return true;
};

const calculateRuleDiscount = (rule, amount) => {
  const base = toAmount(amount);
  if (base <= 0) {
    return 0;
  }
  if (rule.discount_type === "FLAT") {
    return Math.min(toAmount(rule.value), base);
  }
  const percent = toAmount(rule.value);
  const raw = (base * percent) / 100;
  const cap = rule.max_discount ? Math.min(raw, toAmount(rule.max_discount)) : raw;
  return Number(cap.toFixed(2));
};

export const evaluateDiscountRules = async ({
  franchiseId,
  context,
  connection,
}) => {
  const db = connection || getDb();
  const [rules] = await db.query(
    "SELECT * FROM discount_rules WHERE franchise_id = ? AND status = 'ACTIVE' ORDER BY priority ASC",
    [franchiseId]
  );
  let best = null;
  for (const rule of rules) {
    if (rule.applies_to && context.applies_to && rule.applies_to !== context.applies_to) {
      continue;
    }
    const conditions = parseCondition(rule.condition_json);
    if (!matchesConditions(conditions, context)) {
      continue;
    }
    const discount = calculateRuleDiscount(rule, context.amount);
    if (discount <= 0) {
      continue;
    }
    if (!best || discount > best.discount) {
      best = {
        rule,
        discount,
      };
    }
  }
  return best;
};
