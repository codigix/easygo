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

    console.log("📋 Migrations in KNEX TABLE:");
    const [fromTable] = await connection.execute(
      "SELECT name FROM knex_migrations ORDER BY batch, name"
    );

    const appliedMigrations = new Set(fromTable.map((m) => m.name));
    fromTable.forEach((m) => console.log(`  ✅ ${m.name}`));

    console.log("\n📋 Migration files that NEED to be applied:");
    const migrationNames = [
      "20240101000021_create_courier_company_rates_table.cjs",
      "20240101000022_add_invoice_and_details_to_franchises.cjs",
      "20240101000023_restore_status_to_invoices.cjs",
    ];

    const needsApply = migrationNames.filter(
      (name) => !appliedMigrations.has(name)
    );
    if (needsApply.length > 0) {
      needsApply.forEach((m) => console.log(`  ❌ ${m}`));
      console.log(`\n⚠️  Found ${needsApply.length} unapplied migrations!`);
    } else {
      console.log("  ✅ All migrations are applied");
    }

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
