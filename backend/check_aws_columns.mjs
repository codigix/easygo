import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    const [columns] = await connection.query("DESCRIBE bookings");
    const columnNames = columns.map((c) => c.Field);
    console.log("Existing columns in bookings table:");
    columnNames.forEach((c) => console.log("  - " + c));

    const requiredColumns = [
      "tax_amount",
      "fuel_amount",
      "gst_percent",
      "fuel_percent",
    ];
    const missing = requiredColumns.filter((c) => !columnNames.includes(c));

    if (missing.length > 0) {
      console.log("\n❌ MISSING COLUMNS:");
      missing.forEach((c) => console.log("  - " + c));
      return false;
    } else {
      console.log("\n✅ All required columns exist!");
      return true;
    }
  } finally {
    await connection.end();
  }
}

checkColumns().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
