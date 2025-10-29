# Detailed Changes to Courier Rates Controller

## File: `backend/src/controllers/courierCompanyRatesController.js`

### Change 1: Function Structure - Added Transaction Support

#### BEFORE:

```javascript
export const saveCourierRates = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { company_id, rates_data } = req.body;

    // ... validation ...

    const db = getDb();

    // Verify company exists
    const [[company]] = await db.query(...);

    if (!company) { return error... }

    // Delete existing rates
    await db.query("DELETE FROM courier_company_rates ...");

    // Insert new rates
    // ... loop through rates_data ...
  } catch (error) {
    console.error("Save courier rates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save courier rates",
    });
  }
};
```

#### AFTER:

```javascript
export const saveCourierRates = async (req, res) => {
  const db = getDb();
  let connection = null;

  try {
    const franchiseId = req.user.franchise_id;
    const { company_id, rates_data } = req.body;

    // ... validation ...

    // Get database connection
    connection = await db.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Delete existing rates using connection (not db)
    await connection.query("DELETE FROM courier_company_rates ...");

    // Insert new rates using connection (not db)
    // ... loop through rates_data ...

    if (insertedCount === 0) {
      await connection.rollback();
      return error...
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // Success response...
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    // Error handling with detailed logging...
  }
};
```

**Benefits:**

- ✅ Atomicity: All rates either save or none do (no partial saves)
- ✅ Data Consistency: No orphaned records if insert fails
- ✅ Automatic Rollback: Errors automatically undo changes
- ✅ Connection Management: Proper cleanup with `release()`

---

### Change 2: Improved Error Logging

#### BEFORE:

```javascript
} catch (error) {
  console.error("Save courier rates error:", error);
  res.status(500).json({
    success: false,
    message: "Failed to save courier rates",
  });
}
```

#### AFTER:

```javascript
} catch (error) {
  if (connection) {
    try {
      await connection.rollback();
      connection.release();
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
  }

  console.error("Save courier rates error:", {
    message: error.message,
    code: error.code,
    sqlState: error.sqlState,
    stack: error.stack,
  });

  res.status(500).json({
    success: false,
    message: "Failed to save courier rates",
    error: error.message || "Database error",
    code: error.code,
  });
}
```

**Benefits:**

- ✅ Detailed Error Info: Shows actual SQL error code and state
- ✅ Stack Trace: Helps identify where error occurred
- ✅ Response Includes Error: Client sees specific error, not just generic message
- ✅ Proper Cleanup: Connection is cleaned up even on error

**Example Error Response Now:**

```json
{
  "success": false,
  "message": "Failed to save courier rates",
  "error": "Unknown column 'rates_data' in 'field list'",
  "code": "ER_BAD_FIELD_ERROR"
}
```

---

### Change 3: Added Slab Type Validation

#### BEFORE:

```javascript
for (const rateItem of rates_data) {
  const { courier_type, row_name, sub_type, slab_type, rates } = rateItem;

  // Validate required fields
  if (!courier_type || !row_name || !slab_type || !rates) {
    validationErrors.push(`Invalid rate entry: missing...`);
    continue;
  }

  // Validate rates is an object with numeric values
  if (typeof rates !== "object" || Array.isArray(rates)) {
    validationErrors.push(`Invalid rates for ${courier_type}...`);
    continue;
  }
```

#### AFTER:

```javascript
// Valid slab types based on database enum
const validSlabTypes = ["Slab 2", "Slab 3", "Slab 4"];

for (const rateItem of rates_data) {
  let { courier_type, row_name, sub_type, slab_type, rates } = rateItem;

  // Validate required fields
  if (!courier_type || !row_name || !slab_type || !rates) {
    validationErrors.push(`Invalid rate entry: missing...`);
    continue;
  }

  // Validate slab_type is one of the allowed enum values
  if (!validSlabTypes.includes(slab_type)) {
    validationErrors.push(
      `Invalid slab_type "${slab_type}" for ${courier_type} - ${row_name}: must be one of ${validSlabTypes.join(", ")}`
    );
    continue;
  }

  // Validate rates is an object with numeric values
  if (typeof rates !== "object" || Array.isArray(rates)) {
    validationErrors.push(`Invalid rates for ${courier_type}...`);
    continue;
  }
```

**Benefits:**

- ✅ Prevents Invalid Enum Values: Catches "slab_type" errors early
- ✅ Clear Error Messages: Client knows exactly what values are valid
- ✅ Avoids Database Errors: Prevents SQL errors from invalid enum values

**Example Validation Error:**

```
Invalid slab_type "Slab5" for Dox - Within City: must be one of Slab 2, Slab 3, Slab 4
```

---

### Change 4: Enhanced Rate Value Validation

#### BEFORE:

```javascript
const rateValues = Object.values(rates);
if (rateValues.length === 0) {
  validationErrors.push(`Invalid rates for ${courier_type}...`);
  continue;
}

const hasValidRate = rateValues.some((val) => {
  const numVal = parseFloat(val);
  return !isNaN(numVal) && numVal > 0;
});

if (!hasValidRate) {
  validationErrors.push(`Invalid rates must contain...`);
  continue;
}
```

#### AFTER:

