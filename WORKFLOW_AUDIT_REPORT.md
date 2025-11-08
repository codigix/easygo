# Workflow Audit Report - Company Master → RateMaster → Booking → Invoice

**Date:** Generated from code analysis  
**Status:** ⚠️ ISSUES FOUND - Requires Fixes

---

## Executive Summary

Your workflow architecture is **mostly correct** but has **3 critical issues** and **4 recommendations** that need to be addressed for proper charge calculations.

---

## ✅ WORKFLOW STRUCTURE - CORRECT IMPLEMENTATION

### 1. Company Master (company_rate_master table)

**Status:** ✅ CORRECT

**Fields Present:**

- ✅ companyId (company_id)
- ✅ companyName (company_name)
- ✅ Address (company_address)
- ✅ GST No (gst_no)
- ✅ Insurance % (insurance_percent)
- ✅ Minimum risk surcharge (minimum_risk_surcharge)
- ✅ Topay charge (topay_charge)
- ✅ COD charge (cod_charge)
- ✅ Fuel surcharge % (fuel_surcharge_percent)
- ✅ GEC Fuel surcharge % (gec_fuel_surcharge_percent) - Extra field
- ✅ Royalty % (royalty_charges_percent)
- ✅ Due days (due_days)
- ✅ Status (status)

**File:** `backend/src/controllers/companyRateMasterController.js`

---

### 2. RateMaster (rate_master table)

**Status:** ✅ CORRECT

**Fields Present:**

- ✅ franchise_id (linked to franchises)
- ✅ from_pincode & to_pincode (route-based)
- ✅ service_type (Air/Surface/Express - modes)
- ✅ weight_from, weight_to (weight ranges)
- ✅ rate (base charge rate)
- ✅ fuel_surcharge (fuel surcharge %)
- ✅ gst_percentage (GST % - defaults to 18%)
- ✅ status (active/inactive)

**File:** `backend/src/controllers/rateMasterController.js`

---

## ⚠️ CRITICAL ISSUES FOUND

### **ISSUE #1: Company ID Not Used in Booking Rate Calculation**

**Severity:** 🔴 HIGH - Charges may be wrong

**Location:** `backend/src/controllers/bookingController.js` lines 224-244

**Problem:**

```javascript
// Current Code (WRONG)
rateCalculation = await calculateBookingRate(
  franchiseId,
  null, // ❌ from_pincode is NULL!
  pincode, // to_pincode only
  mode,
  parseFloat(char_wt),
  parseInt(qty),
  parseFloat(other_charges || 0)
);
```

The booking creation **doesn't pass from_pincode** and **doesn't use customer_id/company_id** to fetch company-specific defaults.

**Expected Flow:**

1. Should fetch the customer's company master record
2. Should use company's fuel_surcharge_percent as fallback
3. Should apply company's royalty_charges_percent
4. Should use company's due_days for invoice

**Fix Required:**

```javascript
// Step 1: Fetch company master for defaults
const company = await fetchCompanyMaster(franchiseId, customer_id);

// Step 2: Use company defaults if rate not found
if (!rateCalculation) {
  rateCalculation = {
    rate: parseFloat(amount || 0),
    gstPercent: 18, // Use company's or default
    fuelPercent: company?.fuel_surcharge_percent || 0,
    lineAmount: parseFloat(amount || 0),
    taxAmount: (amount * 18) / 100,
    fuelAmount: (amount * (company?.fuel_surcharge_percent || 0)) / 100,
    netAmount: /* total */
  };
}
```

---

### **ISSUE #2: GST Calculation Logic Issue in Invoice Generation**

**Severity:** 🔴 HIGH - Over-charging customers

**Location:** `backend/src/controllers/invoiceController.js` line 267

**Problem:**

```javascript
// Current Code (WRONG)
const gstAmount = (parseFloat(net_amount) * parseFloat(gst_percent)) / 100;
```

**Why It's Wrong:**

- GST should be calculated on each **booking line item**, then summed
- Currently calculating on **net_amount** (which already includes tax)
- This causes **double taxation**!

**Correct Flow:**

```javascript
// Bookings already have tax_amount calculated (line 207 in rateCalculationService)
// Sum them, don't recalculate on net_amount

const gstAmount = parseFloat(taxTotal); // Already calculated per booking
```

**Evidence:**

- Line 436 correctly sums `tax_amount` from bookings
- Then line 267 recalculates GST on `net_amount` ❌

---

### **ISSUE #3: Royalty & Fuel Surcharge Application Inconsistent**

**Severity:** 🟡 MEDIUM - Logic unclear

**Location:** Multiple files

**Problem:**

1. **Invoice generation** accepts `royalty_charge` & `fuel_surcharge_tax_percent` parameters
2. But **booking creation** doesn't fetch these from company master
3. When invoice is generated, should it re-apply company's royalty % or use passed value?

**Example:**

- Company master says: royalty_charges_percent = 5%
- Booking is created with royalty already in other_charges
- Invoice generation receives `royalty_charge` parameter
- **Which one should apply?** ❌

---

## 🔧 RECOMMENDED FIXES

### **Fix #1: Add Company Master Lookup in Booking Creation**

**File:** `backend/src/controllers/bookingController.js`

