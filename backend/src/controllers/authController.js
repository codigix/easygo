import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../config/database.js";
import { env } from "../config/env.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const db = getDb();

    // Find user with franchise information
    let [users] = await db.query(
      `SELECT u.*, f.franchise_code, f.franchise_name, f.subscription_status, f.subscription_end_date
       FROM users u
       JOIN franchises f ON u.franchise_id = f.id
       WHERE u.username = ? AND u.status = 'active'`,
      [username]
    );

    console.log(`[LOGIN] Username: ${username}, Found users: ${users.length}`);

    // Auto-create demo user if not found (only for demo credentials)
    if (users.length === 0 && username === "admin" && password === "password123") {
      console.log(`[LOGIN] 🔧 Demo user not found, auto-creating...`);
      
      try {
        // Check if franchise exists
        const [franchises] = await db.query(
          "SELECT id FROM franchises WHERE franchise_code = 'FR001' LIMIT 1"
        );
        
        let franchiseId;
        
        if (franchises.length === 0) {
          // Create franchise if doesn't exist
          const [franchiseResult] = await db.query(
            `INSERT INTO franchises (
              franchise_code, franchise_name, owner_name, email, phone, 
              address, city, state, pincode, gst_number, status, subscription_status
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
          franchiseId = franchiseResult.insertId;
          console.log(`[LOGIN] 📝 Created franchise with ID: ${franchiseId}`);
        } else {
          franchiseId = franchises[0].id;
          console.log(`[LOGIN] ✅ Using existing franchise with ID: ${franchiseId}`);
        }
        
        // Hash the password and create user
        const hashedPassword = await bcrypt.hash("password123", 10);
        await db.query(
          `INSERT INTO users (
            franchise_id, username, email, password, full_name, 
            phone, role, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            franchiseId,
            "admin",
            "admin@frbilling.com",
            hashedPassword,
            "Admin User",
            "+91 9876543210",
            "admin",
            "active",
          ]
        );
        console.log(`[LOGIN] ✅ Created demo user: admin`);
        
        // Fetch the newly created user
        [users] = await db.query(
          `SELECT u.*, f.franchise_code, f.franchise_name, f.subscription_status, f.subscription_end_date
           FROM users u
           JOIN franchises f ON u.franchise_id = f.id
           WHERE u.username = ? AND u.status = 'active'`,
          [username]
        );
      } catch (autoCreateError) {
        console.error(`[LOGIN] ❌ Failed to auto-create demo user:`, autoCreateError.message);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    if (users.length === 0) {
      console.log(`[LOGIN] ❌ User not found or inactive: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log(`[LOGIN] Password valid: ${isValidPassword}, User: ${username}`);

    if (!isValidPassword) {
      console.log(`[LOGIN] ❌ Invalid password for user: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        franchiseId: user.franchise_id,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiration }
    );

    // Remove password from response
    delete user.password;

    console.log(`[LOGIN] ✅ Successful login for user: ${username}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password;

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user information",
    });
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
};
