import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Backend",
  database: "frbilling",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function addTestRate() {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `INSERT INTO rate_master 
       (franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = NOW()`,
      [
        2,
        "412501",
        "*",
        "EXPRESS",
        0,
        30,
        250,
        18,
        5,
        "active",
      ]
    );
    console.log("✓ Test rate added successfully");
    
    await connection.query(
      `INSERT INTO rate_master 
       (franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = NOW()`,
      [2, "412501", "*", "STANDARD", 0, 30, 150, 18, 3, "active"]
    );
    console.log("✓ Standard rate added");
    
    await connection.query(
      `INSERT INTO rate_master 
       (franchise_id, from_pincode, to_pincode, service_type, weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = NOW()`,
      [2, "412501", "*", "ECONOMY", 0, 30, 100, 18, 2, "active"]
    );
    console.log("✓ Economy rate added");
    
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

addTestRate();