```javascript
// Add after line 199 (before rate calculation)
export const getCompanyDefaults = async (franchiseId, customerId) => {
  const db = getDb();
  const [[company]] = await db.query(
    "SELECT fuel_surcharge_percent, royalty_charges_percent, " +
      "topay_charge, cod_charge, insurance_percent FROM company_rate_master " +
      "WHERE franchise_id = ? AND company_id = ?",
    [franchiseId, customerId]
  );
  return (
    company || {
      fuel_surcharge_percent: 0,
      royalty_charges_percent: 0,
      topay_charge: 0,
      cod_charge: 0,
      insurance_percent: 0,
    }
  );
};

// Then in createBooking:
const companyDefaults = await getCompanyDefaults(franchiseId, customer_id);
```

---

### **Fix #2: Fix GST Calculation in Invoice Generation**

**File:** `backend/src/controllers/invoiceController.js` line 267

**BEFORE:**

```javascript
const gstAmount = (parseFloat(net_amount) * parseFloat(gst_percent)) / 100;
```

**AFTER:**

```javascript
// GST already calculated per booking, just sum them
const gstAmount = parseFloat(taxTotal.toFixed(2));

// Don't recalculate on net_amount - that's double taxation!
// If you need to apply additional GST on royalty/other charges, do it separately:
const additionalGst =
  ((royalty_charge || 0) + (other_charge || 0)) * (gst_percent / 100);
const totalGst = gstAmount + additionalGst;
```

---

### **Fix #3: Clarify Royalty & Surcharge Application**

**Create a policy document specifying:**

```
1. ROYALTY APPLICATION:
   - Applied per booking during booking creation? OR
   - Applied during invoice generation as company-level deduction? OR
   - Both (per booking + invoice level)?

2. FUEL SURCHARGE:
   - Sourced from RateMaster during booking creation ✅
   - OR override with company_rate_master.fuel_surcharge_percent?
   - OR invoice-level fuel surcharge adjustment?

3. OTHER CHARGES (topay_charge, cod_charge):
   - Added to booking.other_charges during booking creation? OR
   - Added at invoice generation time? OR
   - Only if order contains those flags?

RECOMMENDATION:
  ✅ Do ALL calculations at BOOKING CREATION time
  ✅ Store results in booking table
  ✅ Invoice just sums pre-calculated amounts
```

---

### **Fix #4: Add Validation Service**

**Create:** `backend/src/services/bookingValidationService.js`

```javascript
export const validateBookingCalculations = (booking) => {
  const expected = {
    total:
      booking.amount +
      booking.tax_amount +
      booking.fuel_amount +
      booking.other_charges,
  };

  const actual = parseFloat(booking.total);
  const difference = Math.abs(expected.total - actual);

  if (difference > 0.01) {
    throw new Error(
      `Booking calculation mismatch. ` +
        `Expected: ${expected.total}, Got: ${actual}`
    );
  }
  return true;
};
```

---

## 📊 DATA FLOW VERIFICATION

### Current Correct Flow:

```
1. COMPANY MASTER SETUP ✅
   companyId → (stored in bookings.customer_id)

2. RATE MASTER SETUP ✅
   from_pincode, to_pincode, weight_range → rate + gst% + fuel%

3. BOOKING CREATION ⚠️ NEEDS FIX
   booking.customer_id + booking.pincode → RateMaster lookup
   Result: amount, tax_amount, fuel_amount, other_charges, total

4. INVOICE GENERATION ⚠️ NEEDS FIX
   Multiple bookings → SUM (amount, tax_amount, fuel_amount, other_charges)

5. CALCULATIONS VERIFICATION ❌ NOT IMPLEMENTED
   No validation that booking.total = amount + tax + fuel + other
```

---

## 📋 VERIFICATION CHECKLIST

- [ ] Booking creation uses customer_id to fetch company defaults
- [ ] Booking calculation: `total = amount + tax + fuel + other`
- [ ] Tax calculated: `tax = amount × gst_percent / 100`
- [ ] Fuel calculated: `fuel = amount × fuel_percent / 100`
- [ ] Invoice GST = SUM(booking.tax_amount), NOT recalculated on net_amount
- [ ] Royalty application policy is documented
- [ ] Validation service runs before saving booking
- [ ] Invoice due_date = invoice_date + company.due_days

---

## 🎯 NEXT STEPS

1. **Immediate (Critical):**

   - ✅ Fix GST calculation in invoice generation (Issue #2)
   - ✅ Add company lookup in booking creation (Issue #1)

2. **Short-term (Important):**

   - Create validation service
   - Document royalty/surcharge policy
   - Add unit tests

3. **Long-term (Enhancement):**
   - Create audit trail for all calculations
   - Add calculation breakdown UI for customer visibility
   - Implement discount/adjustment system

---

## 📝 SUMMARY

| Component           | Status | Issue Count | Fix Complexity |
| ------------------- | ------ | ----------- | -------------- |
| Company Master      | ✅     | 0           | -              |
| RateMaster          | ✅     | 0           | -              |
| Booking Creation    | ⚠️     | 1 major     | Medium         |
| Booking Calculation | ⚠️     | 1 major     | High           |
| Invoice Generation  | ❌     | 2 major     | High           |
| Validation          | ❌     | 1 major     | Medium         |

**Overall Risk:** 🔴 **HIGH** - GST double-charging and missing company defaults