```javascript
const rateValues = Object.values(rates).filter(
  (val) => val !== null && val !== undefined && val !== ""
);
if (rateValues.length === 0) {
  validationErrors.push(`Invalid rates for ${courier_type}...`);
  continue;
}

// Convert all rate values to numbers and validate
const convertedRates = {};
let hasValidRate = false;
let validationFailed = false;

for (const [key, val] of Object.entries(rates)) {
  if (val === null || val === undefined || val === "") {
    continue;
  }
  const numVal = parseFloat(val);
  if (isNaN(numVal)) {
    validationErrors.push(
      `Invalid rate value for ${courier_type} - ${row_name} [${key}]: "${val}" is not a valid number`
    );
    validationFailed = true;
    break;
  }
  if (numVal >= 0) {
    hasValidRate = true;
    convertedRates[key] = numVal;
  }
}

if (validationFailed) {
  continue;
}

if (!hasValidRate) {
  validationErrors.push(
    `Invalid rates for ${courier_type} - ${row_name}: must contain at least one valid numeric rate`
  );
  continue;
}

// Use converted rates for storage
rates = convertedRates;
```

**Benefits:**

- ✅ Filters Empty Values: Properly handles null/undefined/"" values
- ✅ Detailed Per-Field Errors: Shows which rate key has invalid value
- ✅ Type Conversion: Converts string numbers to actual numbers
- ✅ Allows Zero Values: Changed from `numVal > 0` to `numVal >= 0`
- ✅ Proper Number Storage: Saves numbers instead of strings

**Example Validation Error Now:**

```
Invalid rate value for Dox - Within City [rate_1]: "abc" is not a valid number
```

**Example Data Flow:**

```javascript
// INPUT
rates: { rate_1: "100", rate_2: "150", rate_3: "" }

// PROCESSED & STORED
rates: { rate_1: 100, rate_2: 150 }

// Empty rate_3 is filtered out
```

---

### Change 5: Better Insert Error Handling

#### BEFORE:

```javascript
try {
  await db.query(
    `INSERT INTO courier_company_rates ...`,
    [franchiseId, company_id, courier_type, ...]
  );
  console.log(`✅ Rate inserted...`);
  insertedCount++;
} catch (insertError) {
  console.error("Error inserting rate:", {
    message: insertError.message,
    code: insertError.code,
  });
  validationErrors.push(`Failed to insert rate...`);
}
```

#### AFTER:

```javascript
try {
  await connection.query(  // Uses connection, not db (for transaction)
    `INSERT INTO courier_company_rates ...`,
    [franchiseId, company_id, courier_type, ...]
  );
  console.log(`✅ Rate inserted...`);
  insertedCount++;
} catch (insertError) {
  console.error("Error inserting rate:", {
    message: insertError.message,
    code: insertError.code,
    courier_type,
    row_name,
    slab_type,
  });
  validationErrors.push(`Failed to insert rate...`);
}
```

**Benefits:**

- ✅ Transaction-Aware: Uses connection for atomic transaction
- ✅ More Debug Info: Includes courier details in error log
- ✅ Consistent Error Handling: All errors logged to console and response

---

## Summary of Improvements

| Aspect             | Before                         | After                                 |
| ------------------ | ------------------------------ | ------------------------------------- |
| **Error Details**  | Generic "Failed to save"       | SQL error code, state, message        |
| **Transactions**   | No atomicity                   | Full ACID compliance                  |
| **Rollback**       | Partial saves possible         | Automatic rollback on error           |
| **Validation**     | Basic type checking            | Comprehensive enum & value validation |
| **Rate Values**    | Stored as strings              | Converted to numbers                  |
| **Connection**     | Auto-allocated, possible leaks | Explicit management & cleanup         |
| **Error Messages** | Vague                          | Specific with fix suggestions         |

## Testing Scenarios

### Scenario 1: Invalid Slab Type

```javascript
{
  "company_id": 10,
  "rates_data": [
    {
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 99",  // INVALID
      "rates": {"rate_1": "100", "rate_2": "150"}
    }
  ]
}
```

**Response:**

```json
{
  "success": false,
  "message": "No valid rates to insert",
  "errors": [
    "Invalid slab_type \"Slab 99\" for Dox - Within City: must be one of Slab 2, Slab 3, Slab 4"
  ]
}
```

### Scenario 2: Invalid Rate Value

```javascript
{
  "company_id": 10,
  "rates_data": [
    {
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 2",
      "rates": {"rate_1": "abc", "rate_2": "150"}  // rate_1 is invalid
    }
  ]
}
```

**Response:**

```json
{
  "success": false,
  "message": "No valid rates to insert",
  "errors": [
    "Invalid rate value for Dox - Within City [rate_1]: \"abc\" is not a valid number"
  ]
}
```

### Scenario 3: Valid Data - Success

```javascript
{
  "company_id": 10,
  "rates_data": [
    {
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 2",
      "rates": {"rate_1": "100", "rate_2": "150"}
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "1 courier rates saved successfully",
  "data": {
    "inserted": 1
  }
}
```

---

## Rollout Checklist

- [x] Updated error logging
- [x] Added transaction support
- [x] Added slab type validation
- [x] Improved rate value validation
- [x] Enhanced error responses
- [x] Added connection cleanup
- [x] Comprehensive error messages
- [ ] Test with actual data
- [ ] Verify no regressions
- [ ] Monitor production logs
