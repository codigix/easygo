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

async function resetPassword() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    console.log("🔄 Resetting admin password...\n");
    
    const hashedPassword = await bcryptjs.hash("password123", 10);
    console.log("🔐 Generated password hash");
    
    const [result] = await connection.execute(
      `UPDATE users SET password = ? WHERE username = 'admin'`,
      [hashedPassword]
    );
    
    console.log(`✅ Updated ${result.affectedRows} user(s)`);
    console.log("\n🎉 Password reset complete!");
    console.log("   Username: admin");
    console.log("   Password: password123");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

resetPassword();
