# Workflow Fixes - Step-by-Step Implementation Guide

## Overview

This guide provides exact code changes needed to fix the 3 critical issues identified in the workflow audit.

---

## FIX #1: Add Company Master Lookup in Booking Creation

### Problem

Booking creation doesn't use company_id/customer_id to fetch company-specific defaults for fuel surcharge, royalty, and other charges.

### Solution

Add a helper function to fetch company defaults and use them in booking creation.

---

### Step 1: Create Helper Service

**File:** `backend/src/services/companyService.js` (NEW FILE)

```javascript
import { getDb } from "../config/database.js";

/**
 * Fetch company master details by franchise_id and customer_id
 * Used to get default charges, surcharges, and other company-specific settings
 */
export const getCompanyDefaults = async (franchiseId, customerId) => {
  try {
    const db = getDb();

    const [[company]] = await db.query(
      `SELECT 
        id,
        company_id,
        company_name,
        fuel_surcharge_percent,
        gec_fuel_surcharge_percent,
        royalty_charges_percent,
        topay_charge,
        cod_charge,
        insurance_percent,
        minimum_risk_surcharge,
        due_days,
        gst_no
       FROM company_rate_master 
       WHERE franchise_id = ? AND company_id = ?
       AND status = 'active'`,
      [franchiseId, customerId]
    );

    // Return company defaults or fallback values
    if (company) {
      return {
        found: true,
        company_id: company.company_id,
        company_name: company.company_name,
        fuel_surcharge_percent: parseFloat(company.fuel_surcharge_percent || 0),
        gec_fuel_surcharge_percent: parseFloat(
          company.gec_fuel_surcharge_percent || 0
        ),
        royalty_charges_percent: parseFloat(
          company.royalty_charges_percent || 0
        ),
        topay_charge: parseFloat(company.topay_charge || 0),
        cod_charge: parseFloat(company.cod_charge || 0),
        insurance_percent: parseFloat(company.insurance_percent || 0),
        minimum_risk_surcharge: parseFloat(company.minimum_risk_surcharge || 0),
        due_days: parseInt(company.due_days || 0),
        gst_no: company.gst_no,
      };
    }

    // Return defaults if company not found
    return {
      found: false,
      fuel_surcharge_percent: 0,
      gec_fuel_surcharge_percent: 0,
      royalty_charges_percent: 0,
      topay_charge: 0,
      cod_charge: 0,
      insurance_percent: 0,
      minimum_risk_surcharge: 0,
      due_days: 0,
      gst_no: null,
    };
  } catch (error) {
    console.error("Error fetching company defaults:", error);
    throw error;
  }
};

/**
 * Calculate company-specific charges for a booking
 */
export const calculateCompanyCharges = (
  amount,
  company,
  bookingType = "normal"
) => {
  const charges = {
    royalty: 0,
    insurance: 0,
    topay: 0,
    cod: 0,
    risk_surcharge: 0,
  };

  if (!company || !company.found) {
    return charges;
  }

  // Royalty charge: royalty% of base amount
  if (company.royalty_charges_percent > 0) {
    charges.royalty = (amount * company.royalty_charges_percent) / 100;
  }

  // Insurance charge: insurance% of base amount
  if (company.insurance_percent > 0) {
    charges.insurance = (amount * company.insurance_percent) / 100;
  }

  // COD and To-Pay are flat charges (apply if applicable)
  // Note: These should be determined by booking flags
  charges.topay = company.topay_charge || 0;
  charges.cod = company.cod_charge || 0;

  // Risk surcharge (minimum surcharge)
  if (company.minimum_risk_surcharge > 0) {
    // Apply if amount is below minimum
    if (amount < company.minimum_risk_surcharge) {
      charges.risk_surcharge = company.minimum_risk_surcharge - amount;
    }
  }

  return charges;
};
```

---

### Step 2: Update Booking Controller

**File:** `backend/src/controllers/bookingController.js`

**Location:** Line 1 (add import at top)

```javascript
// Add this import
import {
  getCompanyDefaults,
  calculateCompanyCharges,
} from "../services/companyService.js";
```

**Location:** Lines 213-249 (replace the rate calculation section)

**BEFORE:**

