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

    if (!company) {
      return null;
    }

    return company;
  } catch (error) {
    console.error("Error fetching company defaults:", error);
    throw error;
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
  const defaults =
    companyDefaults || {
      fuel_surcharge_percent: 0,
      royalty_charges_percent: 0,
      topay_charge: 0,
      cod_charge: 0,
      insurance_percent: 0,
    };

  const fuelSurcharge =
    (amount * (parseFloat(defaults.fuel_surcharge_percent) || 0)) / 100;
  const royaltyCharges =
    (amount * (parseFloat(defaults.royalty_charges_percent) || 0)) / 100;
  const insuranceCharges =
    (amount * (parseFloat(defaults.insurance_percent) || 0)) / 100;
  const toPayCharge = parseFloat(defaults.topay_charge || 0);
  const codCharge = parseFloat(defaults.cod_charge || 0);

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
