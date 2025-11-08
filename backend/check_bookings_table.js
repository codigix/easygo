import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkBookingsTable() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Backend",
    database: process.env.MYSQL_DATABASE || "frbilling",
  });

  const [rows] = await conn.query("DESCRIBE bookings");
  console.log("Current bookings table structure:");
  console.table(rows);

  await conn.end();
}

checkBookingsTable().catch(console.error);
