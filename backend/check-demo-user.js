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

async function checkUser() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    console.log("🔍 Checking demo admin user...\n");
    
    const [users] = await connection.execute(
      `SELECT id, franchise_id, username, email, full_name, role, status, password 
       FROM users WHERE username = 'admin'`
    );
    
    if (users.length === 0) {
      console.log("❌ User not found!");
      return;
    }
    
    const user = users[0];
    console.log("✅ User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.full_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Password Hash: ${user.password.substring(0, 50)}...`);
    
    console.log("\n🔐 Testing password hash:");
    const isPasswordValid = await bcryptjs.compare("password123", user.password);
    console.log(`   password123 matches: ${isPasswordValid ? "✅ YES" : "❌ NO"}`);
    
    console.log("\n📋 Checking franchise:");
    const [franchises] = await connection.execute(
      `SELECT id, franchise_code, franchise_name, status FROM franchises WHERE id = ?`,
      [user.franchise_id]
    );
    
    if (franchises.length > 0) {
      const f = franchises[0];
      console.log(`   ID: ${f.id}`);
      console.log(`   Code: ${f.franchise_code}`);
      console.log(`   Name: ${f.franchise_name}`);
      console.log(`   Status: ${f.status}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkUser();
