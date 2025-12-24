import knex from "knex";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const knexConfig = require("./knexfile.cjs");
const db = knex(knexConfig);

try {
  console.log("🧪 Running migration manually...\n");

  // Check current applied migrations
  const [migs] = await db.raw("SELECT name, batch FROM knex_migrations WHERE name LIKE '20240101000029%'");
  console.log("Migration record:", migs[0]);

  // Try to manually execute the migration  
  console.log("\n📝 Creating manifests table...");
  await db.schema.createTable("manifests_test", (t) => {
    t.increments("id");
    t.integer("franchise_id").unsigned().notNullable();
    t.timestamps();
  });
  console.log("✓ manifests_test created");

  const [check] = await db.raw("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'manifests_test'");
  console.log("Verify:", check.length > 0 ? "EXISTS" : "NOT FOUND");

  await db.schema.dropTable("manifests_test");
  console.log("✓ Cleaned up test table");

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
} finally {
  await db.destroy();
}
