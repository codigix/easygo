import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function checkDatabase() {
  try {
    console.log("\n=== CHECKING AWS DATABASE ===");
    console.log("Host:", process.env.MYSQL_HOST);
    console.log("Database:", process.env.MYSQL_DATABASE);
    console.log("User:", process.env.MYSQL_USER);

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log("✅ Connected to database\n");

    // Check if table exists
    const [tables] = await connection.query(
      "SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courier_company_rates'",
      [process.env.MYSQL_DATABASE]
    );

    console.log("Table Status:");
    if (tables.length > 0) {
      console.log("✅ courier_company_rates table EXISTS on AWS");

      // Show table structure
      const [columns] = await connection.query(
        "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courier_company_rates'",
        [process.env.MYSQL_DATABASE]
      );
      console.log("\nTable Structure:");
      columns.forEach((col) => {
        console.log("  - " + col.COLUMN_NAME + ": " + col.COLUMN_TYPE);
      });
    } else {
      console.log("❌ courier_company_rates table MISSING on AWS");
    }

    // Check migration status
    const [migrations] = await connection.query(
      "SELECT batch, name FROM knex_migrations ORDER BY batch DESC LIMIT 10"
    );

    console.log("\nRecent migrations:");
    migrations.forEach((m) => {
      console.log("  Batch " + m.batch + ": " + m.name);
    });

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

checkDatabase();
