import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

async function addMissingColumns() {
  let connection;
  try {
    console.log("Connecting to AWS database...");
    connection = await mysql.createConnection({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
    });

    console.log("✅ Connected to AWS database!\n");

    // Add missing columns
    const queries = [
      `ALTER TABLE franchises ADD COLUMN invoice_prefix VARCHAR(50)`,
      `ALTER TABLE franchises ADD COLUMN arn VARCHAR(50)`,
      `ALTER TABLE franchises ADD COLUMN service_area VARCHAR(100)`,
      `ALTER TABLE franchises ADD COLUMN account_name VARCHAR(100)`,
    ];

    console.log("Adding missing columns to franchises table...\n");

    for (const query of queries) {
      try {
        console.log(`  Executing: ${query.substring(0, 60)}...`);
        await connection.query(query);
        console.log(`  ✅ Success`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`  ⚠️  Column already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log("\n✅ All columns added successfully!\n");

    // Verify columns
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'franchises' 
      AND TABLE_SCHEMA = ?
      AND COLUMN_NAME IN ('invoice_prefix', 'arn', 'service_area', 'account_name')
      ORDER BY ORDINAL_POSITION
    `,
      [env.mysql.database]
    );

    console.log("Verification - New columns:");
    columns.forEach((col) => {
      console.log(`  ✓ ${col.COLUMN_NAME}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

addMissingColumns();
