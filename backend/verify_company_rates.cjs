#!/usr/bin/env node
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

async function verify() {
  try {
    console.log("🔍 Checking company_rate_master table...\n");

    const records = await db("company_rate_master")
      .select("*")
      .orderBy("id", "desc")
      .limit(20);

    if (records.length === 0) {
      console.log("❌ No records found in company_rate_master table");
      return;
    }

    console.log(`✅ Found ${records.length} records:\n`);
    records.forEach((record, idx) => {
      console.log(`Record ${idx + 1}:`);
      console.log(JSON.stringify(record, null, 2));
      console.log("---");
    });

    // Summary by company
    console.log("\n📊 Summary by Company:");
    const summary = await db("company_rate_master")
      .select("company_name")
      .count("* as count")
      .groupBy("company_name");

    summary.forEach((row) => {
      console.log(`  ${row.company_name}: ${row.count} rate slabs`);
    });
  } catch (error) {
    console.error("❌ Database Error:", error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

verify();
