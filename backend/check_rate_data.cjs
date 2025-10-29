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

async function checkRates() {
  try {
    console.log("🔍 Checking RATE_MASTER table...\n");

    const rateMasters = await db("rate_master").select("*");
    console.log(`Found ${rateMasters.length} rate master records:\n`);
    rateMasters.forEach((r, i) => {
      console.log(`[${i + 1}] ID: ${r.id}`);
      console.log(JSON.stringify(r, null, 2));
      console.log("---\n");
    });

    console.log("\n---\n");
    console.log("🔍 Checking COMPANY_RATE_MASTER table structure...\n");

    const companyRates = await db("company_rate_master")
      .select(
        "id",
        "company_name",
        "company_id",
        "gst_no",
        "fuel_surcharge_percent",
        "royalty_charges_percent"
      )
      .limit(3);

    console.log(`Sample of ${companyRates.length} company rate records:\n`);
    companyRates.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.company_name} (ID: ${r.company_id})`);
      console.log(`   - Fuel Surcharge: ${r.fuel_surcharge_percent}%`);
      console.log(`   - Royalty: ${r.royalty_charges_percent}%`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

checkRates();
