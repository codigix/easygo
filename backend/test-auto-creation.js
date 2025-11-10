import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
};

async function testAutoCreation() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    console.log("🧪 Testing Auto-Creation Logic\n");
    
    // Check current state
    console.log("📋 Current database state:");
    const [users] = await connection.execute(
      "SELECT id, username, email, role FROM users"
    );
    console.log(`   Users: ${users.length} found`);
    users.forEach(u => console.log(`   - ${u.username} (${u.role})`));
    
    const [franchises] = await connection.execute(
      "SELECT id, franchise_code, franchise_name FROM franchises"
    );
    console.log(`   Franchises: ${franchises.length} found`);
    franchises.forEach(f => console.log(`   - ${f.franchise_code}: ${f.franchise_name}`));
    
    console.log("\n✅ Database is ready for auto-creation testing");
    console.log("\n🚀 To test auto-creation:");
    console.log("   1. Delete 'admin' user from database:");
    console.log("      DELETE FROM users WHERE username = 'admin';");
    console.log("   2. Start backend: npm run dev");
    console.log("   3. Try login with: admin / password123");
    console.log("   4. Check backend logs for [LOGIN] messages");
    console.log("   5. User should auto-create on first login attempt");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

testAutoCreation();
