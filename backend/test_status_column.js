import("mysql2/promise").then(async (mysql) => {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "booking_system",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const connection = await pool.getConnection();
    const query =
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invoices' AND COLUMN_NAME = 'status'";
    const [columns] = await connection.query(query);
    connection.release();

    if (columns.length > 0) {
      console.log("✅ Status column exists in invoices table");
      process.exit(0);
    } else {
      console.log("❌ Status column NOT found in invoices table");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error checking column:", error.message);
    process.exit(1);
  }
});
