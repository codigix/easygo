require("dotenv").config();
const mysql = require("mysql2/promise");

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    console.log("Connected to AWS database...");

    // Check which columns already exist
    const [columns] = await connection.query("DESCRIBE bookings");
    const existingColumns = new Set(columns.map((c) => c.Field));

    console.log("\nChecking for missing columns...");

    const columnsToAdd = [
      {
        name: "tax_amount",
        sql: "ALTER TABLE bookings ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0 COMMENT 'GST/Tax amount calculated from RateMaster'",
      },
      {
        name: "fuel_amount",
        sql: "ALTER TABLE bookings ADD COLUMN fuel_amount DECIMAL(10, 2) DEFAULT 0 COMMENT 'Fuel surcharge calculated from RateMaster'",
      },
      {
        name: "gst_percent",
        sql: "ALTER TABLE bookings ADD COLUMN gst_percent DECIMAL(5, 2) DEFAULT 18 COMMENT 'GST percentage used in calculation'",
      },
      {
        name: "fuel_percent",
        sql: "ALTER TABLE bookings ADD COLUMN fuel_percent DECIMAL(5, 2) DEFAULT 0 COMMENT 'Fuel surcharge percentage used in calculation'",
      },
      {
        name: "from_pincode",
        sql: "ALTER TABLE bookings ADD COLUMN from_pincode VARCHAR(10) COMMENT 'Source pincode for rate calculation'",
      },
      {
        name: "to_pincode",
        sql: "ALTER TABLE bookings ADD COLUMN to_pincode VARCHAR(10) COMMENT 'Destination pincode for rate calculation'",
      },
      {
        name: "rate",
        sql: "ALTER TABLE bookings ADD COLUMN rate DECIMAL(10, 2) COMMENT 'Rate fetched from RateMaster'",
      },
      {
        name: "rate_master_id",
        sql: "ALTER TABLE bookings ADD COLUMN rate_master_id INT UNSIGNED COMMENT 'Reference to rate_master record used'",
      },
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.has(col.name)) {
        console.log(`\n✨ Adding column: ${col.name}`);
        await connection.query(col.sql);
        console.log(`✅ Successfully added: ${col.name}`);
      } else {
        console.log(`⏭️  Column ${col.name} already exists, skipping...`);
      }
    }

    console.log("\n🎉 All missing columns have been added!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
