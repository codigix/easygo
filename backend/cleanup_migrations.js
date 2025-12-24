import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("🔧 Cleaning up partial migrations...");
  
  // Drop tables in correct order (reverse of creation)
  const tablesToDrop = [
    "shipment_hub_tracking",
    "rto_manifests",
    "hub_scans",
    "manifest_shipments",
    "manifests",
  ];

  for (const table of tablesToDrop) {
    try {
      await db.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✓ Dropped ${table}`);
    } catch (err) {
      console.log(`⚠ Could not drop ${table}: ${err.message}`);
    }
  }

  // Remove migration records
  await db.query(
    `DELETE FROM knex_migrations WHERE name LIKE '20240101000029%' OR name LIKE '20240101000030%'`
  );
  console.log("✓ Cleaned migration records");

  console.log("\n✅ Cleanup complete. You can now run 'npm run migrate' again");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
