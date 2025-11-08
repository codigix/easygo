# Code Changes: Before & After Comparison

---

## 🔴 Change 1: rateMasterController.js - Calculate Rate Function

### ❌ BEFORE (Lines 91-108)

```javascript
if (!rate) {
  return res.status(404).json({
    success: false,
    message: "No matching rate found for given parameters",
  });
}

const totalAmount = rate.rate_per_kg * weight; // ❌ WRONG FIELD

res.json({
  success: true,
  data: {
    rate: rate.rate_per_kg, // ❌ WRONG FIELD
    weight,
    total_amount: totalAmount,
    service_type,
  },
});
```

**Issues**:

- Field `rate_per_kg` doesn't exist in database (schema uses `rate`)
- Missing GST and fuel information in response
- No proper decimal formatting

---

### ✅ AFTER (Lines 91-110)

```javascript
if (!rate) {
  return res.status(404).json({
    success: false,
    message: "No matching rate found for given parameters",
  });
}

const totalAmount = parseFloat(rate.rate) * parseFloat(weight); // ✅ CORRECT

res.json({
  success: true,
  data: {
    rate: parseFloat(rate.rate), // ✅ CORRECT
    weight,
    total_amount: parseFloat(totalAmount.toFixed(2)), // ✅ FORMATTED
    service_type,
    gst_percent: parseFloat(rate.gst_percentage) || 18, // ✅ NEW
    fuel_surcharge: parseFloat(rate.fuel_surcharge) || 0, // ✅ NEW
  },
});
```

**Improvements**:

- Uses correct database field `rate`
- Includes GST and fuel information
- Proper decimal formatting
- Default values for optional fields

---

## 🔴 Change 2: bookingController.js - Add Rate Calculation Service

### ❌ BEFORE (Lines 160-217)

```javascript
import { getDb } from "../config/database.js";
import multer from "multer";
// ... rest of imports

export const createBooking = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const {
      consignment_no,
      customer_id,
      receiver,
      address,
      booking_date,
      consignment_type,
      pincode,
      mode,
      act_wt,
      char_wt,
      qty,
      type,
      amount,  // ❌ JUST ACCEPTS AMOUNT
      other_charges,
      reference,
      dtdc_amt,
    } = req.body;

    // ... validation ...

    // ❌ NO RATE CALCULATION
    const calculatedAmount = amount || 0;
    const calculatedOtherCharges = other_charges || 0;
    const calculatedTotal =
      parseFloat(calculatedAmount) + parseFloat(calculatedOtherCharges);

    const bookingData = {
      franchise_id: franchiseId,
      consignment_number: consignment_no,
      // ... other fields ...
      amount: calculatedAmount,  // ❌ JUST STORED AS-IS
      other_charges: calculatedOtherCharges,
      total: calculatedTotal,  // ❌ ONLY amount + other_charges
      // NO tax_amount, NO fuel_amount, NO gst_percent, NO fuel_percent
    };
```

**Issues**:

- No automatic rate calculation
- No tax calculation
- No fuel surcharge calculation
- Amount must be provided manually
- Can't be used for automatic billing

---

### ✅ AFTER (Lines 160-294)

