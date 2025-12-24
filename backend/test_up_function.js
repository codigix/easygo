import knex from "knex";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const knexConfig = require("./knexfile.cjs");
const migration = require("./migrations/20240101000029_create_hub_operations_tables.cjs");
const db = knex(knexConfig);

try {
  console.log("🧪 Testing migration up function...\n");

  console.log("📝 Calling migration.up()...");
  await migration.up(db);
  console.log("✓ Migration up() completed");

  // Verify tables exist
  const tables = ["manifests", "manifest_shipments", "hub_scans", "rto_manifests", "shipment_hub_tracking"];
  for (const table of tables) {
    const [result] = await db.raw(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ? AND TABLE_SCHEMA = 'frbilling'",
      [table]
    );
    console.log(result.length > 0 ? `✓ ${table} exists` : `✗ ${table} NOT FOUND`);
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await db.destroy();
}
