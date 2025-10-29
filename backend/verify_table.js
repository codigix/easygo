import mysql from "mysql2/promise";

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "Backend",
      database: "frbilling",
    });

    const [tables] = await conn.query(
      'SHOW TABLES LIKE "courier_company_rates"'
    );
    if (tables.length > 0) {
      console.log("✅ Table courier_company_rates EXISTS");
      const [columns] = await conn.query("DESCRIBE courier_company_rates");
      console.log("\nTable structure:");
      columns.forEach((col) => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    } else {
      console.log("❌ Table courier_company_rates NOT found");
    }

    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
