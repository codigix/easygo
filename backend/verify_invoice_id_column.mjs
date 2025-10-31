import mysql from "mysql2/promise";
import { env } from "./src/config/env.js";

const connection = await mysql.createConnection({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
});

try {
  const [columns] = await connection.query("DESCRIBE bookings");
  const relevant = columns
    .filter((c) => ["id", "invoice_id", "status", "amount"].includes(c.Field))
    .map((c) => ({
      Field: c.Field,
      Type: c.Type,
      Null: c.Null,
      Default: c.Default,
    }));

  console.log("✅ Verification of bookings table:\n");
  console.table(relevant);
} finally {
  await connection.end();
}
