# RateMaster Fixes - Complete Implementation Guide

## Overview

This document provides step-by-step fixes for all 4 critical issues in the RateMaster system.

---

## 🔴 FIX #1: Field Name Mismatch (CRITICAL)

### Problem

- Migration defines: `rate` column
- Controller uses: `rate_per_kg` field
- Result: API crashes when calculating rates

### Current Broken Code

**File:** `backend/src/controllers/rateMasterController.js` (Line 98)

```javascript
const totalAmount = rate.rate_per_kg * weight; // ❌ CRASHES - field doesn't exist!
```

### Solution Options

#### Option A: Fix Controller to Use Correct Column Name (RECOMMENDED)

Change all references from `rate_per_kg` to `rate`

**Changes needed:**

1. Line 98: `rate.rate_per_kg` → `rate.rate`
2. Line 103: `rate: rate.rate_per_kg` → `rate: rate.rate`
3. Line 126, 139, 165, 180: `rate_per_kg` → `rate`

```javascript
// BEFORE (Line 98-108)
const totalAmount = rate.rate_per_kg * weight;
res.json({
  success: true,
  data: {
    rate: rate.rate_per_kg, // ❌ WRONG FIELD
    weight,
    total_amount: totalAmount,
    service_type,
  },
});

// AFTER (FIXED)
const totalAmount = rate.rate * weight;
res.json({
  success: true,
  data: {
    rate: rate.rate, // ✅ CORRECT FIELD
    weight,
    total_amount: totalAmount,
    service_type,
  },
});
```

#### Option B: Rename Column in Migration (NOT RECOMMENDED - breaks existing data)

Would require creating a new migration to rename `rate` to `rate_per_kg`

### ✅ Recommended Action

**Use Option A** - Update controller to use `rate` (the correct column name)

---

## 🔴 FIX #2: Missing Input Validation (CRITICAL)

### Problem

No validation for:

- Negative values
- Invalid ranges (weight_from > weight_to)
- Invalid service types
- Empty/null mandatory fields

### Solution: Add Validation Function

**File:** `backend/src/controllers/rateMasterController.js`

Add this validation function at the top:

```javascript
// Validation helper
const validateRateInput = (data) => {
  const errors = [];

  // 1. Check mandatory fields
  if (!data.from_pincode || data.from_pincode.trim() === "") {
    errors.push("from_pincode is required");
  }
  if (!data.to_pincode || data.to_pincode.trim() === "") {
    errors.push("to_pincode is required");
  }
  if (!data.service_type || data.service_type.trim() === "") {
    errors.push("service_type is required");
  }
  if (data.weight_from === undefined || data.weight_from === null) {
    errors.push("weight_from is required");
  }
  if (data.weight_to === undefined || data.weight_to === null) {
    errors.push("weight_to is required");
  }
  if (data.rate === undefined || data.rate === null) {
    errors.push("rate is required");
  }

  // 2. Validate service_type enum
  const validServiceTypes = ["Surface", "Air", "Express"];
  if (data.service_type && !validServiceTypes.includes(data.service_type)) {
    errors.push(`service_type must be one of: ${validServiceTypes.join(", ")}`);
  }

  // 3. Validate numeric values are positive
  if (data.rate !== undefined && data.rate < 0) {
    errors.push("rate cannot be negative");
  }
  if (data.rate !== undefined && data.rate > 10000) {
    errors.push("rate exceeds maximum limit of 10000");
  }

  if (data.weight_from !== undefined && data.weight_from < 0) {
    errors.push("weight_from cannot be negative");
  }
  if (data.weight_to !== undefined && data.weight_to < 0) {
    errors.push("weight_to cannot be negative");
  }

  // 4. Validate weight range
  if (data.weight_from !== undefined && data.weight_to !== undefined) {
    if (parseFloat(data.weight_from) >= parseFloat(data.weight_to)) {
      errors.push("weight_from must be less than weight_to");
    }
  }

  // 5. Validate fuel surcharge (optional, but if provided should be valid)
  if (data.fuel_surcharge !== undefined && data.fuel_surcharge < 0) {
    errors.push("fuel_surcharge cannot be negative");
  }

  // 6. Validate GST percentage (0-100)
  if (data.gst_percentage !== undefined) {
    if (data.gst_percentage < 0 || data.gst_percentage > 100) {
      errors.push("gst_percentage must be between 0 and 100");
    }
  }

  // 7. Validate pincode format (6-digit numeric)
  const pincodeRegex = /^\d{6}$/;
  if (data.from_pincode && !pincodeRegex.test(data.from_pincode)) {
    errors.push("from_pincode must be 6 digits");
  }
  if (data.to_pincode && !pincodeRegex.test(data.to_pincode)) {
    errors.push("to_pincode must be 6 digits");
  }

  return errors;
};
```

