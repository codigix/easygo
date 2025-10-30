# RateMaster → Invoice Generation Workflow - Implementation Complete ✅

## Overview

This document describes the **complete end-to-end workflow** for rate calculation, booking creation, and invoice generation following the documented specification.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RATE CALCULATION WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

1️⃣ RateMaster Setup
   ├─ Company Name / Courier Type
   ├─ Type: Doc / NonDoc
   ├─ Mode: Air / Surface
   ├─ From/To Zone (Pincode)
   ├─ Weight Slab (e.g., 0.5kg, 1kg, 5kg)
   ├─ Rate (Base Price)
   └─ Surcharges (Fuel, GST %)

         ↓ ↓ ↓

2️⃣ Booking Creation
   ├─ Input: Consignment, Customer, Weight, Type, Mode
   ├─ Lookup: RateMaster by (Type, Mode, Weight, Zone)
   ├─ Calculate: lineAmount = rate × quantity
   ├─ Calculate: taxAmount = lineAmount × gst%
   ├─ Calculate: fuelAmount = lineAmount × fuel%
   ├─ Calculate: total = lineAmount + tax + fuel + other
   └─ Store: All amounts in Booking

         ↓ ↓ ↓

3️⃣ Invoice Generation
   ├─ Fetch: Unbilled bookings for customer + period
   ├─ For Each: Create invoice_item from booking amounts
   ├─ Calculate: Invoice Totals
   │  ├─ subTotal = Σ(lineAmount)
   │  ├─ gstTotal = Σ(taxAmount)
   │  ├─ fuelTotal = Σ(fuelAmount)
   │  └─ netAmount = subTotal + gst + fuel + other
   ├─ Mark: Bookings as "Billed"
   └─ Return: Invoice with summary
```

---

## 📋 Files Modified/Created

### New Files

- ✅ `backend/src/services/rateCalculationService.js` - Centralized rate calculation logic
- ✅ `backend/migrations/20240101000024_add_calculated_amounts_to_bookings.cjs` - Database schema

### Modified Files

- ✅ `backend/src/controllers/rateMasterController.js` - Fixed field name reference
- ✅ `backend/src/controllers/bookingController.js` - Added rate calculation
- ✅ `backend/src/controllers/invoiceController.js` - Fixed invoice calculation

---

## 🔧 Implementation Details

### 1. Rate Calculation Service

**File**: `backend/src/services/rateCalculationService.js`

**Key Functions**:

```javascript
// Fetch matching rate from RateMaster
const rate = await fetchRateFromMaster(
  franchiseId,
  fromPincode,
  toPincode,
  serviceType,
  weight
);

// Calculate all amounts in one call
const calculation = await calculateBookingRate(
  franchiseId,
  fromPincode,
  toPincode,
  serviceType,    // "Air", "Surface"
  weight,         // 2.5
  quantity,       // 1
  otherCharges    // 0
);

// Returns:
{
  rate: 500,
  lineAmount: 500,           // rate × quantity
  taxAmount: 90,             // lineAmount × 18%
  fuelAmount: 0,             // lineAmount × fuel%
  netAmount: 590,            // sum of all
  gstPercent: 18,
  fuelPercent: 0
}
```

---

### 2. Booking Creation Flow

**File**: `backend/src/controllers/bookingController.js`

**New Logic**:

1. ✅ Receives booking data with chargeable weight
2. ✅ Queries RateMaster for matching rate
3. ✅ Calculates: lineAmount, tax, fuel
4. ✅ Stores breakdown in booking record
5. ✅ Returns booking with calculated totals

**Booking Fields Stored**:

```
amount          - Line amount from rate × qty
tax_amount      - GST calculated
fuel_amount     - Fuel surcharge calculated
gst_percent     - Percentage used
fuel_percent    - Percentage used
total           - All amounts combined
```

---

### 3. Invoice Generation Flow

**File**: `backend/src/controllers/invoiceController.js`

**generateInvoice()**:

1. ✅ Receives list of booking IDs
2. ✅ Fetches each booking with calculated amounts
3. ✅ Creates invoice_items with proper breakdown
4. ✅ Marks bookings as "Billed"
5. ✅ Inserts invoice with calculated totals

**generateMultipleInvoices()**:

1. ✅ Receives customer IDs and date range
2. ✅ Fetches unbilled bookings only (invoice_id IS NULL)
3. ✅ Calculates totals from stored amounts
4. ✅ Creates invoice for each customer
5. ✅ Marks all bookings as billed

---

## 📊 Data Flow Example

### Scenario: Non-Doc Air Shipment

**Input**:

```json
{
  "consignment_no": "CODIGIIX123",
  "customer_id": "C-001",
  "type": "ND", // Non-Doc
  "mode": "AR", // Air
  "char_wt": 3, // Chargeable weight: 3 kg
  "qty": 1, // Quantity: 1
  "pincode": "400001", // Destination
  "other_charges": 50 // Other surcharges
}
```

**RateMaster Lookup**:

```sql
SELECT * FROM rate_master
WHERE type = 'ND'
  AND mode = 'Air'
  AND weight_from <= 3
  AND weight_to >= 3
