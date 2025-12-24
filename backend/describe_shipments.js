import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("📋 Describing shipments table...\n");

  const [columns] = await db.query(
    "DESCRIBE shipments"
  );

  console.log("Columns:");
  columns.forEach((col) => {
    if (col.Field === "status") {
      console.log(`  >>> ${col.Field}: ${col.Type}`);
    } else {
      console.log(`  ${col.Field}: ${col.Type}`);
    }
  });

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
