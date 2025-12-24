import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("🔧 Fixing migration...\n");

  // Delete the failed migration record
  await db.query(
    `DELETE FROM knex_migrations WHERE name = '20240101000029_create_hub_operations_tables.cjs'`
  );
  console.log("✓ Removed migration record");

  // Drop any partially created tables
  const tables = [
    "shipment_hub_tracking",
    "rto_manifests",
    "hub_scans",
    "manifest_shipments",
    "manifests",
  ];

  for (const table of tables) {
    try {
      await db.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✓ Dropped ${table}`);
    } catch (err) {
      console.log(`- ${table} doesn't exist`);
    }
  }

  console.log("\n✅ Ready to re-run migration. Run: npm run migrate");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
