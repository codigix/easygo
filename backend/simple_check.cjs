const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../.env" });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    const [result] = await conn.execute("DESCRIBE invoices");
    console.log("Invoices table structure:");
    result.forEach((col) => {
      const marker = col.Field === "status" ? "✅" : "  ";
      console.log(`${marker} ${col.Field} - ${col.Type}`);
    });

    const statusCol = result.find((c) => c.Field === "status");
    console.log(`\n${statusCol ? "✅ STATUS EXISTS" : "❌ STATUS MISSING"}`);

    await conn.end();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
