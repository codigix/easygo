# Courier Rates Save Error - Fix Guide

## Problem Summary

- **Error**: `Failed to save courier rates` (HTTP 500)
- **Endpoint**: `POST /api/rates/courier`
- **Root Cause**: Generic error handling was masking the actual database error

## Changes Made

### 1. ✅ Improved Error Logging

**File**: `backend/src/controllers/courierCompanyRatesController.js`

**Before**: Generic error message with no details

```javascript
catch (error) {
  console.error("Save courier rates error:", error);
  res.status(500).json({
    success: false,
    message: "Failed to save courier rates",
  });
}
```

**After**: Detailed error logging with SQL information

```javascript
catch (error) {
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

### 2. ✅ Added Slab Type Validation

Validates that `slab_type` matches the database enum values (`Slab 2`, `Slab 3`, `Slab 4`)

```javascript
const validSlabTypes = ["Slab 2", "Slab 3", "Slab 4"];

if (!validSlabTypes.includes(slab_type)) {
  validationErrors.push(
    `Invalid slab_type "${slab_type}" for ${courier_type} - ${row_name}`
  );
  continue;
}
```

### 3. ✅ Improved Rate Value Conversion

Better handling of rate values - converts strings to numbers properly:

```javascript
// Convert all rate values to numbers and validate
const convertedRates = {};
let hasValidRate = false;

for (const [key, val] of Object.entries(rates)) {
  if (val === null || val === undefined || val === "") {
    continue;
  }
  const numVal = parseFloat(val);
  if (isNaN(numVal)) {
    validationErrors.push(
      `Invalid rate value [...]: "${val}" is not a valid number`
    );
    continue;
  }
  if (numVal >= 0) {
    hasValidRate = true;
    convertedRates[key] = numVal;
  }
}
```

### 4. ✅ Added Transaction Support

Ensures data integrity with proper transaction handling:

```javascript
// Get database connection
connection = await db.getConnection();

// Start transaction
await connection.beginTransaction();

// ... perform inserts ...

// Commit transaction
await connection.commit();
connection.release();

// On error: Rollback
if (connection) {
  await connection.rollback();
  connection.release();
}
```

## How to Test

### Option 1: Using the PowerShell Test Script

```powershell
Set-Location "c:\Users\admin\Desktop\easygo"
.\test_courier_rates.ps1
```

### Option 2: Using cURL

```bash
curl -X POST http://localhost:5000/api/rates/courier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company_id": 10,
    "rates_data": [
      {
        "courier_type": "Dox",
        "row_name": "Within City",
        "slab_type": "Slab 2",
        "rates": {"rate_1": "1", "rate_2": "1"}
      }
    ]
  }'
```

## Expected Response on Success

```json
{
  "success": true,
  "message": "X courier rates saved successfully",
  "data": {
    "inserted": X,
    "errors": null
  }
}
```

## Expected Response on Error (with detailed info)

```json
{
  "success": false,
  "message": "Failed to save courier rates",
  "error": "Database error details here",
  "code": "ER_ERROR_CODE"
}
```

## Common Issues & Solutions

### Issue 1: Missing Rates

**Error**: `rates object is empty`
**Solution**: Ensure each rate item has at least one rate_1, rate_2, etc. with a numeric value

### Issue 2: Invalid Rate Type

**Error**: `rates must be an object`
**Solution**: Ensure rates is an object: `rates: {"rate_1": "100", "rate_2": "150"}`

### Issue 3: Invalid Slab Type

**Error**: `Invalid slab_type`
**Solution**: Use only: `"Slab 2"`, `"Slab 3"`, or `"Slab 4"` (exact case matching required)

### Issue 4: Non-numeric Rate Values

**Error**: `is not a valid number`
**Solution**: Ensure all rate values are numeric strings or numbers: `"100"` or `100`, NOT `"abc"`

### Issue 5: Database Connection Error

**Error**: Will show actual SQL error in response
**Solution**: Check that:

- MySQL is running
- Connection credentials in .env are correct
- Database and tables exist

## Database Requirements

Ensure the `courier_company_rates` table exists with:

- Columns: `id`, `franchise_id`, `company_id`, `courier_type`, `row_name`, `sub_type`, `slab_type`, `rates`, `status`
- `slab_type` is an ENUM with values: `"Slab 2"`, `"Slab 3"`, `"Slab 4"`
- `rates` is a JSON column

Run migrations if needed:

```bash
cd backend
npm run migrate
```

## Server Logs Location

Check the backend console for detailed error messages:

```
c:\Users\admin\Desktop\easygo\backend
```

Look for lines starting with:

- `✅ Rate inserted:` - Successful inserts
- `Error inserting rate:` - Failed inserts with error details
- `Save courier rates error:` - Main error details

## Next Steps

1. **Restart Backend** (if needed):

   ```powershell
   Set-Location "c:\Users\admin\Desktop\easygo\backend"
   npm start
   ```

2. **Run Test**: Execute the test script above

3. **Check Logs**: Monitor backend console for error details

4. **Report Error**: If still failing, share:
   - The exact error message from the response
   - The backend console logs
   - The data being sent

## Files Modified

- ✅ `backend/src/controllers/courierCompanyRatesController.js` - Updated `saveCourierRates` function

## Verification Checklist

- [x] Error logging improved with SQL details
- [x] Rate value validation enhanced
- [x] Slab type validation added
- [x] Transaction handling implemented
- [x] Rollback on error added
- [x] Connection cleanup added
