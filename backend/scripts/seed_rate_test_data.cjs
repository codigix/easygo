const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
};

const FRANCHISE = {
  code: "FR928444",
  name: "Rate Test Franchise",
  owner: "Test Owner",
  email: "ratetest-franchise@example.com",
  phone: "+91 9000000007",
  whatsapp: "+91 9000000007",
  address: "123 Test Street",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  gst: "27ABCDE1234F1Z5",
};

const COMPANY = {
  code: "FCH-AUTO-001",
  name: "FCH Auto Logistics",
  address: "Plot 42, Auto Hub, Pune",
  phone: "+91 9876543210",
  email: "auto@example.com",
  gst: "27FCHAU1234A1Z7",
  insurance_percent: 2,
  minimum_risk_surcharge: 50,
  other_details: "Mock data for automated rate test",
  topay_charge: 15,
  cod_charge: 25,
  fuel_surcharge_percent: 8,
  gec_fuel_surcharge_percent: 5,
  royalty_charges_percent: 3,
  pan_no: "FCHAU1234A",
  due_days: 30,
};

const RATE_PRESETS = [
  {
    service_type: "Air",
    from_pincode: "*",
    to_pincode: "*",
    weight_from: 0,
    weight_to: 5,
    rate: 150,
    fuel_surcharge: 12,
    gst_percentage: 18,
  },
  {
    service_type: "Air",
    from_pincode: "*",
    to_pincode: "*",
    weight_from: 5,
    weight_to: 20,
    rate: 120,
    fuel_surcharge: 10,
    gst_percentage: 18,
  },
  {
    service_type: "Surface",
    from_pincode: "*",
    to_pincode: "*",
    weight_from: 0,
    weight_to: 10,
    rate: 90,
    fuel_surcharge: 6,
    gst_percentage: 18,
  },
  {
    service_type: "Surface",
    from_pincode: "*",
    to_pincode: "*",
    weight_from: 10,
    weight_to: 50,
    rate: 70,
    fuel_surcharge: 5,
    gst_percentage: 18,
  },
  {
    service_type: "Express",
    from_pincode: "*",
    to_pincode: "*",
    weight_from: 0,
    weight_to: 30,
    rate: 200,
    fuel_surcharge: 15,
    gst_percentage: 18,
  },
];