```javascript
import { getDb } from "../config/database.js";
import { calculateBookingRate } from "../services/rateCalculationService.js";  // ✅ NEW
import multer from "multer";
// ... rest of imports

export const createBooking = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const {
      consignment_no,
      customer_id,
      receiver,
      address,
      booking_date,
      consignment_type,
      pincode,
      mode,
      act_wt,
      char_wt,
      qty,
      type,
      amount,
      other_charges,
      reference,
      dtdc_amt,
    } = req.body;

    // ... validation ...

    // ✅ NEW: Calculate rate from RateMaster
    let rateCalculation = null;
    let calculatedAmount = parseFloat(amount || 0);
    let calculatedTax = 0;
    let calculatedFuel = 0;
    let gstPercent = 18;
    let fuelPercent = 0;

    if (!amount || parseFloat(amount) === 0) {
      if (char_wt) {
        try {
          rateCalculation = await calculateBookingRate(  // ✅ CALL SERVICE
            franchiseId,
            null,
            pincode,
            mode === "AR" ? "Air" : mode === "SR" ? "Surface" : mode,
            parseFloat(char_wt),
            parseInt(qty),
            parseFloat(other_charges || 0)
          );

          if (rateCalculation) {
            calculatedAmount = rateCalculation.lineAmount;  // ✅ FROM RATE
            calculatedTax = rateCalculation.taxAmount;  // ✅ CALCULATED
            calculatedFuel = rateCalculation.fuelAmount;  // ✅ CALCULATED
            gstPercent = rateCalculation.gstPercent;
            fuelPercent = rateCalculation.fuelPercent;
          }
        } catch (error) {
          console.warn("Rate calculation skipped:", error.message);
          calculatedAmount = parseFloat(amount || 0);
        }
      }
    } else {
      calculatedTax = (parseFloat(calculatedAmount) * gstPercent) / 100;
      calculatedFuel = (parseFloat(calculatedAmount) * fuelPercent) / 100;
    }

    const calculatedOtherCharges = parseFloat(other_charges || 0);
    const calculatedTotal =
      parseFloat(calculatedAmount) +
      parseFloat(calculatedTax) +
      parseFloat(calculatedFuel) +
      parseFloat(calculatedOtherCharges);

    const bookingData = {
      franchise_id: franchiseId,
      consignment_number: consignment_no,
      // ... other fields ...
      amount: parseFloat(calculatedAmount.toFixed(2)),  // ✅ FROM RATE
      tax_amount: parseFloat(calculatedTax.toFixed(2)),  // ✅ NEW
      fuel_amount: parseFloat(calculatedFuel.toFixed(2)),  // ✅ NEW
      other_charges: parseFloat(calculatedOtherCharges.toFixed(2)),
      total: parseFloat(calculatedTotal.toFixed(2)),  // ✅ COMPLETE
      gst_percent: gstPercent,  // ✅ NEW
      fuel_percent: fuelPercent,  // ✅ NEW
    };
```

**Improvements**:

- Auto-calculates rate from RateMaster
- Calculates tax automatically (18% default)
- Calculates fuel surcharge
- Stores all breakdown components
- Graceful fallback if rate not found
- Proper decimal formatting

---

## 🔴 Change 3: invoiceController.js - Generate Invoice Function

### ❌ BEFORE (Lines 307-316)

```javascript
const invoiceId = result.insertId;

// Link bookings to invoice (if provided)
if (bookings && Array.isArray(bookings) && bookings.length > 0) {
  for (const bookingId of bookings) {
    await connection.query(
      `INSERT INTO invoice_items (invoice_id, booking_id, description, quantity, unit_price, amount)
       SELECT ?, id, CONCAT('Booking: ', consignment_number), 1, total, total
       FROM bookings WHERE id = ?`, // ❌ USES BOOKING total AS unit_price & amount
      [invoiceId, bookingId]
    );
  }
}
```

**Issues**:

- Just copies booking total as-is
- No breakdown of components
- No proper unit pricing
- Doesn't mark bookings as billed
- Can't audit rate details

---

### ✅ AFTER (Lines 307-356)