```javascript
    // Step 1: Calculate rate from RateMaster
    // Required: from_pincode, to_pincode, service_type (mode), weight, quantity
    let rateCalculation = null;
    let calculatedAmount = parseFloat(amount || 0);
    let calculatedTax = 0;
    let calculatedFuel = 0;
    let gstPercent = 18;
    let fuelPercent = 0;

    // If amount is not provided, calculate from RateMaster
    if (!amount || parseFloat(amount) === 0) {
      // Try to calculate using rate master if we have required fields
      if (char_wt) {
        try {
          rateCalculation = await calculateBookingRate(
            franchiseId,
            null, // from_pincode - may need to fetch from customer or use franchise default
            pincode, // to_pincode
            mode === "AR" ? "Air" : mode === "SR" ? "Surface" : mode, // service_type
            parseFloat(char_wt),
            parseInt(qty),
            parseFloat(other_charges || 0)
          );
```

**AFTER:**

```javascript
    // Step 1: Fetch company defaults
    const company = await getCompanyDefaults(franchiseId, customer_id);

    // Step 2: Calculate rate from RateMaster
    // Required: from_pincode, to_pincode, service_type (mode), weight, quantity
    let rateCalculation = null;
    let calculatedAmount = parseFloat(amount || 0);
    let calculatedTax = 0;
    let calculatedFuel = 0;
    let gstPercent = 18;
    let fuelPercent = company.fuel_surcharge_percent || 0; // Use company default

    // If amount is not provided, calculate from RateMaster
    if (!amount || parseFloat(amount) === 0) {
      // Try to calculate using rate master if we have required fields
      if (char_wt) {
        try {
          rateCalculation = await calculateBookingRate(
            franchiseId,
            null, // from_pincode - may need to fetch from customer or use franchise default
            pincode, // to_pincode
            mode === "AR" ? "Air" : mode === "SR" ? "Surface" : mode, // service_type
            parseFloat(char_wt),
            parseInt(qty),
            parseFloat(other_charges || 0)
          );

          // Use company defaults if rateCalculation found values
          if (rateCalculation) {
            // Prefer RateMaster fuel% over company default
            fuelPercent = rateCalculation.fuelPercent;
            gstPercent = rateCalculation.gstPercent || 18;
          }
```

**Location:** Lines 250-295 (add company charges calculation)

**ADD THIS after the rate calculation:**

```javascript
        } catch (error) {
          console.warn("Rate calculation skipped:", error.message);
          // Fall back to using provided amount if calculation fails
          calculatedAmount = parseFloat(amount || 0);
        }
      }
    } else {
      // If amount is provided, apply default tax calculations
      calculatedTax = (parseFloat(calculatedAmount) * gstPercent) / 100;
      calculatedFuel = (parseFloat(calculatedAmount) * fuelPercent) / 100;
    }

    // ✅ NEW: Calculate company-specific charges
    const companyCharges = calculateCompanyCharges(
      parseFloat(calculatedAmount),
      company,
      type
    );

    // ✅ NEW: Include company charges in total other_charges
    const totalOtherCharges =
      parseFloat(other_charges || 0) +
      (companyCharges.royalty || 0) +
      (companyCharges.insurance || 0) +
      (companyCharges.risk_surcharge || 0);

    // Note: topay_charge and cod_charge are applied conditionally based on booking flags
    // Add them only if applicable

    const calculatedOtherCharges = totalOtherCharges;
    const calculatedTotal =
      parseFloat(calculatedAmount) +
      parseFloat(calculatedTax) +
      parseFloat(calculatedFuel) +
      parseFloat(calculatedOtherCharges);

    const bookingData = {
      franchise_id: franchiseId,
      consignment_number: consignment_no,
      customer_id,
      receiver: receiver || null,
      address: address || null,
      booking_date,
      pincode,
      consignment_type: consignment_type || "Domestic",
      mode: mode || "AR",
      act_wt: act_wt || null,
      char_wt,
      qty,
      type: type || "D",
      amount: parseFloat(calculatedAmount.toFixed(2)),
      tax_amount: parseFloat(calculatedTax.toFixed(2)), // Calculated GST
      fuel_amount: parseFloat(calculatedFuel.toFixed(2)), // Calculated Fuel Surcharge
      other_charges: parseFloat(calculatedOtherCharges.toFixed(2)), // ✅ UPDATED
      reference: reference || null,
      dtdc_amt: dtdc_amt || 0,
      insurance: parseFloat(companyCharges.insurance.toFixed(2)), // ✅ NEW
      percentage: 0,
      risk_surcharge: parseFloat(companyCharges.risk_surcharge.toFixed(2)), // ✅ NEW
      bill_amount: 0,
      total: parseFloat(calculatedTotal.toFixed(2)),
      destination: null,
      status: "Booked",
      remarks: null,
      gst_percent: gstPercent,
      fuel_percent: fuelPercent,
    };
```

---

