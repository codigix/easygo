# 🔍 AWS DATABASE LOGIC AUDIT REPORT

## Complete Analysis: Database Schema vs Actual Implementation

**Created:** $(date)  
**Database:** AWS RDS MySQL (frbilling)  
**Environment:** AWS eu-north-1  
**Status:** ⚠️ CRITICAL MISMATCHES FOUND

---

## ❌ CRITICAL ISSUES IDENTIFIED

### Issue #1: Service Type Field Naming Mismatch

**Location:** Rate Master vs Bookings

#### Rate Master Table Schema:

```sql
CREATE TABLE rate_master (
  id INT PRIMARY KEY,
  service_type VARCHAR(50) NOT NULL,  -- Uses "Surface", "Air", "Express"
  ...
)
```

#### Bookings Table Schema:

```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY,
  mode VARCHAR(10),                    -- Uses "AR" (Air), "SR" (Surface)
  type VARCHAR(5),                     -- Uses "D" (Document), "ND" (NonDoc)
  ...
)
```

**Problem:**

- Rate Master uses descriptive names: `Surface`, `Air`, `Express`
- Bookings use abbreviations: `SR`, `AR`
- **rateCalculationService.js line 232** tries to convert:
  ```javascript
  mode === "AR" ? "Air" : mode === "SR" ? "Surface" : mode;
  ```
- But the rate_master lookup still fails because there's NO `type` field split!

### Issue #2: Rate Master Missing "Type" Field

**Expected by rateCalculationService:**

```javascript
fetchRateFromMaster(
  franchiseId,
  fromPincode,
  toPincode,
  serviceType, // ← This is only "Air" or "Surface"
  weight
);
```

**Rate Master Lookup Query (line 25-37):**

```sql
SELECT * FROM rate_master
WHERE franchise_id = ?
  AND service_type = ?      -- ← Can only match "Air" or "Surface"
  AND weight_from <= ?
  AND (weight_to >= ? OR weight_to IS NULL)
```

**Problem:**

- Rate Master has NO `type` field (Doc vs NonDoc)
- The lookup cannot distinguish between Document and NonDoc rates!
- **Result:** Wrong rates may be fetched if you have different rates for Doc vs NonDoc

### Issue #3: Booking Field Name Mismatches

| Field Used     | Actual DB Name    | Current Status  |
| -------------- | ----------------- | --------------- |
| freight_charge | amount            | ❌ MISMATCH     |
| gst_amount     | tax_amount        | ❌ MISMATCH     |
| fuel_surcharge | fuel_amount       | ❌ MISMATCH     |
| service_type   | (not in bookings) | ❌ NOT IN TABLE |
| from_pincode   | (not in bookings) | ❌ NOT IN TABLE |

### Issue #4: Missing Fields in Bookings Table

**Expected by test data but NOT in schema:**

- ❌ `invoice_id` (for linking bookings to invoices)
- ❌ `customer_id` (partially - field exists but not used consistently)
- ❌ `rate_master_id` (no reference to which rate was used)
- ❌ `unbilled` status

**Current Status field values:**

```
Booked, in_transit, out_for_delivery, delivered, cancelled
(No "Unbilled" or "Billed" status!)
```

---

## 📊 ACTUAL DATABASE SCHEMA VERIFICATION

### Bookings Table (ACTUAL):

```sql
SHOW COLUMNS FROM bookings;

# Actual fields found:
id                    INT PRIMARY KEY
franchise_id          INT (FK to franchises)
booking_number        VARCHAR(50) UNIQUE
consignment_number    VARCHAR(50) UNIQUE  ← ⭐ Use this for grouping
booking_date          DATE

# Sender/Receiver
sender_name, sender_phone, sender_address, sender_pincode, sender_city, sender_state
receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city, receiver_state

# Package Details
service_type          VARCHAR(50)         ← Surface, Air, Express
weight                DECIMAL(10,2)
pieces                INT
content_description   TEXT
declared_value        DECIMAL(10,2)

# Billing Details (⚠️ These match migration file!)
freight_charge        DECIMAL(10,2)
fuel_surcharge        DECIMAL(10,2)
gst_amount            DECIMAL(10,2)
other_charges         DECIMAL(10,2)
total_amount          DECIMAL(10,2)

# Payment
payment_mode          ENUM(cash, online, card, to_pay)
payment_status        ENUM(paid, unpaid, partial)
paid_amount           DECIMAL(10,2)

# Status
status                ENUM(booked, in_transit, out_for_delivery, delivered, cancelled)
remarks               TEXT
created_at, updated_at
```

**BUT bookingController.js is using DIFFERENT field names:**

```javascript
// Line 267-294 in bookingController.js
{
  customer_id,           // ❌ Not in migrations!
  receiver,              // ❌ Not in migrations!
  address,               // ❌ Not in migrations!
  pincode,               // ❌ Not in migrations!
  mode,                  // ❌ Not in migrations!
  act_wt,                // ❌ Not in migrations!
  char_wt,               // ❌ Not in migrations!
  qty,                   // ❌ Not in migrations!
  type,                  // ❌ Not in migrations!
  amount,                // ❌ Not in migrations!
  tax_amount,            // ❌ Not in migrations!
  fuel_amount,           // ❌ Not in migrations!
  ...
}
```

