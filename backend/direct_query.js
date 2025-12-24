import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("🔍 Querying database directly...\n");

  // Check manifests table
  const [manifests] = await db.query("SELECT 1 FROM manifests LIMIT 1");
  console.log("✓ manifests table EXISTS and is accessible");

  // Count rows
  const [count] = await db.query("SELECT COUNT(*) as cnt FROM manifests");
  console.log(`  Rows: ${count[0].cnt}`);

  // List all expected tables
  const tables = ["manifests", "manifest_shipments", "hub_scans", "rto_manifests", "shipment_hub_tracking"];
  
  console.log("\nChecking all hub operations tables:");
  for (const table of tables) {
    try {
      await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`  ✓ ${table}`);
    } catch (err) {
      console.log(`  ✗ ${table} - ${err.message.split(" - ")[0]}`);
    }
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
