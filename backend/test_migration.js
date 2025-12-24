import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const knexConfig = require("./knexfile.cjs");
const knexInstance = knex(knexConfig);

console.log("🧪 Testing migration...\n");

try {
  // Check if manifests table exists
  const [exists] = await knexInstance.raw(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = 'manifests' AND TABLE_SCHEMA = 'frbilling'
  `);

  if (exists.length > 0) {
    console.log("✓ manifests table exists");
  } else {
    console.log("✗ manifests table DOES NOT exist");
    console.log("\n🔨 Creating table...");

    await knexInstance.schema.createTable("test_manifests", (table) => {
      table.increments("id").primary();
      table.integer("franchise_id").unsigned().notNullable();
      table.timestamps(true, true);
    });

    console.log("✓ test_manifests created successfully");
    await knexInstance.schema.dropTable("test_manifests");
    console.log("✓ test_manifests dropped successfully");
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
} finally {
  await knexInstance.destroy();
}
