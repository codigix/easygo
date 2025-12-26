import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const franchiseId = process.argv[2] ? Number(process.argv[2]) : null;
if (!Number.isFinite(franchiseId)) {
  console.error("Usage: node scripts/query_users_by_franchise.mjs <franchiseId>");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
});

const [rows] = await conn.query(
  `SELECT id, username, role FROM users WHERE franchise_id = ? ORDER BY id ASC`,
  [franchiseId]
);
console.table(rows);
await conn.end();
