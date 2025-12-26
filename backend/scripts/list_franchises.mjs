import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const envPath = path.join(process.cwd(), "backend", ".env");
dotenv.config({ path: envPath });

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
});

try {
  const [rows] = await connection.query(
    "SELECT id, franchise_code, franchise_name FROM franchises ORDER BY id ASC"
  );
  console.table(rows);
} finally {
  await connection.end();
}
