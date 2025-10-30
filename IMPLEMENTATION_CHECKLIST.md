# RateMaster Workflow - Implementation Checklist ✅

---

## 📋 Pre-Implementation Review

Before proceeding with implementation, verify:

- [ ] Read `WORKFLOW_ANALYSIS_AND_FIXES.md` - Understand issues found
- [ ] Read `RATEMASTER_INVOICE_WORKFLOW_IMPLEMENTATION.md` - Understand architecture
- [ ] Read `CODE_CHANGES_BEFORE_AFTER.md` - See exact code changes
- [ ] Backup your database
- [ ] Have test data ready (RateMaster entries, test customers)

---

## 🔧 Implementation Steps

### Step 1: Create New Service File

**File**: `backend/src/services/rateCalculationService.js`

- [ ] Create new file at correct location
- [ ] Copy content from `RATEMASTER_INVOICE_WORKFLOW_IMPLEMENTATION.md` → Code section
- [ ] Verify all 8 functions are present:
  - `fetchRateFromMaster`
  - `calculateLineAmount`
  - `calculateTaxAmount`
  - `calculateFuelSurcharge`
  - `calculateNetAmount`
  - `calculateBookingRate`
  - `calculateInvoiceTotals`
  - `validateRateCalculation`
- [ ] Test: `npm run lint backend/src/services/rateCalculationService.js`

---

### Step 2: Fix rateMasterController.js

**File**: `backend/src/controllers/rateMasterController.js`

**Changes at lines 91-110**:

- [ ] Replace `rate.rate_per_kg` with `rate.rate` (2 locations)
- [ ] Add proper decimal formatting: `parseFloat(value.toFixed(2))`
- [ ] Add to response:
  - `gst_percent: parseFloat(rate.gst_percentage) || 18`
  - `fuel_surcharge: parseFloat(rate.fuel_surcharge) || 0`
- [ ] Test: Curl endpoint to verify response format

**Verification Query**:

```bash
curl -X POST http://localhost:5000/api/rates/calculate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_pincode":"*",
    "to_pincode":"400001",
    "weight":2.5,
    "service_type":"Air"
  }'

# Should return: rate, total_amount, gst_percent, fuel_surcharge
```

---

### Step 3: Update bookingController.js

**File**: `backend/src/controllers/bookingController.js`

**Line 2 - Add import**:

```javascript
import { calculateBookingRate } from "../services/rateCalculationService.js";
```

- [ ] Add import at top of file

**Lines 213-262 - Replace rate calculation logic**:

- [ ] Remove old simple calculation
- [ ] Add new rate calculation flow (see CODE_CHANGES_BEFORE_AFTER.md)
- [ ] Includes:
  - Call to `calculateBookingRate()` service
  - Graceful error handling
  - Fallback to provided amount
  - Initialization of tax/fuel variables

**Lines 264-294 - Update bookingData object**:

- [ ] Add new fields:
  - `tax_amount`
  - `fuel_amount`
  - `gst_percent`
  - `fuel_percent`
- [ ] Ensure all values use `parseFloat(...toFixed(2))`

**Test Script**:

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consignment_no":"TEST001",
    "customer_id":"C-001",
    "char_wt":2.5,
    "qty":1,
    "mode":"AR",
    "pincode":"400001",
    "booking_date":"2024-01-15"
  }'

# Response should include: id with calculated amounts
```

**Verify in DB**:

```sql
SELECT amount, tax_amount, fuel_amount, total
FROM bookings WHERE consignment_number = 'TEST001';

# Should show calculated breakdown
```

---

### Step 4: Update invoiceController.js

**File**: `backend/src/controllers/invoiceController.js`

**Line 2 - Add import**:

```javascript
import { calculateInvoiceTotals } from "../services/rateCalculationService.js";
```

- [ ] Add import at top

**Lines 307-356 - Update generateInvoice() function**:

- [ ] Fetch booking with all calculated amounts
- [ ] Use pre-calculated values (don't recalculate)
- [ ] Mark bookings as "Billed"
- [ ] Create invoice_items with proper breakdown

**Lines 404-500 - Update generateMultipleInvoices() function**:

- [ ] Add `AND invoice_id IS NULL` to query (unbilled only)
- [ ] Select specific columns (id, consignment_number, qty, amount, tax_amount, etc.)
- [ ] Replace invoice insertion to include all charge fields
- [ ] Mark bookings as billed after creation
- [ ] Aggregate amounts WITHOUT recalculation

**Test Script**:

```bash
curl -X POST http://localhost:5000/api/invoices/generate-multiple \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customers":["C-001"],
    "period_from":"2024-01-01",
    "period_to":"2024-01-31",
    "gst_percent":18
  }'