(async () => {
  const connection = await mysql.createConnection(config);
  await connection.beginTransaction();

  try {
    let franchiseId;
    const [franchiseRows] = await connection.query(
      "SELECT id FROM franchises WHERE franchise_code = ?",
      [FRANCHISE.code]
    );

    if (franchiseRows.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO franchises (
          franchise_code,
          franchise_name,
          owner_name,
          email,
          phone,
          whatsapp,
          address,
          city,
          state,
          pincode,
          gst_number,
          subscription_status,
          subscription_days_remaining,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 365, 'active', NOW(), NOW())`,
        [
          FRANCHISE.code,
          FRANCHISE.name,
          FRANCHISE.owner,
          FRANCHISE.email,
          FRANCHISE.phone,
          FRANCHISE.whatsapp,
          FRANCHISE.address,
          FRANCHISE.city,
          FRANCHISE.state,
          FRANCHISE.pincode,
          FRANCHISE.gst,
        ]
      );
      franchiseId = result.insertId;
      console.log(`Created franchise ${FRANCHISE.code} with ID ${franchiseId}`);
    } else {
      franchiseId = franchiseRows[0].id;
      console.log(
        `Franchise ${FRANCHISE.code} already exists with ID ${franchiseId}`
      );
    }

    const [companyRows] = await connection.query(
      "SELECT id FROM company_rate_master WHERE franchise_id = ? AND company_id = ?",
      [franchiseId, COMPANY.code]
    );

    let companyId;
    if (companyRows.length === 0) {
      const [insertResult] = await connection.query(
        `INSERT INTO company_rate_master (
          franchise_id,
          company_id,
          company_name,
          company_address,
          phone,
          email,
          gst_no,
          insurance_percent,
          minimum_risk_surcharge,
          other_details,
          topay_charge,
          cod_charge,
          fuel_surcharge_percent,
          gec_fuel_surcharge_percent,
          royalty_charges_percent,
          pan_no,
          due_days,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
          franchiseId,
          COMPANY.code,
          COMPANY.name,
          COMPANY.address,
          COMPANY.phone,
          COMPANY.email,
          COMPANY.gst,
          COMPANY.insurance_percent,
          COMPANY.minimum_risk_surcharge,
          COMPANY.other_details,
          COMPANY.topay_charge,
          COMPANY.cod_charge,
          COMPANY.fuel_surcharge_percent,
          COMPANY.gec_fuel_surcharge_percent,
          COMPANY.royalty_charges_percent,
          COMPANY.pan_no,
          COMPANY.due_days,
        ]
      );
      companyId = insertResult.insertId;
      console.log(
        `Created company ${COMPANY.code} for franchise ${FRANCHISE.code}`
      );
    } else {
      companyId = companyRows[0].id;
      await connection.query(
        `UPDATE company_rate_master SET
          company_name = ?,
          company_address = ?,
          phone = ?,
          email = ?,
          gst_no = ?,
          insurance_percent = ?,
          minimum_risk_surcharge = ?,
          other_details = ?,
          topay_charge = ?,
          cod_charge = ?,
          fuel_surcharge_percent = ?,
          gec_fuel_surcharge_percent = ?,
          royalty_charges_percent = ?,
          pan_no = ?,
          due_days = ?,
          status = 'active',
          updated_at = NOW()
        WHERE id = ?`,
        [
          COMPANY.name,
          COMPANY.address,
          COMPANY.phone,
          COMPANY.email,
          COMPANY.gst,
          COMPANY.insurance_percent,
          COMPANY.minimum_risk_surcharge,
          COMPANY.other_details,
          COMPANY.topay_charge,
          COMPANY.cod_charge,
          COMPANY.fuel_surcharge_percent,
          COMPANY.gec_fuel_surcharge_percent,
          COMPANY.royalty_charges_percent,
          COMPANY.pan_no,
          COMPANY.due_days,
          companyId,
        ]
      );
      console.log(
        `Updated company ${COMPANY.code} for franchise ${FRANCHISE.code}`
      );
    }

    const serviceTypes = [...new Set(RATE_PRESETS.map((r) => r.service_type))];
    if (serviceTypes.length > 0) {
      const placeholders = serviceTypes.map(() => "?").join(", ");
      await connection.query(
        `DELETE FROM rate_master WHERE franchise_id = ? AND from_pincode = '*' AND to_pincode = '*' AND service_type IN (${placeholders})`,
        [franchiseId, ...serviceTypes]
      );
    }

    const rateInsertSql = `INSERT INTO rate_master (
      franchise_id,
      from_pincode,
      to_pincode,
      service_type,
      weight_from,
      weight_to,
      rate,
      fuel_surcharge,
      gst_percentage,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`;

    for (const rate of RATE_PRESETS) {
      await connection.query(rateInsertSql, [
        franchiseId,
        rate.from_pincode,
        rate.to_pincode,
        rate.service_type,
        rate.weight_from,
        rate.weight_to,
        rate.rate,
        rate.fuel_surcharge,
        rate.gst_percentage,
      ]);
    }

    await connection.commit();

    console.log("\n✅ Mock rate data prepared successfully:");
    console.table([
      { key: "Franchise ID", value: franchiseId },
      { key: "Franchise Code", value: FRANCHISE.code },
      { key: "Company Code", value: COMPANY.code },
      { key: "Company DB ID", value: companyId },
      { key: "Rate Records", value: RATE_PRESETS.length },
    ]);
  } catch (error) {
    await connection.rollback();
    console.error("❌ Failed to prepare rate data:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
