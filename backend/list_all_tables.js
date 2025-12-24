import knex from "knex";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const config = require("./knexfile.cjs");
const db = knex(config);

try {
  const [tables] = await db.raw(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'frbilling' ORDER BY TABLE_NAME"
  );
  
  console.log("All tables in frbilling:\n");
  tables.forEach((t) => console.log(`  - ${t.TABLE_NAME}`));
  
  console.log("\n\nHub operations tables:");
  const hubTables = tables.filter((t) =>
    t.TABLE_NAME.includes("manifest") || 
    t.TABLE_NAME.includes("hub_") || 
    t.TABLE_NAME.includes("rto_") || 
    t.TABLE_NAME.includes("shipment_hub")
  );
  
  if (hubTables.length === 0) {
    console.log("  NONE FOUND");
  } else {
    hubTables.forEach((t) => console.log(`  ✓ ${t.TABLE_NAME}`));
  }

  process.exit(0);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
} finally {
  await db.destroy();
}