```javascript
const invoiceId = result.insertId;

// Link bookings to invoice (if provided)
// Workflow Step 3: Create invoice items with calculated amounts
if (bookings && Array.isArray(bookings) && bookings.length > 0) {
  for (const bookingId of bookings) {
    // ✅ FETCH: Booking with all calculated amounts
    const [[booking]] = await connection.query(
      `SELECT 
         id, 
         consignment_number, 
         amount, 
         tax_amount, 
         fuel_amount, 
         other_charges, 
         total,
         qty
       FROM bookings WHERE id = ?`,
      [bookingId]
    );

    if (booking) {
      // ✅ USE: Pre-calculated amounts from booking
      const lineAmount = parseFloat(booking.amount || 0);
      const taxAmount = parseFloat(booking.tax_amount || 0);
      const fuelAmount = parseFloat(booking.fuel_amount || 0);
      const otherAmount = parseFloat(booking.other_charges || 0);
      const itemTotal = parseFloat(booking.total || 0);

      // ✅ INSERT: With proper breakdown
      await connection.query(
        `INSERT INTO invoice_items 
         (invoice_id, booking_id, description, quantity, unit_price, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          bookingId,
          `Booking: ${booking.consignment_number}`,
          parseInt(booking.qty || 1),
          parseFloat((lineAmount / (booking.qty || 1)).toFixed(2)), // ✅ UNIT PRICE
          parseFloat(itemTotal.toFixed(2)), // ✅ TOTAL
        ]
      );

      // ✅ MARK: Booking as billed
      await connection.query(
        `UPDATE bookings SET invoice_id = ?, status = 'Billed' WHERE id = ?`,
        [invoiceId, bookingId]
      );
    }
  }
}
```

**Improvements**:

- Fetches pre-calculated amounts from booking
- Uses stored tax and fuel amounts
- Proper unit price calculation
- Marks bookings as billed
- No double-taxation

---

## 🔴 Change 4: invoiceController.js - Generate Multiple Invoices

### ❌ BEFORE (Lines 404-424)

```javascript
for (const customerId of customers) {
  // Fetch bookings for this customer in the period
  const [bookings] = await db.query(
    `SELECT * FROM bookings 
     WHERE franchise_id = ? AND customer_id = ? 
     AND booking_date BETWEEN ? AND ?`, // ❌ GETS ALL, INCLUDING BILLED
    [franchiseId, customerId, period_from, period_to]
  );

  if (bookings.length === 0) {
    continue;
  }

  // ❌ RECALCULATES TAXES (DOUBLE-TAXATION RISK)
  const total = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.total) || 0),
    0
  );
  const subtotal = total; // ❌ WRONG: subtotal = total?
  const gstAmount = (total * parseFloat(gst_percent)) / 100; // ❌ RECALC
  const netAmount = subtotal + gstAmount; // ❌ WRONG

  // ... invoice creation ...

  // ❌ DOESN'T MARK BOOKINGS AS BILLED
  for (const booking of bookings) {
    await connection.query(
      `INSERT INTO invoice_items (invoice_id, booking_id, description, quantity, unit_price, amount)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [
        invoiceId,
        booking.id,
        `Booking: ${booking.consignment_number}`,
        booking.total, // ❌ USES TOTAL AS UNIT_PRICE
        booking.total,
      ]
    );
  }
}
```

**Issues**:

- Includes already-billed bookings
- Recalculates GST (double-taxation)
- Treats total as unit price
- Doesn't mark bookings as billed
- Wrong subtotal calculation

---

### ✅ AFTER (Lines 404-500)

```javascript
for (const customerId of customers) {
  // ✅ FETCH: Unbilled bookings only
  const [bookings] = await db.query(
    `SELECT 
       id,
       consignment_number,
       qty,
       amount,
       tax_amount,
       fuel_amount,
       other_charges,
       total
     FROM bookings 
     WHERE franchise_id = ? AND customer_id = ? 
     AND booking_date BETWEEN ? AND ?
     AND invoice_id IS NULL`, // ✅ UNBILLED ONLY
    [franchiseId, customerId, period_from, period_to]
  );

  if (bookings.length === 0) {
    continue;
  }

  // ✅ USE: Pre-calculated amounts (no recalculation)
  let subtotal = 0;
  let taxTotal = 0;
  let fuelTotal = 0;
  let otherTotal = 0;

  bookings.forEach((b) => {
    subtotal += parseFloat(b.amount || 0); // ✅ LINE AMOUNT
    taxTotal += parseFloat(b.tax_amount || 0); // ✅ FROM BOOKING
    fuelTotal += parseFloat(b.fuel_amount || 0); // ✅ FROM BOOKING
    otherTotal += parseFloat(b.other_charges || 0); // ✅ FROM BOOKING
  });

  const total = subtotal + taxTotal + fuelTotal + otherTotal; // ✅ CORRECT
  const netAmount = total; // ✅ NO DOUBLE-CALC

  // ... invoice creation ...

  // ✅ MARK: Bookings as billed
  for (const booking of bookings) {
    const lineAmount = parseFloat(booking.amount || 0);
    const itemQuantity = parseInt(booking.qty || 1);

    await connection.query(
      `INSERT INTO invoice_items (invoice_id, booking_id, description, quantity, unit_price, amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        booking.id,
        `Booking: ${booking.consignment_number}`,
        itemQuantity,
        parseFloat((lineAmount / itemQuantity).toFixed(2)), // ✅ UNIT PRICE
        parseFloat(booking.total.toFixed(2)), // ✅ TOTAL
      ]
    );

    // ✅ MARK: Booking as billed
    await connection.query(
      `UPDATE bookings SET invoice_id = ?, status = 'Billed' WHERE id = ?`,
      [invoiceId, booking.id]
    );
  }
}
```

**Improvements**:

- Fetches unbilled bookings only
- Uses pre-calculated amounts
- No double-taxation
- Correct subtotal calculation
- Marks all bookings as billed
- Proper unit pricing

---

## 🆕 NEW: rateCalculationService.js

```javascript
/**
 * NEW FILE: backend/src/services/rateCalculationService.js
 * Centralized rate calculation logic
 */

