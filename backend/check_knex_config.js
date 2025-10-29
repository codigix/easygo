import knex from "knex";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Load the knexfile config
const config = {
  client: "mysql2",
  connection: {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Backend",
    database: process.env.MYSQL_DATABASE || "frbilling",
  },
  migrations: {
    tableName: "knex_migrations",
    directory: path.join(__dirname, "migrations"),
  },
};

console.log("\n=== KNEX CONFIGURATION ===");
console.log("Host:", config.connection.host);
console.log("Port:", config.connection.port);
console.log("User:", config.connection.user);
console.log("Database:", config.connection.database);
console.log("Migrations directory:", config.migrations.directory);

// Check files in migrations directory
import fs from "fs";
const migrationFiles = fs
  .readdirSync(config.migrations.directory)
  .filter((f) => f.endsWith(".cjs"));
console.log("\nAvailable migrations:", migrationFiles.length);
const latestMigration = migrationFiles[migrationFiles.length - 1];
console.log("Latest migration file:", latestMigration);

async function checkStatus() {
  const knexInstance = knex(config);

  try {
    console.log("\n=== CHECKING MIGRATION STATUS ===");
    const completed = await knexInstance.migrate.currentBatch();
    console.log("Current batch on database:", completed);

    const migrationList = await knexInstance("knex_migrations")
      .select("*")
      .orderBy("batch", "desc")
      .limit(5);
    console.log("\nLast 5 migrations on database:");
    migrationList.forEach((m) => {
      console.log("  " + m.name + " (Batch " + m.batch + ")");
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await knexInstance.destroy();
  }
}

checkStatus();