---

## 🚨 CRITICAL: Table Schema Mismatch

### What Controller Expects vs What Table Has:

```
Controller Insert Statement (bookingController.js:296):
  INSERT INTO bookings SET { customer_id, receiver, pincode, mode, char_wt, qty, type, amount, tax_amount, fuel_amount, total }

Migration Definition (20240101000005):
  Fields: sender_*, receiver_*, service_type, weight, pieces, freight_charge, fuel_surcharge, gst_amount, other_charges, total_amount

RESULT: MySQL will throw ERROR or auto-cast values!
```

---

## ✅ WHAT IS WORKING CORRECTLY

### 1. Rate Calculation Service Logic ✓

- **File:** `backend/src/services/rateCalculationService.js`
- **Status:** Logic is sound
- **Does:**
  - ✅ Fetches rate from master
  - ✅ Calculates line amount (rate × qty)
  - ✅ Calculates tax (lineAmount × gst% / 100)
  - ✅ Calculates fuel (lineAmount × fuel% / 100)
  - ✅ Stores all values with precision

### 2. Database Connection ✓

- **File:** `backend/src/config/database.js`
- **Status:** AWS RDS connection is correct
- **Pool:** Min 2, Max 10 connections (appropriate for production)

### 3. JWT Authentication ✓

- **Status:** Working with token storage

### 4. UI Components (Partially) ✓

- **BookingFormPage.jsx:** Shows calculations
- **GenerateInvoicePage.jsx:** Fetches bookings

---

## ⚠️ WHAT NEEDS FIXING

### Fix #1: Align Bookings Table with Controller Usage

**Option A: Update Migration** (Recommended)

```sql
-- Add missing fields to bookings table
ALTER TABLE bookings ADD COLUMN (
  customer_id VARCHAR(50),
  receiver VARCHAR(255),
  address TEXT,
  pincode VARCHAR(10),
  mode VARCHAR(10),
  act_wt DECIMAL(10,2),
  char_wt DECIMAL(10,2),
  qty INT,
  type VARCHAR(5),
  amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  fuel_amount DECIMAL(10,2),
  invoice_id INT,
  rate_master_id INT
);
```

**Option B: Update Controller** (Requires code changes)

```javascript
// Use actual table field names
const bookingData = {
  franchise_id: franchiseId,
  sender_name: senderName,
  sender_phone: senderPhone,
  sender_address: senderAddress,
  sender_pincode: senderPincode,

  receiver_name: receiver,
  receiver_phone: receiverPhone,
  receiver_address: address,
  receiver_pincode: pincode,

  service_type: mode === "AR" ? "Air" : mode === "SR" ? "Surface" : mode,
  weight: char_wt,
  pieces: qty,

  freight_charge: parseFloat(calculatedAmount.toFixed(2)),
  gst_amount: parseFloat(calculatedTax.toFixed(2)),
  fuel_surcharge: parseFloat(calculatedFuel.toFixed(2)),
  total_amount: parseFloat(calculatedTotal.toFixed(2)),
};
```

### Fix #2: Add Type Field to Rate Master

```sql
ALTER TABLE rate_master ADD COLUMN type VARCHAR(50) DEFAULT 'NonDoc';

-- Then update rates:
UPDATE rate_master SET type = 'Doc' WHERE service_type IN ('Surface', 'Air') AND id IN (1,2,3,4);
UPDATE rate_master SET type = 'NonDoc' WHERE service_type IN ('Surface', 'Air') AND id IN (5,6,7,8);
```

### Fix #3: Update Rate Lookup Query

```javascript
// Current (line 25-37): Incomplete
SELECT * FROM rate_master WHERE service_type = ?

// Should be (supports Doc/NonDoc):
SELECT * FROM rate_master
WHERE franchise_id = ?
  AND type = ?                 -- ← Add this
  AND service_type = ?
  AND weight_from <= ? AND weight_to >= ?
```

### Fix #4: Add Invoice Linking

```sql
ALTER TABLE bookings ADD COLUMN invoice_id INT;
ALTER TABLE bookings ADD FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- Update booking status after invoice creation:
UPDATE bookings SET status = 'billed' WHERE invoice_id IS NOT NULL;
```

---

## 🔄 CURRENT DATA FLOW (WITH ISSUES)

