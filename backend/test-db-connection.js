import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Backend",
  database: process.env.MYSQL_DATABASE || "frbilling",
};

async function testConnection() {
  console.log("🔍 Database Connection Diagnostic Tool\n");
  console.log("📍 Configuration from .env:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password ? "***SET***" : "NOT SET"}\n`);

  try {
    console.log("🔄 Attempting connection...");
    const connection = await mysql.createConnection(config);
    console.log("✅ Connection successful!\n");

    // Test basic query
    console.log("📋 Testing database queries:");
    
    const [result] = await connection.query("SELECT VERSION() as version");
    console.log(`✅ MySQL Version: ${result[0].version}`);

    const [dbResult] = await connection.query("SELECT DATABASE() as db");
    console.log(`✅ Current Database: ${dbResult[0].db}\n`);

    // Check tables
    console.log("📊 Checking tables:");
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
      [config.database]
    );
    
    const tableNames = tables.map(t => t.TABLE_NAME).sort();
    console.log(`   Found ${tableNames.length} tables:`);
    tableNames.forEach(name => console.log(`   ✅ ${name}`));

    // Check users
    console.log("\n👥 Users in database:");
    const [users] = await connection.query(
      "SELECT id, username, email, role, status FROM users LIMIT 10"
    );
    
    if (users.length === 0) {
      console.log("   ⚠️  No users found (will auto-create on first login)");
    } else {
      users.forEach(u => {
        console.log(`   ✅ ${u.username} (${u.role}) - ${u.status}`);
      });
    }

    console.log("\n✨ Connection test PASSED!\n");
    console.log("ℹ️  Backend should be able to connect to this database.");

    await connection.end();

  } catch (error) {
    console.error("\n❌ Connection FAILED!\n");
    console.error("Error Details:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}\n`);

    // Provide specific solutions
    console.error("🔧 Troubleshooting:");
    
    if (error.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("   • Connection lost after established - server might be restarting");
      console.error("   • Check: Is MySQL service running?");
    } else if (error.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
      console.error("   • Fatal protocol error");
      console.error("   • Check: Credentials are correct? Port is right?");
    } else if (error.code === "PROTOCOL_ENQUEUE_AFTER_DESTROY") {
      console.error("   • Connection was destroyed");
      console.error("   • Check: Is backend process still running?");
    } else if (error.code === "ER_ACCESS_DENIED_FOR_USER") {
      console.error("   • Access denied - wrong username or password");
      console.error("   • Check: MYSQL_USER and MYSQL_PASSWORD in .env are correct");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("   • Database doesn't exist");
      console.error("   • Check: MYSQL_DATABASE exists on server");
      console.error("   • Fix: Create database or correct MYSQL_DATABASE in .env");
    } else if (error.code === "ECONNREFUSED") {
      console.error("   • Connection refused - server not responding");
      console.error("   • Check: Is MySQL running on that host/port?");
      console.error("   • Check: Firewall allows connection?");
      console.error("   • Check: MYSQL_HOST is correct?");
    } else if (error.code === "ENOTFOUND") {
      console.error("   • Host not found - hostname doesn't resolve");
      console.error("   • Check: MYSQL_HOST is a valid hostname/IP");
      console.error("   • Check: DNS resolution works");
      console.error("   • Fix: Use IP address instead of hostname if DNS fails");
    } else if (error.code === "ETIMEDOUT") {
      console.error("   • Connection timeout - server too slow or unreachable");
      console.error("   • Check: Network connectivity");
      console.error("   • Check: Firewall/security groups");
      console.error("   • Check: Is server IP/hostname correct?");
    }
    
    console.error("\n📝 Update .env with correct values:");
    console.error("   MYSQL_HOST=your-server");
    console.error("   MYSQL_PORT=3306");
    console.error("   MYSQL_USER=your-user");
    console.error("   MYSQL_PASSWORD=your-password");
    console.error("   MYSQL_DATABASE=your-database");
    console.error("\n   Then run this test again.\n");
  }
}

testConnection();
