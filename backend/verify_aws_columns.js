import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

async function checkColumns() {
  let connection;
  try {
    console.log("Connecting to AWS database...");
    console.log(`  Host: ${env.mysql.host}`);
    console.log(`  Database: ${env.mysql.database}`);

    connection = await mysql.createConnection({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
    });

    console.log("✅ Connected to AWS database!\n");

    // Check if columns exist
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'franchises' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `,
      [env.mysql.database]
    );

    console.log("Franchises table columns:");
    const columnNames = columns.map((c) => c.COLUMN_NAME);
    columnNames.forEach((name) => {
      console.log(`  ✓ ${name}`);
    });

    console.log("\n📋 Checking required columns:");
    const required = ["invoice_prefix", "arn", "service_area", "account_name"];
    const missing = required.filter((col) => !columnNames.includes(col));

    if (missing.length === 0) {
      console.log("  ✅ All required columns exist!");
    } else {
      console.log("  ❌ Missing columns:");
      missing.forEach((col) => console.log(`    - ${col}`));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkColumns();
