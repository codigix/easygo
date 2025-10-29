import { getDb } from "../config/database.js";

// Save all courier rates for a company
export const saveCourierRates = async (req, res) => {
  const db = getDb();
  let connection = null;

  try {
    const franchiseId = req.user.franchise_id;
    const { company_id, rates_data } = req.body;

    if (!company_id || !rates_data) {
      return res.status(400).json({
        success: false,
        message: "company_id and rates_data are required",
      });
    }

    if (!Array.isArray(rates_data) || rates_data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rates_data must be a non-empty array",
      });
    }

    // Verify company exists
    const [[company]] = await db.query(
      "SELECT id FROM company_rate_master WHERE id = ? AND franchise_id = ?",
      [company_id, franchiseId]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Get database connection
    connection = await db.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Delete existing rates for this company
    await connection.query(
      "DELETE FROM courier_company_rates WHERE company_id = ? AND franchise_id = ?",
      [company_id, franchiseId]
    );

    // Validate and insert new rates
    let insertedCount = 0;
    const validationErrors = [];

    // Valid slab types based on database enum
    const validSlabTypes = ["Slab 2", "Slab 3", "Slab 4"];

    for (const rateItem of rates_data) {
      let { courier_type, row_name, sub_type, slab_type, rates } = rateItem;

      // Validate required fields
      if (!courier_type || !row_name || !slab_type || !rates) {
        validationErrors.push(
          `Invalid rate entry: missing courier_type, row_name, slab_type, or rates for ${
            courier_type || "unknown"
          }`
        );
        continue;
      }

      // Validate slab_type is one of the allowed enum values
      if (!validSlabTypes.includes(slab_type)) {
        validationErrors.push(
          `Invalid slab_type "${slab_type}" for ${courier_type} - ${row_name}: must be one of ${validSlabTypes.join(
            ", "
          )}`
        );
        continue;
      }

      // Validate rates is an object with numeric values
      if (typeof rates !== "object" || Array.isArray(rates)) {
        validationErrors.push(
          `Invalid rates for ${courier_type} - ${row_name}: rates must be an object`
        );
        continue;
      }

      const rateValues = Object.values(rates).filter(
        (val) => val !== null && val !== undefined && val !== ""
      );
      if (rateValues.length === 0) {
        validationErrors.push(
          `Invalid rates for ${courier_type} - ${row_name}: rates object is empty`
        );
        continue;
      }

      // Convert all rate values to numbers and validate
      const convertedRates = {};
      let hasValidRate = false;
      let validationFailed = false;

      for (const [key, val] of Object.entries(rates)) {
        if (val === null || val === undefined || val === "") {
          continue;
        }
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          validationErrors.push(
            `Invalid rate value for ${courier_type} - ${row_name} [${key}]: "${val}" is not a valid number`
          );
          validationFailed = true;
          break;
        }
        if (numVal >= 0) {
          hasValidRate = true;
          convertedRates[key] = numVal;
        }
      }

      if (validationFailed) {
        continue;
      }

      if (!hasValidRate) {
        validationErrors.push(
          `Invalid rates for ${courier_type} - ${row_name}: must contain at least one valid numeric rate`
        );
        continue;
      }

      // Use converted rates for storage
      rates = convertedRates;

      try {
        await connection.query(
          `INSERT INTO courier_company_rates 
           (franchise_id, company_id, courier_type, row_name, sub_type, slab_type, rates, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [
            franchiseId,
            company_id,
            courier_type,
            row_name,
            sub_type || null,
            slab_type,
            JSON.stringify(rates),
          ]
        );
        console.log(
          `✅ Rate inserted: ${courier_type} - ${row_name} - ${slab_type}`
        );
        insertedCount++;
      } catch (insertError) {
        console.error("Error inserting rate:", {
          message: insertError.message,
          code: insertError.code,
          courier_type,
          row_name,
          slab_type,
        });
        validationErrors.push(
          `Failed to insert rate for ${courier_type} - ${row_name}: ${
            insertError.message || "Database error"
          }`
        );
      }
    }

    if (insertedCount === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No valid rates to insert",
        errors: validationErrors,
      });
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: `${insertedCount} courier rates saved successfully`,
      data: {
        inserted: insertedCount,
        errors: validationErrors.length > 0 ? validationErrors : undefined,
      },
    });
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Save courier rates error:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to save courier rates",
      error: error.message || "Database error",
      code: error.code,
    });
  }
};

// Get all rates for a company
export const getCompanyRates = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "company_id is required",
      });
    }

    const db = getDb();

    const [rates] = await db.query(
      `SELECT * FROM courier_company_rates 
       WHERE company_id = ? AND franchise_id = ? 
       ORDER BY courier_type, row_name, slab_type`,
      [company_id, franchiseId]
    );

    // Parse JSON rates
    const parsedRates = rates.map((rate) => ({
      ...rate,
      rates:
        typeof rate.rates === "string" ? JSON.parse(rate.rates) : rate.rates,
    }));

    res.json({
      success: true,
      data: parsedRates,
    });
  } catch (error) {
    console.error("Get company rates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company rates",
    });
  }
};

// Get rates by courier type for a company
export const getRatesByCourierType = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { company_id, courier_type } = req.params;

    if (!company_id || !courier_type) {
      return res.status(400).json({
        success: false,
        message: "company_id and courier_type are required",
      });
    }

    const db = getDb();

    const [rates] = await db.query(
      `SELECT * FROM courier_company_rates 
       WHERE company_id = ? AND courier_type = ? AND franchise_id = ? 
       ORDER BY slab_type, row_name`,
      [company_id, courier_type, franchiseId]
    );

    const parsedRates = rates.map((rate) => ({
      ...rate,
      rates:
        typeof rate.rates === "string" ? JSON.parse(rate.rates) : rate.rates,
    }));

    res.json({
      success: true,
      data: parsedRates,
    });
  } catch (error) {
    console.error("Get courier type rates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courier rates",
    });
  }
};

// Calculate rate for booking/consignment (used during booking creation)
export const calculateRate = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { company_id, courier_type, row_name, weight, sub_type } = req.body;

    if (!company_id || !courier_type || !row_name || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "company_id, courier_type, row_name, and weight are required",
      });
    }

    const db = getDb();

    // Get company surcharges
    const [[company]] = await db.query(
      `SELECT fuel_surcharge_percent, gec_fuel_surcharge_percent, royalty_charges_percent, cod_charge
       FROM company_rate_master 
       WHERE id = ? AND franchise_id = ?`,
      [company_id, franchiseId]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Get the rate for the specific row and weight
    let query = `SELECT rates, slab_type FROM courier_company_rates 
                 WHERE company_id = ? AND courier_type = ? AND row_name = ? 
                 AND franchise_id = ?`;
    const params = [company_id, courier_type, row_name, franchiseId];

    if (sub_type) {
      query += " AND sub_type = ?";
      params.push(sub_type);
    }

    const [[rateRecord]] = await db.query(query, params);

    if (!rateRecord) {
      return res.status(404).json({
        success: false,
        message: "Rate not found for this configuration",
      });
    }

    const rates =
      typeof rateRecord.rates === "string"
        ? JSON.parse(rateRecord.rates)
        : rateRecord.rates;

    // Calculate rate based on weight and slab type
    // Rates object: {rate_1: "100", rate_2: "150", rate_3: "200", rate_4: "250"}
    const rateCount = Object.keys(rates).length;
    let baseRate = 0;
    const parsedWeight = parseFloat(weight);

    // Define weight brackets for each slab
    // These represent the upper limits for each bracket
    const weightBrackets = {
      2: [1], // Slab 2: 1kg upto, then additional
      3: [0.5, 1], // Slab 3: 0.5kg, 1kg, then additional
      4: [0.5, 1, 2], // Slab 4: 0.5kg, 1kg, 2kg, then additional
    };

    const slabNum = rateCount;
    const brackets = weightBrackets[slabNum] || [1];

    if (slabNum === 2) {
      // Slab 2: rate_1 for first bracket, rate_2 for each additional unit
      if (parsedWeight <= brackets[0]) {
        baseRate = parseFloat(rates.rate_1 || 0);
      } else {
        const additionalWeight = parsedWeight - brackets[0];
        const additionalUnits = Math.ceil(additionalWeight);
        baseRate =
          parseFloat(rates.rate_1 || 0) +
          additionalUnits * parseFloat(rates.rate_2 || 0);
      }
    } else if (slabNum === 3) {
      // Slab 3: rate_1 for first bracket, rate_2 for second, rate_3 for additional
      if (parsedWeight <= brackets[0]) {
        baseRate = parseFloat(rates.rate_1 || 0);
      } else if (parsedWeight <= brackets[1]) {
        baseRate = parseFloat(rates.rate_2 || 0);
      } else {
        const additionalWeight = parsedWeight - brackets[1];
        const additionalUnits = Math.ceil(additionalWeight);
        baseRate =
          parseFloat(rates.rate_2 || 0) +
          additionalUnits * parseFloat(rates.rate_3 || 0);
      }
    } else if (slabNum === 4) {
      // Slab 4: rate_1, rate_2, rate_3 for first three brackets, rate_4 for additional
      if (parsedWeight <= brackets[0]) {
        baseRate = parseFloat(rates.rate_1 || 0);
      } else if (parsedWeight <= brackets[1]) {
        baseRate = parseFloat(rates.rate_2 || 0);
      } else if (parsedWeight <= brackets[2]) {
        baseRate = parseFloat(rates.rate_3 || 0);
      } else {
        const additionalWeight = parsedWeight - brackets[2];
        const additionalUnits = Math.ceil(additionalWeight);
        baseRate =
          parseFloat(rates.rate_3 || 0) +
          additionalUnits * parseFloat(rates.rate_4 || 0);
      }
    } else {
      // Fallback: use rate_1 if unknown slab
      baseRate = parseFloat(rates.rate_1 || 0);
    }

    // Apply surcharges
    const fuelSurcharge =
      (baseRate * parseFloat(company.fuel_surcharge_percent || 0)) / 100;
    const royaltySurcharge =
      (baseRate * parseFloat(company.royalty_charges_percent || 0)) / 100;
    const finalRate = baseRate + fuelSurcharge + royaltySurcharge;

    res.json({
      success: true,
      data: {
        base_rate: parseFloat(baseRate.toFixed(2)),
        fuel_surcharge: parseFloat(fuelSurcharge.toFixed(2)),
        royalty_surcharge: parseFloat(royaltySurcharge.toFixed(2)),
        final_rate: parseFloat(finalRate.toFixed(2)),
        slab_type: rateRecord.slab_type,
        weight: parsedWeight,
      },
    });
  } catch (error) {
    console.error("Calculate rate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate rate",
    });
  }
};

// Delete all rates for a company
export const deleteCompanyRates = async (req, res) => {
  try {
    const franchiseId = req.user.franchise_id;
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "company_id is required",
      });
    }

    const db = getDb();

    const [result] = await db.query(
      "DELETE FROM courier_company_rates WHERE company_id = ? AND franchise_id = ?",
      [company_id, franchiseId]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} rate records deleted`,
    });
  } catch (error) {
    console.error("Delete courier rates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete courier rates",
    });
  }
};
