const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../.env" });

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "Backend",
      database: process.env.MYSQL_DATABASE || "frbilling",
    });

    console.log("📋 Checking applied migrations:");
    const [migrations] = await connection.execute(
      "SELECT * FROM knex_migrations ORDER BY batch DESC, migration_time DESC"
    );

    migrations.forEach((m) => {
      console.log(`  - ${m.name} (batch: ${m.batch})`);
    });

    console.log("\n📊 Checking invoices table columns:");
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'invoices' AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `,
      [process.env.MYSQL_DATABASE || "frbilling"]
    );

    columns.forEach((col) => {
      const marker = col.COLUMN_NAME === "status" ? "✅" : "  ";
      console.log(`  ${marker} ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });

    const hasStatus = columns.some((c) => c.COLUMN_NAME === "status");
    console.log(
      `\n${hasStatus ? "✅" : "❌"} Status column ${
        hasStatus ? "EXISTS" : "MISSING"
      }`
    );

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