# Should return: success with invoice numbers
```

**Verify in DB**:

```sql
SELECT
  invoice_number,
  subtotal_amount,
  gst_amount_new,
  fuel_surcharge_total,
  net_amount
FROM invoices
WHERE customer_id = 'C-001'
ORDER BY created_at DESC LIMIT 1;

# Verify totals are correct
```

---

### Step 5: Create Database Migration

**File**: `backend/migrations/20240101000024_add_calculated_amounts_to_bookings.cjs`

- [ ] Create new migration file with timestamp 20240101000024
- [ ] Copy migration content from provided file
- [ ] Verify migration adds these columns:
  - `tax_amount` (DECIMAL 10,2)
  - `fuel_amount` (DECIMAL 10,2)
  - `gst_percent` (DECIMAL 5,2)
  - `fuel_percent` (DECIMAL 5,2)
  - `from_pincode` (VARCHAR 10)
  - `to_pincode` (VARCHAR 10)
  - `rate` (DECIMAL 10,2)
  - `rate_master_id` (INT UNSIGNED)

**Run Migration**:

```bash
cd backend
npm run migrate
# OR
npx knex migrate:latest
```

**Verify Migration Applied**:

```sql
DESCRIBE bookings;

# Should show all new columns listed above
```

---

## ✅ Testing Phase

### Test 1: RateMaster Lookup

```bash
# In database:
INSERT INTO rate_master (franchise_id, from_pincode, to_pincode,
service_type, weight_from, weight_to, rate, gst_percentage, fuel_surcharge)
VALUES (1, '*', '400001', 'Air', 0, 10, 500, 18, 2);

# Via API:
curl .../api/rates/calculate \
  -d '{"from_pincode":"*","to_pincode":"400001","weight":2.5,"service_type":"Air"}'

# Expected: rate: 500, gst_percent: 18, fuel_surcharge: 2
```

### Test 2: Booking Auto-Calculation

```bash
# Create booking:
curl .../api/bookings -d '{
  "consignment_no":"TEST001",
  "customer_id":"C-001",
  "char_wt":2.5,
  "qty":1,
  "mode":"AR",
  "pincode":"400001"
}'

# Verify in database:
SELECT amount, tax_amount, fuel_amount, total FROM bookings WHERE id = 101;

# Expected:
# amount: 500 (2.5kg × 200 per kg? or rate × qty)
# tax_amount: 90 (500 × 18%)
# fuel_amount: 10 (500 × 2%)
# total: 600
```

### Test 3: Invoice Single Booking

```bash
# Generate invoice for specific booking:
curl .../api/invoices/generate -d '{
  "customer_id":"C-001",
  "bookings":[101],
  "invoice_date":"2024-01-15"
}'

# Verify:
# 1. Invoice created
# 2. Invoice items show booking details
# 3. Booking marked as 'Billed'
# 4. Amounts match booking totals
```

### Test 4: Invoice Multiple Bookings

```bash
# Create 3 bookings first
# Generate invoice for multiple:
curl .../api/invoices/generate-multiple -d '{
  "customers":["C-001"],
  "period_from":"2024-01-01",
  "period_to":"2024-01-31"
}'

# Verify:
# 1. All unbilled bookings included
# 2. Totals are sums without recalculation
# 3. All bookings marked as 'Billed'
# 4. No double-taxation
```

### Test 5: Calculate Invoice Total Manually

```sql
-- For 3 bookings at 600 each:
SELECT
  SUM(amount) as subtotal,      -- 1500
  SUM(tax_amount) as tax_total, -- 270
  SUM(fuel_amount) as fuel_total -- 30
FROM bookings WHERE id IN (101,102,103);

