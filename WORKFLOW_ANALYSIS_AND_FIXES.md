# RateMaster → Invoice Generation Workflow - Analysis & Fixes

## Issues Found

### 1. **rateMasterController.js - Field Name Mismatch** ❌

**Problem**: Line 98 uses `rate.rate_per_kg` but database field is `rate`

```javascript
// ❌ WRONG (line 98)
const totalAmount = rate.rate_per_kg * weight;

// ✅ CORRECT
const totalAmount = rate.rate * weight;
```

---

### 2. **bookingController.js - Missing Rate Calculation** ❌

**Problem**: Booking creation doesn't calculate amounts from RateMaster

```javascript
// ❌ CURRENT (lines 213-217)
const calculatedAmount = amount || 0; // Just accepts input!
const calculatedTotal =
  parseFloat(calculatedAmount) + parseFloat(other_charges);

// ✅ SHOULD DO
// 1. Query RateMaster based on: type (Doc/NonDoc), mode, weight
// 2. Calculate: unitPrice × quantity
// 3. Apply: taxes, fuel surcharge, other charges
```

---

### 3. **invoiceController.js - Improper Amount Calculation** ❌

**Problem**: Invoice generation doesn't recalculate from RateMaster (lines 310-313)

```javascript
// ❌ CURRENT - Just copies booking total
INSERT INTO invoice_items (..., unit_price, amount)
SELECT ?, id, ..., 1, total, total
FROM bookings WHERE id = ?

// ✅ SHOULD DO
// 1. Fetch rate from RateMaster for each booking
// 2. Calculate: (rate × quantity) + tax + fuel + other
// 3. Store calculated amounts in invoice_items
```

---

### 4. **Missing Tax & Charge Calculations** ❌

**Problem**: No proper application of:

- GST Percentage (from RateMaster: 18% default)
- Fuel Surcharge (from RateMaster)
- Handling/Other Charges
- Royalty & Docket Charges

---

## Workflow Implementation Map

```
STEP 1: Create Booking
├─ Input: consignment_no, customer_id, weight, type (Doc/NonDoc), mode
├─ Query RateMaster for: rate based on type/mode/weight
├─ Calculate:
│  ├─ lineAmount = rate × quantity
│  ├─ taxAmount = lineAmount × gst_percentage
│  ├─ fuelCharge = lineAmount × fuel_surcharge_percent
│  ├─ total = lineAmount + taxAmount + fuelCharge + other_charges
│  └─ Store in bookings table
└─ Output: booking_id, calculated total

STEP 2: Generate Invoice
├─ Query all unbilled bookings for customer in date range
├─ For each booking:
│  ├─ Fetch its calculated amounts
│  ├─ OR recalculate from RateMaster
│  └─ Create invoice_item with details
├─ Calculate Invoice Totals:
│  ├─ subTotal = Σ(lineAmount)
│  ├─ gstTotal = Σ(taxAmount)
│  ├─ fuelTotal = Σ(fuelCharge)
│  ├─ netAmount = subTotal + gstTotal + fuelTotal + other_charges
│  └─ balanceAmount = netAmount (initially unpaid)
└─ Update bookings: mark as billed
```

---

## Database Enhancements Needed

### bookings table - Missing Columns

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `from_pincode` VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `to_pincode` VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `rate` DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `gst_percent` DECIMAL(5, 2) DEFAULT 18;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `fuel_percent` DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `fuel_amount` DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `tax_amount` DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS `surcharge_amount` DECIMAL(10, 2);
```

---

## Files to Fix (Priority Order)

1. **rateMasterController.js** - Fix field reference
2. **bookingController.js** - Add rate calculation logic
3. **invoiceController.js** - Fix invoice item calculation
4. **Create new utility file** - rateCalculationService.js (shared logic)

---

## Testing Checklist

- [ ] RateMaster rates are correctly stored
- [ ] Booking calculates amount using RateMaster
- [ ] Tax/Fuel/Other charges applied correctly
- [ ] Invoice sums are accurate
- [ ] Multiple bookings invoice combines correctly
- [ ] Doc vs NonDoc rates differentiated
