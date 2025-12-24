import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

try {
  console.log("📋 Applied migrations:\n");
  const [migrations] = await db.query(
    "SELECT id, name, batch FROM knex_migrations ORDER BY id DESC LIMIT 15"
  );

  migrations.forEach((m) => {
    console.log(`[Batch ${m.batch}] ${m.name}`);
  });

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