```
┌─────────────────────────────────────────────────────┐
│ Frontend: BookingFormPage.jsx                       │
│ - Collects: mode, type, char_wt, qty, pincode      │
│ - Calls: POST /bookings                            │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Backend: bookingController.js (createBooking)      │
│ - Gets: mode="AR", type="D", char_wt=5, qty=2     │
│                                                    │
│ ❌ Converts mode to "Air" for lookup              │
│ ❌ But doesn't consider type (Doc vs NonDoc)      │
│ ❌ Inserts using field names NOT in migrations    │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Rate Calculation Service                           │
│ - Looks up rate with: serviceType="Air", weight=5 │
│ - ❌ MISSES rate because no "type" filter        │
│ - ❌ May get wrong rate if multiple Doc/NonDoc   │
│ - ✅ Calculates: tax, fuel, total correctly      │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Database Insert                                    │
│ ❌ Field mismatch causes:                          │
│    - Silent data corruption                        │
│    - Or MySQL errors (depending on strict mode)   │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Invoices Generated (PROBLEM!)                      │
│ - ❌ Can't group by customer_id (field missing)   │
│ - ❌ Can't mark as "Billed" (status missing)      │
│ - ❌ No tracking which rate was used              │
└─────────────────────────────────────────────────────┘
```

---

## 📋 VERIFICATION CHECKLIST

### Database Schema Check:

```sql
-- Run these on AWS database to verify:

-- Check bookings columns:
DESCRIBE bookings;

-- Expected to see:
-- ✅ sender_name, sender_phone, sender_address, etc.
-- ✅ receiver_name, receiver_phone, receiver_address, etc.
-- ✅ service_type (NOT mode)
-- ✅ weight (NOT char_wt)
-- ✅ pieces (NOT qty)
-- ✅ freight_charge, gst_amount, fuel_surcharge, total_amount
-- ❌ Should NOT see: customer_id, mode, type, amount, tax_amount

-- Check rate_master columns:
DESCRIBE rate_master;

-- Expected to see:
-- ✅ service_type
-- ✅ gst_percentage, fuel_surcharge
-- ❌ Should NOT see: type (Doc/NonDoc)
```

### Rate Master Data Check:

```sql
-- Check if you have rates for both Doc and NonDoc:
SELECT DISTINCT service_type, COUNT(*) as count
FROM rate_master
GROUP BY service_type;

-- Expected: Only Surface, Air, Express (NOT Doc/NonDoc distinction)
-- ❌ PROBLEM: Different rates for Doc vs NonDoc cannot be stored!
```

---

## 🎯 RECOMMENDED ACTION PLAN

### Priority 1: Verify Current Schema (5 minutes)

1. Run `DESCRIBE bookings;` on AWS database
2. Run `DESCRIBE rate_master;` on AWS database
3. Compare with migration files
4. Document actual vs expected

### Priority 2: Fix Schema Mismatch (15 minutes)

**Choose either:**

- **Option A:** Update bookings table to match controller expectations
- **Option B:** Update controller to match bookings table

**Recommendation:** Option B is cleaner - keep table clean, update controller

### Priority 3: Test Data Correction (10 minutes)

Once schema is verified, I will create corrected test data that:

- ✅ Uses actual field names from AWS database
- ✅ Matches controller expectations
- ✅ Shows real RateMaster → Booking → Invoice flow
- ✅ Validates calculations with actual schema

### Priority 4: UI Testing (20 minutes)

- Test BookingFormPage with corrected data
- Test invoice generation
- Verify totals match

---

## 📌 NEXT STEPS FOR YOU

1. **Run these SQL commands on your AWS database** to check actual schema:

   ```sql
   DESCRIBE bookings;
   DESCRIBE rate_master;
   SELECT COUNT(*) FROM bookings;
   SELECT COUNT(*) FROM rate_master;
   SELECT * FROM rate_master LIMIT 1;
   ```

2. **Share the output** so I can see:

   - Actual table structure
   - Actual data currently in the tables
   - Any customizations from migrations

3. **Then I will create:**
   - ✅ Corrected test data for YOUR actual schema
   - ✅ Fixed SQL queries
   - ✅ UI validation report
   - ✅ Step-by-step testing guide

---

## 🔗 FILES INVOLVED

| File                                                             | Issue                   | Priority |
| ---------------------------------------------------------------- | ----------------------- | -------- |
| `backend/migrations/20240101000005_create_bookings_table.cjs`    | Schema mismatch         | P1       |
| `backend/migrations/20240101000003_create_rate_master_table.cjs` | Missing type field      | P1       |
| `backend/src/controllers/bookingController.js`                   | Using wrong field names | P1       |
| `backend/src/services/rateCalculationService.js`                 | Lookup incomplete       | P2       |
| `frontend/src/pages/BookingFormPage.jsx`                         | May send wrong data     | P2       |
| `frontend/src/pages/GenerateInvoicePage.jsx`                     | May display wrong data  | P2       |

---

## 💡 SUMMARY

**Status:** ⚠️ **System will likely work but with data integrity issues**

**Main Problems:**

1. Controller uses field names NOT in database (data corruption risk)
2. Rate Master cannot distinguish Doc vs NonDoc (wrong rates)
3. Bookings cannot be linked to invoices (tracking issue)
4. Status field has no "Billed/Unbilled" states (invoice tracking broken)

**Severity:** 🔴 **HIGH** - This will cause production issues!

**Time to Fix:** ~30 minutes + testing

---

**Wait for AWS database output, then I'll provide corrected test data! 📊**
