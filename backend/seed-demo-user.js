import mysql from "mysql2/promise";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
};

async function seedDemoUser() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    console.log("🔍 Checking if franchise and user exist...");
    
    const [franchises] = await connection.execute(
      "SELECT id FROM franchises WHERE franchise_code = 'FR001'"
    );
    
    let franchiseId;
    
    if (franchises.length === 0) {
      console.log("📝 Creating demo franchise...");
      const [result] = await connection.execute(
        `INSERT INTO franchises (
          franchise_code, franchise_name, owner_name, email, phone, 
          address, city, state, pincode, gst_number, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "FR001",
          "Demo Franchise",
          "Demo Owner",
          "demo@example.com",
          "+91 9876543210",
          "123 Demo Street",
          "Mumbai",
          "Maharashtra",
          "400001",
          "27AAAAA0000A1Z5",
          "active",
        ]
      );
      franchiseId = result.insertId;
      console.log(`✅ Franchise created with ID: ${franchiseId}`);
    } else {
      franchiseId = franchises[0].id;
      console.log(`✅ Franchise already exists with ID: ${franchiseId}`);
    }
    
    const [users] = await connection.execute(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    
    if (users.length === 0) {
      console.log("📝 Creating demo admin user...");
      const hashedPassword = await bcryptjs.hash("password123", 10);
      
      await connection.execute(
        `INSERT INTO users (
          franchise_id, username, email, password, full_name, 
          phone, role, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          franchiseId,
          "admin",
          "admin@example.com",
          hashedPassword,
          "Admin User",
          "+91 9876543210",
          "admin",
          "active",
        ]
      );
      console.log("✅ Demo admin user created!");
      console.log("   Username: admin");
      console.log("   Password: password123");
    } else {
      console.log("✅ Demo admin user already exists!");
    }
    
    console.log("\n✨ Demo user seeding complete!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

seedDemoUser();
