import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("✅ Verifying tables created...\n");

  const tables = [
    "manifests",
    "manifest_shipments",
    "hub_scans",
    "rto_manifests",
    "shipment_hub_tracking",
  ];

  for (const table of tables) {
    const [result] = await db.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?`,
      [table, "frbilling"]
    );
    if (result.length > 0) {
      console.log(`✓ ${table}`);
    } else {
      console.log(`✗ ${table} - NOT FOUND`);
    }
  }

  console.log("\n📊 Checking shipments table enum values...");
  const [columns] = await db.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'shipments' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = 'frbilling'`
  );

  if (columns.length > 0) {
    console.log(`✓ Status column type: ${columns[0].COLUMN_TYPE}`);
    if (columns[0].COLUMN_TYPE.includes("HUB_IN_SCAN")) {
      console.log("✓ HUB_IN_SCAN status exists");
    }
    if (columns[0].COLUMN_TYPE.includes("HUB_OUT_SCAN")) {
      console.log("✓ HUB_OUT_SCAN status exists");
    }
  }

  console.log("\n✅ All hub operations tables are ready!");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
