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

    console.log("🔄 Adding status column to invoices table...");

    await conn.execute(`
      ALTER TABLE invoices 
      ADD COLUMN status ENUM('draft', 'sent', 'paid', 'cancelled') 
      DEFAULT 'draft' 
      AFTER net_amount
    `);

    console.log("✅ Status column added successfully!");

    // Verify
    const [cols] = await conn.execute("DESCRIBE invoices");
    const hasStatus = cols.some((c) => c.Field === "status");
    console.log(
      `✅ Verification: status column ${hasStatus ? "EXISTS" : "MISSING"}`
    );

    // Record in knex_migrations
    const [existing] = await conn.execute(
      "SELECT * FROM knex_migrations WHERE name = ?",
      ["20240101000023_restore_status_to_invoices.cjs"]
    );

    if (existing.length === 0) {
      await conn.execute(
        "INSERT INTO knex_migrations (name, batch, migration_time) VALUES (?, ?, ?)",
        ["20240101000023_restore_status_to_invoices.cjs", 9, new Date()]
      );
      console.log("✅ Migration recorded in knex_migrations");
    } else {
      console.log("⚠️  Migration already recorded");
    }

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