## FIX #2: Correct GST Calculation in Invoice Generation

### Problem

GST is being recalculated on net_amount, causing double taxation.

### Solution

Use GST amounts already calculated and stored in individual bookings.

---

### File: `backend/src/controllers/invoiceController.js`

**Location:** Lines 264-302 (Fix the GST calculation)

**BEFORE:**

```javascript
// Calculate fuel surcharge
const fuelSurchargeTotal =
  (parseFloat(subtotal) * parseFloat(fuel_surcharge_tax_percent)) / 100;
const gstAmount = (parseFloat(net_amount) * parseFloat(gst_percent)) / 100; // ❌ WRONG

// Calculate balance amount (initially equal to total amount)
const balanceAmount = total || 0;

// Insert invoice
const [result] = await connection.query(
  `INSERT INTO invoices 
       (franchise_id, invoice_number, invoice_date, customer_id, address, period_from, period_to,
        invoice_discount, reverse_charge, fuel_surcharge_percent, fuel_surcharge_total,
        gst_percent, gst_amount_new, other_charge, royalty_charge, docket_charge,
        total_amount, subtotal_amount, net_amount, paid_amount, balance_amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
  [
    franchiseId,
    invoiceNumber,
    invoice_date || dayjs().format("YYYY-MM-DD"),
    customer_id,
    address,
    period_from || null,
    period_to || null,
    invoice_discount ? 1 : 0,
    reverse_charge ? 1 : 0,
    fuel_surcharge_tax_percent || 0,
    fuelSurchargeTotal || 0,
    gst_percent || 18,
    gstAmount || 0, // ❌ WRONG - recalculated on net_amount
    other_charge || 0,
    royalty_charge || 0,
    docket_charge || 0,
    total || 0,
    subtotal || 0,
    net_amount || 0,
    0, // paid_amount starts at 0
    balanceAmount, // balance_amount equals total initially
  ]
);
```

**AFTER:**

```javascript
// ✅ FIXED: GST is already calculated per booking
// Don't recalculate on net_amount - that causes double taxation!
// Just use the sum of tax_amount from bookings
const gstAmount = parseFloat(taxTotal); // Already calculated per booking

// Additional GST on other charges (if applicable)
let additionalGstOnCharges = 0;
if (
  reverse_charge === false &&
  (other_charge || royalty_charge || docket_charge)
) {
  // Only if reverse charge is NOT applicable
  const chargesTotal =
    (other_charge || 0) + (royalty_charge || 0) + (docket_charge || 0);
  additionalGstOnCharges = (chargesTotal * (gst_percent || 18)) / 100;
}

const totalGstAmount = gstAmount + additionalGstOnCharges;

// Calculate balance amount (initially equal to total amount)
const balanceAmount = total || 0;

