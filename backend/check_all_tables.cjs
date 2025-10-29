const knex = require("knex");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const config = {
  client: "mysql2",
  connection: {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Backend",
    database: process.env.MYSQL_DATABASE || "frbilling",
  },
};

const db = knex(config);

async function checkTables() {
  try {
    // Get all tables
    const tables = await db.raw("SHOW TABLES");
    const tableNames = tables[0].map((t) => Object.values(t)[0]);

    console.log("📋 All Tables in Database:\n");
    tableNames.forEach((t) => console.log("  • " + t));

    // Check for rate-related tables
    const rateTables = tableNames.filter((t) =>
      t.toLowerCase().includes("rate")
    );
    console.log("\n🔍 Rate-related Tables:");
    if (rateTables.length === 0) {
      console.log("  ❌ None found");
    } else {
      rateTables.forEach((t) => console.log("  ✅ " + t));
    }

    // Check for rate_master
    if (tableNames.includes("rate_master")) {
      const count = await db("rate_master").count("* as count").first();
      console.log("\n📊 rate_master table has", count.count, "records");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

checkTables();
