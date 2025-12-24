import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("📊 Checking shipments table status enum...\n");

  const [columns] = await db.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'shipments' AND COLUMN_NAME = 'status' AND TABLE_SCHEMA = 'frbilling'`
  );

  if (columns.length > 0) {
    const columnType = columns[0].COLUMN_TYPE;
    console.log(`Status column type: ${columnType}\n`);
    
    const hasHubInScan = columnType.includes("HUB_IN_SCAN");
    const hasHubOutScan = columnType.includes("HUB_OUT_SCAN");
    
    console.log(`✓ HUB_IN_SCAN status: ${hasHubInScan ? "EXISTS" : "MISSING"}`);
    console.log(`✓ HUB_OUT_SCAN status: ${hasHubOutScan ? "EXISTS" : "MISSING"}`);
    
    if (hasHubInScan && hasHubOutScan) {
      console.log("\n✅ All statuses configured correctly!");
    }
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
