import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
  });

  try {
    console.log("✅ Connected to AWS database");
    console.log(`   Host: ${env.mysql.host}`);
    console.log(`   Database: ${env.mysql.database}\n`);

    // Check which columns already exist
    const [columns] = await connection.query("DESCRIBE bookings");
    const existingColumns = new Set(columns.map((c) => c.Field));

    console.log("Checking for missing columns...\n");

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
    ];

    let addedCount = 0;
    for (const col of columnsToAdd) {
      if (!existingColumns.has(col.name)) {
        console.log(`✨ Adding column: ${col.name}`);
        try {
          await connection.query(col.sql);
          console.log(`   ✅ Successfully added\n`);
          addedCount++;
        } catch (err) {
          if (err.code === "ER_DUP_FIELDNAME") {
            console.log(`   ⏭️  Column already exists\n`);
          } else {
            throw err;
          }
        }
      } else {
        console.log(`⏭️  Column ${col.name} already exists\n`);
      }
    }

    console.log(`🎉 Done! Added ${addedCount} new column(s)`);
    console.log("   You can now create bookings without errors!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
