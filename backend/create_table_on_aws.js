import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function createTable() {
  let connection;

  try {
    console.log("\n=== CREATING TABLE ON AWS ===\n");

    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log("Connected to AWS database");
    console.log("Host:", process.env.MYSQL_HOST);
    console.log("Database:", process.env.MYSQL_DATABASE);

    // First check if table exists
    const [existingTables] = await connection.query(
      "SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courier_company_rates'",
      [process.env.MYSQL_DATABASE]
    );

    if (existingTables.length > 0) {
      console.log("\n✅ Table courier_company_rates ALREADY EXISTS\n");
      await connection.end();
      return;
    }

    console.log("\n⏳ Creating table courier_company_rates...\n");

    // Create the table
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS courier_company_rates (
      id int unsigned NOT NULL AUTO_INCREMENT,
      franchise_id int unsigned NOT NULL,
      company_id int unsigned NOT NULL,
      courier_type varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      row_name varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      sub_type varchar(50) COLLATE utf8mb4_unicode_ci,
      slab_type enum('Slab 2','Slab 3','Slab 4') COLLATE utf8mb4_unicode_ci NOT NULL,
      rates json NOT NULL,
      status enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY courier_company_rates_franchise_id_company_id_courier_type_index (franchise_id,company_id,courier_type),
      KEY courier_company_rates_courier_type_row_name_index (courier_type,row_name),
      CONSTRAINT courier_company_rates_company_id_foreign FOREIGN KEY (company_id) REFERENCES company_rate_master (id) ON DELETE CASCADE,
      CONSTRAINT courier_company_rates_franchise_id_foreign FOREIGN KEY (franchise_id) REFERENCES franchises (id) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(createTableSQL);
    console.log("✅ Table courier_company_rates created successfully\n");

    // Verify table was created
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courier_company_rates' ORDER BY ORDINAL_POSITION",
      [process.env.MYSQL_DATABASE]
    );

    console.log("Table Structure:");
    columns.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    console.log(
      "\n✅ All done! The courier_company_rates table is ready to use.\n"
    );

    await connection.end();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nFull error:", error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createTable();
