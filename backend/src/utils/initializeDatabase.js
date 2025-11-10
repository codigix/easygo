import bcrypt from "bcryptjs";
import { getDb } from "../config/database.js";

export const initializeDatabase = async () => {
  try {
    console.log("🔍 Checking database initialization...");
    const db = getDb();

    // Check if any franchises exist
    const [franchises] = await db.query(
      "SELECT COUNT(*) as count FROM franchises"
    );

    if (franchises[0].count === 0) {
      console.log("📝 No franchises found. Creating demo franchise...");

      const [result] = await db.query(
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

      console.log(`✅ Demo franchise created (ID: ${result.insertId})`);
    } else {
      console.log(
        `✅ ${franchises[0].count} franchise(s) already exist in database`
      );
    }

    // Get first franchise ID (should be the demo one if we just created it)
    const [franchiseResult] = await db.query(
      "SELECT id FROM franchises ORDER BY id ASC LIMIT 1"
    );
    const franchiseId = franchiseResult[0].id;

    // Define demo users to create
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

    let createdCount = 0;

    for (const demoUser of demoUsers) {
      const [existingUsers] = await db.query(
        "SELECT id FROM users WHERE username = ?",
        [demoUser.username]
      );

      if (existingUsers.length === 0) {
        const hashedPassword = await bcrypt.hash(demoUser.password, 10);

        await db.query(
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

        console.log(`✅ Created demo user: ${demoUser.username}`);
        createdCount++;
      } else {
        console.log(
          `⏭️  Demo user already exists: ${demoUser.username} (skipping)`
        );
      }
    }

    if (createdCount > 0) {
      console.log(
        `\n🎉 Auto-initialized database with ${createdCount} demo user(s)`
      );
      console.log("🔑 Demo credentials:");
      demoUsers.forEach((user) => {
        if (createdCount > 0) {
          console.log(`   Username: ${user.username} | Password: password123`);
        }
      });
    } else {
      console.log("✅ All demo users already exist in database");
    }

    console.log("✨ Database initialization complete!\n");
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
    // Don't stop the server if initialization fails
    // This allows the server to run even if there's an issue
  }
};
