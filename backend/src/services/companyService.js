import { getDb } from "../config/database.js";

/**
 * Fetch company master defaults for a specific customer
 * Used to apply company-specific rates, charges, and policies
 */
export const getCompanyDefaults = async (franchiseId, customerId) => {
  try {
    const db = getDb();
    const [[company]] = await db.query(
      `SELECT 
        fuel_surcharge_percent,
        royalty_charges_percent,
        topay_charge,
        cod_charge,
        insurance_percent,
        gst_no,
        company_address
      FROM company_rate_master 
      WHERE franchise_id = ? AND company_id = ?`,
      [franchiseId, customerId]
    );

    // Return company data or sensible defaults
    return (
      company || {
        fuel_surcharge_percent: 0,
        royalty_charges_percent: 0,
        topay_charge: 0,
        cod_charge: 0,
        insurance_percent: 0,
        gst_no: null,
        company_address: null,
      }
    );
  } catch (error) {
    console.error("Error fetching company defaults:", error);
    // Return defaults on error for graceful degradation
    return {
      fuel_surcharge_percent: 0,
      royalty_charges_percent: 0,
      topay_charge: 0,
      cod_charge: 0,
      insurance_percent: 0,
      gst_no: null,
      company_address: null,
    };
  }
};

/**
 * Calculate company-specific charges based on company master
 * Applies fuel surcharge, royalty, and insurance percentages
 */
export const calculateCompanyCharges = (
  baseAmount,
  companyDefaults,
  chargeableWeight
) => {
  const amount = parseFloat(baseAmount || 0);

  // Fuel surcharge calculation
  const fuelSurcharge =
    (amount * (parseFloat(companyDefaults.fuel_surcharge_percent) || 0)) / 100;

  // Royalty charges calculation (usually percentage-based on base amount)
  const royaltyCharges =
    (amount * (parseFloat(companyDefaults.royalty_charges_percent) || 0)) / 100;

  // Insurance calculation (usually percentage-based, optional)
  const insuranceCharges =
    (amount * (parseFloat(companyDefaults.insurance_percent) || 0)) / 100;

  // Fixed charges
  const toPayCharge = parseFloat(companyDefaults.topay_charge || 0);
  const codCharge = parseFloat(companyDefaults.cod_charge || 0);

  return {
    fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
    royaltyCharges: parseFloat(royaltyCharges.toFixed(2)),
    insuranceCharges: parseFloat(insuranceCharges.toFixed(2)),
    toPayCharge: toPayCharge,
    codCharge: codCharge,
    totalCompanyCharges: parseFloat(
      (
        fuelSurcharge +
        royaltyCharges +
        insuranceCharges +
        toPayCharge +
        codCharge
      ).toFixed(2)
    ),
  };
};

export default {
  getCompanyDefaults,
  calculateCompanyCharges,
};
