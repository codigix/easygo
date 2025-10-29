import "dotenv/config";
import mysql from "mysql2/promise";

async function checkColumns() {
  let connection;
  try {
    console.log("Database Config:");
    console.log(`  Host: ${process.env.MYSQL_HOST}`);
    console.log(`  User: ${process.env.MYSQL_USER}`);
    console.log(`  Database: ${process.env.MYSQL_DATABASE}`);

    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'franchises' 
      AND TABLE_SCHEMA = 'frbilling'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("\n✅ Connected! Franchises table columns:");
    columns.forEach((col) => {
      console.log(`  - ${col.COLUMN_NAME}`);
    });

    const hasInvoicePrefix = columns.some(
      (col) => col.COLUMN_NAME === "invoice_prefix"
    );
    const hasArn = columns.some((col) => col.COLUMN_NAME === "arn");
    const hasServiceArea = columns.some(
      (col) => col.COLUMN_NAME === "service_area"
    );
    const hasAccountName = columns.some(
      (col) => col.COLUMN_NAME === "account_name"
    );

    console.log("\nRequired columns status:");
    console.log(`  invoice_prefix: ${hasInvoicePrefix ? "✅" : "❌ MISSING"}`);
    console.log(`  arn: ${hasArn ? "✅" : "❌ MISSING"}`);
    console.log(`  service_area: ${hasServiceArea ? "✅" : "❌ MISSING"}`);
    console.log(`  account_name: ${hasAccountName ? "✅" : "❌ MISSING"}`);

    // Check migrations table
    console.log("\nChecking migration status...");
    const [migrations] = await connection.query(`
      SELECT migration, batch 
      FROM knex_migrations 
      ORDER BY batch DESC, migration DESC 
      LIMIT 5
    `);

    console.log("Latest migrations:");
    migrations.forEach((m) => {
      console.log(`  - ${m.migration} (batch ${m.batch})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkColumns();
