import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const envPath = path.join(process.cwd(), "backend", ".env");
dotenv.config({ path: envPath });

const idArg = process.argv[2];
if (!idArg) {
  console.error("Usage: node scripts/query_company_by_id.mjs <id>");
  process.exit(1);
}

const id = parseInt(idArg, 10);
if (Number.isNaN(id)) {
  console.error("Invalid id");
  process.exit(1);
}

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
};

const run = async () => {
  const conn = await mysql.createConnection(config);
  const [rows] = await conn.query(
    "SELECT id, franchise_id, company_id, company_name FROM company_rate_master WHERE id = ?",
    [id]
  );
  console.table(rows);
  await conn.end();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
