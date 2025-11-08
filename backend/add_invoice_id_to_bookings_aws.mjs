import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

async function addInvoiceIdColumn() {
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

    console.log("Checking for invoice_id column...\n");

    if (!existingColumns.has("invoice_id")) {
      console.log("✨ Adding column: invoice_id");
      try {
        await connection.query(
          "ALTER TABLE bookings ADD COLUMN invoice_id INT UNSIGNED NULL COMMENT 'Reference to invoice when booking is billed' AFTER id"
        );
        console.log("   ✅ Successfully added\n");
        console.log(
          "🎉 Done! Invoice generation should now work without errors!"
        );
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log("   ⏭️  Column already exists\n");
        } else {
          throw err;
        }
      }
    } else {
      console.log("⏭️  Column invoice_id already exists\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addInvoiceIdColumn();