→ Found: rate = ₹500/kg, gst = 18%, fuel = 2%
```

**Calculation**:

```
lineAmount = 500 × 1 = ₹500
taxAmount = 500 × 18% = ₹90
fuelAmount = 500 × 2% = ₹10
otherCharges = ₹50
─────────────────────────────
total = 500 + 90 + 10 + 50 = ₹650
```

**Booking Stored**:

```json
{
  "amount": 500,
  "tax_amount": 90,
  "fuel_amount": 10,
  "other_charges": 50,
  "total": 650,
  "gst_percent": 18,
  "fuel_percent": 2
}
```

**Invoice Generation**:

```sql
Multiple bookings aggregated:
Booking 1: ₹650
Booking 2: ₹720
Booking 3: ₹580
─────────────
Invoice Total: ₹1950
(All calculations already done in bookings)
```

---

## ✅ Fixes Applied

### Issue 1: Field Name Mismatch ✅

**Before**: `rate.rate_per_kg` (doesn't exist)
**After**: `rate.rate` (correct field from migration)

### Issue 2: Missing Rate Calculation in Booking ✅

**Before**: Booking just accepted amount input
**After**: Booking calculates from RateMaster with proper tax/fuel

### Issue 3: Invoice Double-Taxing ✅

**Before**: Invoice recalculated GST on total
**After**: Invoice uses pre-calculated amounts from bookings

### Issue 4: No Tracking of Calculations ✅

**Before**: No record of what rates/percentages were used
**After**: All percentages and rates stored with booking

---

## 🚀 Migration & Deployment

### Step 1: Run Database Migration

```bash
# This adds new columns to bookings table
npm run migrate
```

### Step 2: Verify Schema

```bash
# Check new columns were added
SELECT * FROM bookings LIMIT 1;

# Expected new columns:
# - tax_amount
# - fuel_amount
# - gst_percent
# - fuel_percent
# - from_pincode
# - to_pincode
# - rate
# - rate_master_id
```

### Step 3: Test Booking Creation

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consignment_no": "TEST123",
    "customer_id": "C-001",
    "char_wt": 2.5,
    "qty": 1,
    "mode": "AR",
    "pincode": "400001",
    "booking_date": "2024-01-15"
  }'

# Check response includes calculated amounts
```

### Step 4: Test Invoice Generation

```bash
curl -X POST http://localhost:5000/api/invoices/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "C-001",
    "bookings": [1, 2, 3],
    "invoice_date": "2024-01-15"
  }'
```

---

## 📈 Validation Checklist

- [ ] RateMaster rates display correctly
- [ ] Rate calculation shows in booking response
- [ ] Tax/Fuel amounts are calculated correctly
- [ ] Multiple bookings invoice combines amounts without double-taxing
- [ ] Bookings marked as "Billed" after invoice creation
- [ ] Invoice totals match sum of line items
- [ ] Different Doc/NonDoc types use different rates
- [ ] Air vs Surface rates differentiated
- [ ] Weight slabs applied correctly
- [ ] GST percentage applied once (not per item and per invoice)

---

## 🐛 Debugging Tips

### Check Booking Amounts

```sql
SELECT
  id, consignment_number, amount, tax_amount,
  fuel_amount, other_charges, total, status
FROM bookings
WHERE customer_id = 'C-001';
```

### Check Invoice Totals

```sql
SELECT
  invoice_number,
  subtotal_amount,
  gst_amount_new,
  fuel_surcharge_total,
  net_amount
FROM invoices
WHERE customer_id = 'C-001';
```

### Verify Invoice Items Match Bookings

```sql
SELECT
  ii.invoice_id, ii.booking_id, ii.amount,
  b.total as booking_total
FROM invoice_items ii
JOIN bookings b ON ii.booking_id = b.id
WHERE ii.invoice_id = 123;
```

---

## 🔒 Error Handling

### No Rate Found

- Booking still creates with provided amount
- Graceful fallback to default 18% GST
- Warning logged for admin review

### Invalid Weight Slab

- System uses next higher applicable slab
- Returns "No matching rate found" error

### Calculation Mismatch

- Service validates: expectedNet ≈ calculatedNet
- Allows 1 paisa tolerance for rounding
- Throws error if discrepancy > ₹0.01

---

## 📞 Support

For issues or questions:

1. Check rate calculation service logs
2. Verify RateMaster entries for test cases
3. Validate booking amounts before invoice
4. Check migration was applied successfully

---

## 📝 Version History

- **v1.0** - Initial implementation with fixes
  - Fixed field name references
  - Added rate calculation in bookings
  - Fixed invoice totaling logic
  - Added migration for schema
