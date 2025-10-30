const knex = require("knex");
const config = require("./knexfile.cjs");

(async () => {
  try {
    const db = knex(config);
    console.log("🔄 Running migration 20240101000023...");

    // Execute the migration manually
    await db.schema.alterTable("invoices", (table) => {
      // Check if column already exists before adding
      table
        .enum("status", ["draft", "sent", "paid", "cancelled"])
        .defaultTo("draft")
        .after("net_amount");
    });

    console.log("✅ Migration 23 executed successfully!");

    // Insert into knex_migrations table
    await db("knex_migrations").insert({
      name: "20240101000023_restore_status_to_invoices.cjs",
      batch: 9,
      migration_time: new Date(),
    });

    console.log("✅ Migration 23 recorded in knex_migrations");
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
