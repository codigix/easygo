import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
});

const [rows] = await conn.query(
  `SELECT id, load_number, status, franchise_id, total_shipments, total_weight 
   FROM load_plans ORDER BY created_at DESC LIMIT 10`
);
console.table(rows);
await conn.end();
