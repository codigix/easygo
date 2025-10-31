/**
 * Validates booking and invoice calculations to ensure mathematical accuracy
 * Prevents financial errors from passing silently through the system
 */

const TOLERANCE = 0.01; // Allow 1 paisa tolerance for rounding

/**
 * Validate booking calculation
 * Ensures: booking.total = amount + tax_amount + fuel_amount + other_charges
 */
export const validateBookingCalculations = (booking) => {
  const expectedTotal = {
    base: parseFloat(booking.amount || 0),
    tax: parseFloat(booking.tax_amount || 0),
    fuel: parseFloat(booking.fuel_amount || 0),
    other: parseFloat(booking.other_charges || 0),
  };

  expectedTotal.sum =
    expectedTotal.base +
    expectedTotal.tax +
    expectedTotal.fuel +
    expectedTotal.other;

  const actualTotal = parseFloat(booking.total || 0);
  const difference = Math.abs(expectedTotal.sum - actualTotal);

  if (difference > TOLERANCE) {
    const error = new Error(
      `❌ Booking Calculation Mismatch!\n` +
        `Booking ID: ${booking.id || "unknown"}\n` +
        `Expected: ${expectedTotal.base} + ${expectedTotal.tax} + ${expectedTotal.fuel} + ${expectedTotal.other} = ${expectedTotal.sum}\n` +
        `Actual Total: ${actualTotal}\n` +
        `Difference: ₹${difference.toFixed(
          2
        )} (exceeds tolerance of ₹${TOLERANCE})`
    );
    error.code = "CALCULATION_MISMATCH";
    throw error;
  }

  return {
    valid: true,
    breakdown: expectedTotal,
    actual: actualTotal,
    difference: parseFloat(difference.toFixed(2)),
  };
};

/**
 * Validate invoice calculation
 * Ensures: invoice.total = sum of all booking totals
 */
export const validateInvoiceCalculations = (invoice, bookings) => {
  if (!bookings || bookings.length === 0) {
    return {
      valid: true,
      message: "No bookings to validate",
      breakdown: {},
    };
  }

  const breakdown = {
    totalAmount: 0,
    totalTax: 0,
    totalFuel: 0,
    totalOther: 0,
    itemCount: bookings.length,
  };

  // Sum up all booking components
  bookings.forEach((booking, index) => {
    const amount = parseFloat(booking.amount || 0);
    const tax = parseFloat(booking.tax_amount || 0);
    const fuel = parseFloat(booking.fuel_amount || 0);
    const other = parseFloat(booking.other_charges || 0);

    breakdown.totalAmount += amount;
    breakdown.totalTax += tax;
    breakdown.totalFuel += fuel;
    breakdown.totalOther += other;

    // Validate each booking internally
    try {
      validateBookingCalculations(booking);
    } catch (error) {
      error.bookingIndex = index;
      throw error;
    }
  });

  breakdown.expectedTotal =
    breakdown.totalAmount +
    breakdown.totalTax +
    breakdown.totalFuel +
    breakdown.totalOther;

  const actualInvoiceTotal = parseFloat(invoice.total || 0);
  const difference = Math.abs(breakdown.expectedTotal - actualInvoiceTotal);

  if (difference > TOLERANCE) {
    const error = new Error(
      `❌ Invoice Calculation Mismatch!\n` +
        `Invoice ID: ${invoice.id || "unknown"}\n` +
        `Expected Total: ₹${breakdown.expectedTotal.toFixed(2)}\n` +
        `  - Base Amount: ₹${breakdown.totalAmount.toFixed(2)}\n` +
        `  - Tax: ₹${breakdown.totalTax.toFixed(2)}\n` +
        `  - Fuel: ₹${breakdown.totalFuel.toFixed(2)}\n` +
        `  - Other Charges: ₹${breakdown.totalOther.toFixed(2)}\n` +
        `Actual Invoice Total: ₹${actualInvoiceTotal.toFixed(2)}\n` +
        `Difference: ₹${difference.toFixed(
          2
        )} (exceeds tolerance of ₹${TOLERANCE})`
    );
    error.code = "INVOICE_CALCULATION_MISMATCH";
    throw error;
  }

  return {
    valid: true,
    breakdown: {
      totalAmount: parseFloat(breakdown.totalAmount.toFixed(2)),
      totalTax: parseFloat(breakdown.totalTax.toFixed(2)),
      totalFuel: parseFloat(breakdown.totalFuel.toFixed(2)),
      totalOther: parseFloat(breakdown.totalOther.toFixed(2)),
      expectedTotal: parseFloat(breakdown.expectedTotal.toFixed(2)),
    },
    actual: actualInvoiceTotal,
    itemCount: breakdown.itemCount,
    difference: parseFloat(difference.toFixed(2)),
  };
};

/**
 * Validate GST calculation
 * Ensures GST is not being double-charged
 */
export const validateGstCalculation = (invoice, bookings, gstPercent) => {
  // GST should be pre-calculated in booking tax_amounts and summed
  // NOT recalculated on net_amount

  let totalBookingTax = 0;
  bookings.forEach((booking) => {
    totalBookingTax += parseFloat(booking.tax_amount || 0);
  });

  const invoiceGst = parseFloat(invoice.gst_amount_new || 0);
  const difference = Math.abs(totalBookingTax - invoiceGst);

  if (difference > TOLERANCE * bookings.length) {
    // Allow more tolerance based on number of bookings
    console.warn(
      `⚠️ GST Calculation Warning!\n` +
        `Sum of Booking Taxes: ₹${totalBookingTax.toFixed(2)}\n` +
        `Invoice GST: ₹${invoiceGst.toFixed(2)}\n` +
        `Difference: ₹${difference.toFixed(2)}`
    );
  }

  return {
    valid:
      Math.abs(totalBookingTax - invoiceGst) <= TOLERANCE * bookings.length,
    sumOfBookingTaxes: parseFloat(totalBookingTax.toFixed(2)),
    invoiceGst: invoiceGst,
    difference: parseFloat(difference.toFixed(2)),
  };
};

export default {
  validateBookingCalculations,
  validateInvoiceCalculations,
  validateGstCalculation,
};
