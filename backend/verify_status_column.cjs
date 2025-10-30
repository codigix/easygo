const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../.env" });

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'invoices' AND TABLE_SCHEMA = ?
    `,
      [process.env.DB_NAME]
    );

    console.log("✅ Invoices table columns:");
    columns.forEach((col) => {
      if (col.COLUMN_NAME === "status") {
        console.log(`  ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      } else {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      }
    });

    const hasStatus = columns.some((c) => c.COLUMN_NAME === "status");
    if (!hasStatus) {
      console.log("\n❌ ERROR: status column is MISSING!");
    } else {
      console.log("\n✅ STATUS COLUMN FOUND - Migration applied successfully!");
    }

    await connection.end();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
