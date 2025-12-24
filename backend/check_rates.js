import { connectDatabase, getDb } from "./src/config/database.js";

await connectDatabase();
const db = getDb();

console.log("\n📊 Checking franchises...");
const [franchises] = await db.query("SELECT id, franchise_code, franchise_name FROM franchises LIMIT 5");
console.table(franchises);

console.log("\n📊 Checking rate_master entries...");
const [rates] = await db.query("SELECT id, franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, status FROM rate_master LIMIT 10");
console.table(rates);

console.log("\n📊 Checking rate_master count by franchise...");
const [counts] = await db.query("SELECT franchise_id, COUNT(*) as count FROM rate_master GROUP BY franchise_id");
console.table(counts);

process.exit(0);
