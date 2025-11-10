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

async function setupDemoUsers() {
  let connection;
  try {
    console.log("🚀 Setting up demo users and franchises...\n");
    console.log("📍 Database config:");
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}\n`);
    
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database\n");
    
    // Check if demo franchise exists
    const [franchises] = await connection.execute(
      "SELECT id FROM franchises WHERE franchise_code = 'FR001' LIMIT 1"
    );
    
    let franchiseId;
    
    if (franchises.length === 0) {
      console.log("📝 Creating demo franchise...");
      const [result] = await connection.execute(
        `INSERT INTO franchises (
          franchise_code, franchise_name, owner_name, email, phone, 
          address, city, state, pincode, gst_number, status,
          subscription_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "FR001",
          "Demo Franchise",
          "Demo Owner",
          "demo@frbilling.com",
          "+91 9876543210",
          "123 Demo Street, Mumbai",
          "Mumbai",
          "Maharashtra",
          "400001",
          "27AAAAA0000A1Z5",
          "active",
          "active",
        ]
      );
      franchiseId = result.insertId;
      console.log(`✅ Franchise created (ID: ${franchiseId})\n`);
    } else {
      franchiseId = franchises[0].id;
      console.log(`✅ Franchise already exists (ID: ${franchiseId})\n`);
    }
    
    // Demo users to create
    const demoUsers = [
      {
        username: "admin",
        email: "admin@frbilling.com",
        password: "password123",
        full_name: "Admin User",
        role: "admin",
      },
      {
        username: "cashier",
        email: "cashier@frbilling.com",
        password: "password123",
        full_name: "Cashier User",
        role: "cashier",
      },
      {
        username: "staff",
        email: "staff@frbilling.com",
        password: "password123",
        full_name: "Staff User",
        role: "staff",
      },
    ];
    
    for (const demoUser of demoUsers) {
      const [existingUsers] = await connection.execute(
        "SELECT id FROM users WHERE username = ? LIMIT 1",
        [demoUser.username]
      );
      
      if (existingUsers.length === 0) {
        console.log(`📝 Creating user: ${demoUser.username}`);
        const hashedPassword = await bcryptjs.hash(demoUser.password, 10);
        
        await connection.execute(
          `INSERT INTO users (
            franchise_id, username, email, password, full_name, 
            phone, role, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            franchiseId,
            demoUser.username,
            demoUser.email,
            hashedPassword,
            demoUser.full_name,
            "+91 9876543210",
            demoUser.role,
            "active",
          ]
        );
        console.log(`   ✅ Created`);
      } else {
        console.log(`⏭️  Skipping ${demoUser.username} (already exists)`);
      }
    }
    
    console.log("\n✨ Setup complete!\n");
    console.log("🔑 Demo credentials:\n");
    demoUsers.forEach(user => {
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}\n`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDemoUsers();