### Update createRate with validation:

```javascript
export const createRate = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const {
      from_pincode,
      to_pincode,
      service_type,
      weight_from,
      weight_to,
      rate, // ✅ Use correct field name
      fuel_surcharge,
      gst_percentage,
    } = req.body;
    const db = getDb();

    // ✅ VALIDATE INPUT
    const validationErrors = validateRateInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const [result] = await db.query(
      `INSERT INTO rate_master 
       (franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, fuel_surcharge, gst_percentage, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        franchiseId,
        from_pincode,
        to_pincode,
        service_type,
        parseFloat(weight_from),
        parseFloat(weight_to),
        parseFloat(rate),
        fuel_surcharge ? parseFloat(fuel_surcharge) : 0,
        gst_percentage ? parseFloat(gst_percentage) : 18,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Rate created successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Create rate error:", error);
    res.status(500).json({ success: false, message: "Failed to create rate" });
  }
};
```

### Update updateRate with validation:

```javascript
export const updateRate = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    const {
      from_pincode,
      to_pincode,
      service_type,
      weight_from,
      weight_to,
      rate, // ✅ Use correct field name
      fuel_surcharge,
      gst_percentage,
    } = req.body;
    const db = getDb();

    // ✅ VALIDATE INPUT
    const validationErrors = validateRateInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const [result] = await db.query(
      `UPDATE rate_master 
       SET from_pincode = ?, to_pincode = ?, service_type = ?, 
           weight_from = ?, weight_to = ?, rate = ?, 
           fuel_surcharge = ?, gst_percentage = ?, updated_at = NOW()
       WHERE id = ? AND franchise_id = ?`,
      [
        from_pincode,
        to_pincode,
        service_type,
        parseFloat(weight_from),
        parseFloat(weight_to),
        parseFloat(rate),
        fuel_surcharge ? parseFloat(fuel_surcharge) : 0,
        gst_percentage ? parseFloat(gst_percentage) : 18,
        id,
        franchiseId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Rate not found",
      });
    }

    res.json({
      success: true,
      message: "Rate updated successfully",
    });
  } catch (error) {
    console.error("Update rate error:", error);
    res.status(500).json({ success: false, message: "Failed to update rate" });
  }
};
```

---

## 🔴 FIX #3: Unique Constraint (CRITICAL)

### Problem

Same rate can be created multiple times for same route/weight

### Solution: Add Unique Constraint + Duplicate Check

#### Option A: Database-Level Constraint (RECOMMENDED)

**File:** Create new migration `backend/migrations/20240101000021_add_unique_constraint_to_rates.cjs`

```javascript
exports.up = function (knex) {
  return knex.schema.alterTable("rate_master", (table) => {
    // Drop existing index if any
    table.dropIndex(["franchise_id", "from_pincode", "to_pincode"]);

    // Add unique constraint
    table.unique(
      [
        "franchise_id",
        "from_pincode",
        "to_pincode",
        "service_type",
        "weight_from",
        "weight_to",
      ],
      { indexName: "unique_rate_slab" }
    );
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("rate_master", (table) => {
    table.dropIndex([
      "franchise_id",
      "from_pincode",
      "to_pincode",
      "service_type",
      "weight_from",
      "weight_to",
    ]);
  });
};
```

Then run: `npm run migrate`

#### Option B: Application-Level Check

Add to `validateRateInput` function:

```javascript
// NEW: Check for duplicate rate
const checkDuplicate = async (
  franchiseId,
  from_pincode,
  to_pincode,
  service_type,
  weight_from,
  weight_to,
  excludeId = null
) => {
  const db = getDb();

  let query = `
    SELECT id FROM rate_master 
    WHERE franchise_id = ? 
    AND from_pincode = ? 
    AND to_pincode = ? 
    AND service_type = ? 
    AND weight_from = ? 
    AND weight_to = ?
  `;
  const params = [
    franchiseId,
    from_pincode,
    to_pincode,
    service_type,
    weight_from,
    weight_to,
  ];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  const [[existing]] = await db.query(query, params);
  return existing ? true : false;
};

// Then in createRate:
const isDuplicate = await checkDuplicate(
  franchiseId,
  from_pincode,
  to_pincode,
  service_type,
  weight_from,
  weight_to
);

if (isDuplicate) {
  return res.status(409).json({
    success: false,
    message: "A rate already exists for this route and weight slab",
  });
}

// And in updateRate:
const isDuplicate = await checkDuplicate(
  franchiseId,
  from_pincode,
  to_pincode,
  service_type,
  weight_from,
  weight_to,
  id // Exclude current rate from check
);

if (isDuplicate) {
  return res.status(409).json({
    success: false,
    message: "A rate already exists for this route and weight slab",
  });
}
```

### ✅ Recommended

Use **Option A** (database constraint) for data integrity + **Option B** (app check) for better error messages

---

## 🟡 FIX #4: Effective Date & Versioning (HIGH PRIORITY)

### Problem

No way to:

- Schedule rates to become active on a future date
- Track history of rate changes
- Audit who changed what and when

### Solution: Add Versioning Table

**File:** Create new migration `backend/migrations/20240101000022_add_rate_versioning.cjs`

```javascript
exports.up = function (knex) {
  // Add columns to rate_master
  return knex.schema
    .alterTable("rate_master", (table) => {
      table.date("effective_from").nullable(); // When this rate becomes active
      table.date("effective_to").nullable(); // When this rate expires
      table.integer("created_by").unsigned().nullable(); // User who created it
      table.string("change_reason", 255).nullable(); // Why was it changed
      table.boolean("is_archived").defaultTo(false); // Soft delete
    })
    .then(() => {
      // Create versioning table for history
      return knex.schema.createTable("rate_master_history", (table) => {
        table.increments("id").primary();
        table.integer("rate_id").unsigned().notNullable();
        table.integer("franchise_id").unsigned().notNullable();
        table.string("from_pincode", 10).notNullable();
        table.string("to_pincode", 10).notNullable();
        table.string("service_type", 50).notNullable();
        table.decimal("weight_from", 10, 2).notNullable();
        table.decimal("weight_to", 10, 2).notNullable();
        table.decimal("rate", 10, 2).notNullable();
        table.decimal("fuel_surcharge", 5, 2).nullable();
        table.decimal("gst_percentage", 5, 2).nullable();
        table.date("effective_from").nullable();
        table.date("effective_to").nullable();
        table.string("action", 20).notNullable(); // 'CREATE', 'UPDATE', 'DELETE'
        table.integer("changed_by").unsigned().nullable();
        table.string("change_reason", 255).nullable();
        table.timestamps(true, true);

        table
          .foreign("franchise_id")
          .references("franchises.id")
          .onDelete("CASCADE");
        table
          .foreign("rate_id")
          .references("rate_master.id")
          .onDelete("CASCADE");
        table.index(["rate_id", "created_at"]);
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("rate_master_history").then(() => {
    return knex.schema.alterTable("rate_master", (table) => {
      table.dropColumn("effective_from");
      table.dropColumn("effective_to");
      table.dropColumn("created_by");
      table.dropColumn("change_reason");
      table.dropColumn("is_archived");
    });
  });
};
```

### Update Controller to Track Changes

```javascript
// Helper to record history
const recordRateHistory = async (rateId, franchiseId, rateData, action, userId, reason = null) => {
  const db = getDb();
  await db.query(
    `INSERT INTO rate_master_history
     (rate_id, franchise_id, from_pincode, to_pincode, service_type,
      weight_from, weight_to, rate, fuel_surcharge, gst_percentage,
      effective_from, effective_to, action, changed_by, change_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rateId,
      franchiseId,
      rateData.from_pincode,
      rateData.to_pincode,
      rateData.service_type,
      rateData.weight_from,
      rateData.weight_to,
      rateData.rate,
      rateData.fuel_surcharge,
      rateData.gst_percentage,
      rateData.effective_from || null,
      rateData.effective_to || null,
      action,
      userId,
      reason,
    ]
  );
};

// Update createRate to use effective_from
export const createRate = async (req, res) => {
  try {
    // ... validation code ...

    const { effective_from, change_reason } = req.body;
    const userId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO rate_master
       (franchise_id, from_pincode, ..., effective_from, created_by, change_reason, status)
       VALUES (?, ?, ..., ?, ?, ?, 'active')`,
      [franchiseId, ..., effective_from || new Date(), userId, change_reason]
    );

    // Record in history
    await recordRateHistory(result.insertId, franchiseId, req.body, 'CREATE', userId, change_reason);

    res.status(201).json({
      success: true,
      message: 'Rate created successfully',
      data: { id: result.insertId },
    });
  } catch (error) { ... }
};

// Soft delete instead of hard delete
export const deleteRate = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const db = getDb();

    // Get rate data before deletion
    const [[rate]] = await db.query(
      'SELECT * FROM rate_master WHERE id = ? AND franchise_id = ?',
      [id, franchiseId]
    );

    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate not found' });
    }

    // Soft delete: mark as archived
    const [result] = await db.query(
      'UPDATE rate_master SET is_archived = true WHERE id = ? AND franchise_id = ?',
      [id, franchiseId]
    );

    // Record in history
    await recordRateHistory(id, franchiseId, rate, 'DELETE', userId, reason || 'Deleted by user');

    res.json({ success: true, message: 'Rate deleted successfully' });
  } catch (error) { ... }
};

// Add endpoint to view history
export const getRateHistory = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { rateId } = req.params;
    const db = getDb();

    const [history] = await db.query(
      `SELECT * FROM rate_master_history
       WHERE rate_id = ? AND franchise_id = ?
       ORDER BY created_at DESC`,
      [rateId, franchiseId]
    );

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};
```

---

## 📋 Summary of All Changes

| Fix                             | Type      | Priority    | Files                       | Status             |
| ------------------------------- | --------- | ----------- | --------------------------- | ------------------ |
| Field name (rate_per_kg → rate) | Code      | 🔴 CRITICAL | rateMasterController.js     | Ready to implement |
| Input validation                | Code      | 🔴 CRITICAL | rateMasterController.js     | Ready to implement |
| Unique constraint               | DB        | 🔴 CRITICAL | New migration + Controller  | Ready to implement |
| Effective date tracking         | DB + Code | 🟡 HIGH     | New migrations + Controller | Ready to implement |

---

## 🚀 Implementation Steps

### Step 1: Update Controller (15 minutes)

- [ ] Change all `rate_per_kg` to `rate`
- [ ] Add `validateRateInput()` function
- [ ] Add validation to `createRate()` and `updateRate()`

### Step 2: Add Unique Constraint (5 minutes)

- [ ] Create migration for unique constraint
- [ ] Run migration: `npm run migrate`

### Step 3: Add Versioning (20 minutes)

- [ ] Create versioning migration
- [ ] Update controller to track changes
- [ ] Add `getRateHistory` endpoint

### Step 4: Test (10 minutes)

- [ ] Run test script: `node test_ratemaster_validation.cjs`
- [ ] Verify all validations work
- [ ] Test history tracking

**Total Time:** ~50 minutes

---

## ✅ Validation Checklist

After implementing all fixes:

- [ ] Negative rate rejected ✅
- [ ] Reversed weight range rejected ✅
- [ ] Invalid service_type rejected ✅
- [ ] Duplicate rates rejected ✅
- [ ] Empty fields rejected ✅
- [ ] Effective date supported ✅
- [ ] Rate history tracked ✅
- [ ] Edit functionality works ✅
- [ ] Soft delete implemented ✅