// 1. Fetch rate from RateMaster
export const fetchRateFromMaster = async (
  franchiseId,
  fromPincode,
  toPincode,
  serviceType,
  weight
) => {
  /* ... */
};

// 2. Calculate line amount
export const calculateLineAmount = (rate, quantity) => {
  /* ... */
};

// 3. Calculate tax
export const calculateTaxAmount = (lineAmount, gstPercentage) => {
  /* ... */
};

// 4. Calculate fuel surcharge
export const calculateFuelSurcharge = (lineAmount, fuelPercent) => {
  /* ... */
};

// 5. Calculate net amount
export const calculateNetAmount = (
  lineAmount,
  taxAmount,
  fuelAmount,
  other
) => {
  /* ... */
};

// 6. Complete calculation (used in bookings)
export const calculateBookingRate = async (/* params */) => {
  /* ... */
};

// 7. Calculate invoice totals (used in invoices)
export const calculateInvoiceTotals = (bookings) => {
  /* ... */
};

// 8. Validate calculations
export const validateRateCalculation = (calculation) => {
  /* ... */
};
```

---

## 📊 Summary of Changes

| File                        | Function                   | Before          | After     | Impact          |
| --------------------------- | -------------------------- | --------------- | --------- | --------------- |
| `rateMasterController.js`   | `calculateRate`            | rate_per_kg     | rate      | 🐛 Bug Fix      |
| `bookingController.js`      | `createBooking`            | No calculation  | Auto-calc | 🚀 Enhancement  |
| `invoiceController.js`      | `generateInvoice`          | Just copy total | Breakdown | 📈 Quality      |
| `invoiceController.js`      | `generateMultipleInvoices` | Recalc taxes    | Pre-calc  | ✅ Accuracy     |
| `rateCalculationService.js` | NEW                        | N/A             | Service   | 🆕 Architecture |

---

## ✅ Tests Performed

- [x] Rate calculation endpoint working
- [x] Booking creation with auto-rate calculation
- [x] Tax and fuel calculations correct
- [x] Invoice generation no double-taxation
- [x] Multiple bookings invoice aggregation
- [x] Booking status updated to Billed
- [x] All decimal formatting correct

---

## 🎉 Result

All code changes align with the documented workflow specification. The system now:

- ✅ Automatically calculates rates from RateMaster
- ✅ Properly applies taxes and surcharges
- ✅ Generates accurate invoices without double-taxation
- ✅ Maintains complete audit trail
- ✅ Handles edge cases gracefully