// Insert invoice
const [result] = await connection.query(
  `INSERT INTO invoices 
       (franchise_id, invoice_number, invoice_date, customer_id, address, period_from, period_to,
        invoice_discount, reverse_charge, fuel_surcharge_percent, fuel_surcharge_total,
        gst_percent, gst_amount_new, other_charge, royalty_charge, docket_charge,
        total_amount, subtotal_amount, net_amount, paid_amount, balance_amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
  [
    franchiseId,
    invoiceNumber,
    invoice_date || dayjs().format("YYYY-MM-DD"),
    customer_id,
    address,
    period_from || null,
    period_to || null,
    invoice_discount ? 1 : 0,
    reverse_charge ? 1 : 0,
    fuel_surcharge_tax_percent || 0,
    fuelSurchargeTotal || 0,
    gst_percent || 18,
    totalGstAmount || 0, // ✅ FIXED - using sum from bookings, not recalculated
    other_charge || 0,
    royalty_charge || 0,
    docket_charge || 0,
    total || 0,
    subtotal || 0,
    net_amount || 0,
    0, // paid_amount starts at 0
    balanceAmount, // balance_amount equals total initially
  ]
);
```

---

### Same Fix for Multiple Invoices Function

**Location:** Lines 427-472 (in generateMultipleInvoices function)

This function correctly sums taxTotal from bookings. No changes needed here - it's already correct!

```javascript
// ✅ THIS IS CORRECT - just verify it stays this way
bookings.forEach((b) => {
  subtotal += parseFloat(b.amount || 0);
  taxTotal += parseFloat(b.tax_amount || 0); // ✅ Sum tax from bookings
  fuelTotal += parseFloat(b.fuel_amount || 0);
  otherTotal += parseFloat(b.other_charges || 0);
});
```

---

## FIX #3: Add Calculation Validation Service

### Solution

Create a service to validate that booking calculations are correct before saving.

---

### File: `backend/src/services/calculationValidationService.js` (NEW FILE)

```javascript
/**
 * Calculation Validation Service
 * Ensures all rate and amount calculations are mathematically correct
 */

/**
 * Validate booking calculation
 * Verifies: total = amount + tax + fuel + other
 */
export const validateBookingCalculation = (booking) => {
  const { amount, tax_amount, fuel_amount, other_charges, total } = booking;

  const expectedTotal =
    parseFloat(amount || 0) +
    parseFloat(tax_amount || 0) +
    parseFloat(fuel_amount || 0) +
    parseFloat(other_charges || 0);

  const actualTotal = parseFloat(total);
  const difference = Math.abs(expectedTotal - actualTotal);

  // Allow 1 paisa (0.01) difference for rounding
  if (difference > 0.01) {
    return {
      valid: false,
      error:
        `Booking calculation mismatch. ` +
        `Expected: ₹${expectedTotal.toFixed(2)}, Got: ₹${actualTotal.toFixed(
          2
        )}, ` +
        `Difference: ₹${difference.toFixed(2)}`,
      details: {
        expected: expectedTotal,
        actual: actualTotal,
        difference: difference,
        breakdown: {
          amount: parseFloat(amount || 0),
          tax: parseFloat(tax_amount || 0),
          fuel: parseFloat(fuel_amount || 0),
          other: parseFloat(other_charges || 0),
        },
      },
    };
  }

  return {
    valid: true,
    error: null,
    details: {
      amount: parseFloat(amount || 0),
      tax: parseFloat(tax_amount || 0),
      fuel: parseFloat(fuel_amount || 0),
      other: parseFloat(other_charges || 0),
      total: actualTotal,
    },
  };
};

/**
 * Validate GST percentage
 */
export const validateGstPercentage = (gstPercent) => {
  const percent = parseFloat(gstPercent);

  // Valid GST rates in India: 0%, 5%, 12%, 18%, 28%
  const validRates = [0, 5, 12, 18, 28];

  if (!validRates.includes(percent)) {
    return {
      valid: false,
      error: `Invalid GST rate: ${percent}%. Valid rates are: ${validRates.join(
        ", "
      )}%`,
    };
  }

  return {
    valid: true,
    error: null,
  };
};

/**
 * Validate rate calculation result from RateMaster
 */
export const validateRateCalculation = (calculation) => {
  const required = [
    "rate",
    "lineAmount",
    "taxAmount",
    "fuelAmount",
    "netAmount",
  ];

  const missing = required.filter((field) => calculation[field] === undefined);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  // Verify net amount calculation
  const expectedNet =
    parseFloat(calculation.lineAmount) +
    parseFloat(calculation.taxAmount) +
    parseFloat(calculation.fuelAmount);

  const actualNet = parseFloat(calculation.netAmount);
  const difference = Math.abs(expectedNet - actualNet);

  if (difference > 0.01) {
    return {
      valid: false,
      error:
        `Rate calculation verification failed. ` +
        `Expected: ${expectedNet.toFixed(2)}, Got: ${actualNet.toFixed(2)}`,
    };
  }

  return {
    valid: true,
    error: null,
  };
};

/**
 * Validate invoice calculation
 * Verifies: net_amount = subtotal + gst + fuel + other
 */
export const validateInvoiceCalculation = (invoice) => {
  const {
    subtotal_amount,
    gst_amount_new,
    fuel_surcharge_total,
    other_charge,
    net_amount,
  } = invoice;

  const expectedNet =
    parseFloat(subtotal_amount || 0) +
    parseFloat(gst_amount_new || 0) +
    parseFloat(fuel_surcharge_total || 0) +
    parseFloat(other_charge || 0);

  const actualNet = parseFloat(net_amount);
  const difference = Math.abs(expectedNet - actualNet);

  if (difference > 0.01) {
    return {
      valid: false,
      error:
        `Invoice calculation mismatch. ` +
        `Expected: ₹${expectedNet.toFixed(2)}, Got: ₹${actualNet.toFixed(2)}`,
      details: {
        expected: expectedNet,
        actual: actualNet,
        breakdown: {
          subtotal: parseFloat(subtotal_amount || 0),
          gst: parseFloat(gst_amount_new || 0),
          fuel_surcharge: parseFloat(fuel_surcharge_total || 0),
          other: parseFloat(other_charge || 0),
        },
      },
    };
  }

  return {
    valid: true,
    error: null,
    details: {
      subtotal: parseFloat(subtotal_amount || 0),
      gst: parseFloat(gst_amount_new || 0),
      fuel: parseFloat(fuel_surcharge_total || 0),
      other: parseFloat(other_charge || 0),
      total: actualNet,
    },
  };
};
```

---

### Use Validation in Booking Controller

**File:** `backend/src/controllers/bookingController.js`

**Location:** Add import at top

```javascript
import {
  validateBookingCalculation,
  validateGstPercentage,
} from "../services/calculationValidationService.js";
```

**Location:** After building bookingData (line 294), before INSERT

```javascript
// ✅ NEW: Validate calculations
const validationResult = validateBookingCalculation({
  amount: bookingData.amount,
  tax_amount: bookingData.tax_amount,
  fuel_amount: bookingData.fuel_amount,
  other_charges: bookingData.other_charges,
  total: bookingData.total,
});

if (!validationResult.valid) {
  return res.status(400).json({
    success: false,
    message: "Booking calculation error: " + validationResult.error,
    details: validationResult.details,
  });
}

const gstValidation = validateGstPercentage(bookingData.gst_percent);
if (!gstValidation.valid) {
  return res.status(400).json({
    success: false,
    message: gstValidation.error,
  });
}

const [result] = await db.query("INSERT INTO bookings SET ?", [bookingData]);
```

---

## Testing the Fixes

### Test Case 1: Booking with Company Defaults

```javascript
// Input:
POST /api/bookings
{
  "customer_id": "ACME001",          // Company with fuel_surcharge = 5%
  "consignment_no": "TEST001",
  "booking_date": "2024-01-15",
  "pincode": "110001",
  "char_wt": 10,
  "qty": 2,
  "amount": 1000,
  "mode": "AR"
}

// Expected Output:
{
  "amount": 1000.00,
  "tax_amount": 180.00,        // 1000 * 18% GST
  "fuel_amount": 50.00,         // 1000 * 5% fuel (from company)
  "other_charges": 0.00,
  "total": 1230.00,             // 1000 + 180 + 50
  "gst_percent": 18,
  "fuel_percent": 5
}
```

### Test Case 2: Invoice Calculation

```javascript
// Input: 2 bookings, each with:
//   amount: 1000, tax: 180, fuel: 50, other: 0, total: 1230

// Expected Invoice:
{
  "subtotal_amount": 2000.00,     // SUM of amount
  "gst_amount_new": 360.00,       // SUM of tax_amount (NOT recalculated)
  "fuel_surcharge_total": 100.00, // SUM of fuel_amount
  "other_charge": 0.00,
  "net_amount": 2460.00           // 2000 + 360 + 100
}
```

### Test Case 3: Validation Catch Error

```javascript
// Input: Booking with wrong total
{
  "amount": 1000,
  "tax_amount": 180,
  "fuel_amount": 50,
  "other_charges": 0,
  "total": 1500  // ❌ Should be 1230
}

// Expected Error:
{
  "success": false,
  "message": "Booking calculation error: Booking calculation mismatch. " +
             "Expected: ₹1230.00, Got: ₹1500.00, Difference: ₹270.00",
  "details": { /* breakdown */ }
}
```

---

## Implementation Checklist

- [ ] Create `backend/src/services/companyService.js`
- [ ] Create `backend/src/services/calculationValidationService.js`
- [ ] Update `backend/src/controllers/bookingController.js`:
  - [ ] Add import for companyService
  - [ ] Add import for calculationValidationService
  - [ ] Add company lookup (getCompanyDefaults)
  - [ ] Update rate calculation to use company defaults
  - [ ] Update booking data to include company charges
  - [ ] Add validation before INSERT
- [ ] Update `backend/src/controllers/invoiceController.js`:
  - [ ] Fix GST calculation in generateInvoice
  - [ ] Verify generateMultipleInvoices (already correct)
- [ ] Test all three scenarios above
- [ ] Run existing tests to ensure no regressions
- [ ] Deploy to staging environment
- [ ] Verify with sample invoices

---

## Files Modified Summary

| File                                                   | Type     | Changes                         |
| ------------------------------------------------------ | -------- | ------------------------------- |
| `backend/src/services/companyService.js`               | NEW      | Company defaults lookup         |
| `backend/src/services/calculationValidationService.js` | NEW      | Calculation validation          |
| `backend/src/controllers/bookingController.js`         | MODIFIED | Add company lookup, fix charges |
| `backend/src/controllers/invoiceController.js`         | MODIFIED | Fix GST double-calculation      |