-- Expected invoice:
-- subtotal: 1500
-- tax: 270
-- fuel: 30
-- net: 1800
```

---

## 🔍 Verification Checklist

### Code Quality

- [ ] No syntax errors
- [ ] All imports correct
- [ ] Functions properly exported
- [ ] Proper error handling
- [ ] Decimal formatting consistent

### Data Integrity

- [ ] All bookings have calculated amounts
- [ ] No double-taxation in invoices
- [ ] Booking status updated correctly
- [ ] Invoice items match booking totals

### Performance

- [ ] Rate lookup fast (indexed query)
- [ ] No N+1 queries
- [ ] Migration completed without errors
- [ ] Database queries efficient

### Business Logic

- [ ] Different rates for Doc vs NonDoc
- [ ] Different rates for Air vs Surface
- [ ] Weight slabs applied correctly
- [ ] GST calculated once only
- [ ] Fuel surcharge applied correctly

---

## 📊 Post-Implementation Validation

### Database Queries

```sql
-- Check 1: Bookings with calculated amounts
SELECT COUNT(*) as bookings_with_tax
FROM bookings WHERE tax_amount > 0;

-- Check 2: All invoices have correct totals
SELECT
  id,
  net_amount,
  (subtotal_amount + gst_amount_new + COALESCE(fuel_surcharge_total,0)) as calculated_net,
  (net_amount - (subtotal_amount + gst_amount_new + COALESCE(fuel_surcharge_total,0))) as diff
FROM invoices
HAVING diff != 0;  -- Should be empty

-- Check 3: Bookings marked as billed
SELECT COUNT(*) as billed_bookings
FROM bookings WHERE invoice_id IS NOT NULL AND status = 'Billed';
```

### API Endpoints Verification

```bash
# Test all modified endpoints:
1. GET /api/rates (list rates)
2. POST /api/rates/calculate (calculate rate)
3. POST /api/bookings (create with auto-calc)
4. GET /api/bookings/:id (verify amounts)
5. POST /api/invoices/generate (single invoice)
6. POST /api/invoices/generate-multiple (batch invoices)
7. GET /api/invoices/:id (verify totals)
```

---

## 🎯 Success Criteria

✅ All tests pass
✅ No errors in logs
✅ Invoice totals accurate
✅ No double-taxation
✅ Booking status updated
✅ Database migration complete
✅ All columns present
✅ Rate calculations working
✅ Performance acceptable
✅ Code quality good

---

## 🚨 Rollback Plan

If issues found:

1. Keep backup of original files
2. Revert booking controller changes
3. Revert invoice controller changes
4. Revert rate master controller changes
5. Remove migration or run down migration
6. Remove service file
7. Redeploy from backup

---

## 📞 Troubleshooting

### Issue: "Cannot find module 'rateCalculationService'"

**Fix**: Verify file exists at `backend/src/services/rateCalculationService.js`

### Issue: "Field 'rate_per_kg' doesn't exist"

**Fix**: Update query to use `rate` instead

### Issue: Invoice totals incorrect

**Fix**: Check bookings have tax_amount populated

### Issue: Rate calculation errors

**Fix**: Verify RateMaster entries exist for test parameters

---

## 📝 Documentation to Review

1. ✅ `WORKFLOW_ANALYSIS_AND_FIXES.md` - Issues and solutions
2. ✅ `RATEMASTER_INVOICE_WORKFLOW_IMPLEMENTATION.md` - Complete guide
3. ✅ `CODE_CHANGES_BEFORE_AFTER.md` - Exact code changes
4. ✅ `RATEMASTER_WORKFLOW_QUICK_TEST.md` - Testing guide
5. ✅ `IMPLEMENTATION_SUMMARY_COMPLETE.md` - Summary

---

## ✅ Sign-Off

- [ ] All changes reviewed by: ******\_\_\_******
- [ ] Testing completed by: ******\_\_\_******
- [ ] Approved for production by: ******\_\_\_******
- [ ] Implementation date: ******\_\_\_******
- [ ] Rollback plan documented: Yes / No

---

## 🎉 Completion

Once all checkboxes are marked, the implementation is complete and ready for production use!
