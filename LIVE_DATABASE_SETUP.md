# Live Database Setup Guide

## Problem
The live database doesn't have demo users seeded, causing login failures.

## Solution

### Step 1: Update Your Live `.env` File

Make sure your production `.env` has the correct database credentials for your live database:

```bash
MYSQL_HOST=your-live-server.com
MYSQL_PORT=3306
MYSQL_USER=your_live_user
MYSQL_PASSWORD=your_live_password
MYSQL_DATABASE=your_live_database
```

### Step 2: Run the Setup Script on Live Server

Upload `setup-demo-users.js` to your live server and run:

```bash
# SSH into your live server
ssh user@your-live-server.com

# Navigate to backend directory
cd /path/to/easygo/backend

# Run the setup script
node setup-demo-users.js
```

### Step 3: Verify Setup

You should see output like:
```
🚀 Setting up demo users and franchises...

📍 Database config:
   Host: your-live-server.com
   Database: your_live_database
   User: your_live_user

✅ Connected to database

📝 Creating demo franchise...
✅ Franchise created (ID: 1)

📝 Creating user: admin
   ✅ Created
📝 Creating user: cashier
   ✅ Created
📝 Creating user: staff
   ✅ Created

✨ Setup complete!

🔑 Demo credentials:

   Username: admin
   Password: password123
   Role: admin

   Username: cashier
   Password: password123
   Role: cashier

   Username: staff
   Password: password123
   Role: staff
```

### Step 4: Test Login

Now you can login with:
- **Username:** `admin`
- **Password:** `password123`

## Alternative: Manual SQL Approach

If you prefer to run SQL manually on your live server:

```sql
-- Create franchise
INSERT INTO franchises (
  franchise_code, franchise_name, owner_name, email, phone, 
  address, city, state, pincode, gst_number, status, subscription_status
) VALUES (
  'FR001', 'Demo Franchise', 'Demo Owner', 'demo@frbilling.com', 
  '+91 9876543210', '123 Demo Street, Mumbai', 'Mumbai', 'Maharashtra', 
  '400001', '27AAAAA0000A1Z5', 'active', 'active'
);

-- Get the franchise ID (use the result from above)
SET @franchiseId = 1;

-- Hash: password123 with bcryptjs salt 10
-- Use this pre-hashed value or generate your own with bcryptjs
SET @passwordHash = '$2a$10$idtm5hqkSAx6nJiL81gzmOymNCWYLOI98H6VTnE0yoL...'; -- Replace with actual hash

-- Create admin user
INSERT INTO users (
  franchise_id, username, email, password, full_name, phone, role, status
) VALUES (
  @franchiseId, 'admin', 'admin@frbilling.com', @passwordHash, 
  'Admin User', '+91 9876543210', 'admin', 'active'
);
```

## Troubleshooting

### Error: "Connection refused"
- Check if your live database is accessible
- Verify `.env` credentials are correct
- Check firewall/security groups allow access

### Error: "Unknown database"
- Database name in `.env` is incorrect
- Database hasn't been created yet on live server

### Error: "Access denied for user"
- Username/password in `.env` is incorrect
- User doesn't have permission on that database

### Still getting "Invalid credentials"?
Run this check script on the live server:

```bash
# Upload check-demo-user.js to server first
node check-demo-user.js
```

This will show you exactly what user exists and if the password matches.

## Production Best Practices

1. **Change Demo Passwords**: After setup, change demo user passwords to strong ones
2. **Create Real Users**: Create actual user accounts for your team
3. **Remove Seed Scripts**: Delete `setup-demo-users.js` from production after use
4. **Enable Backups**: Ensure regular database backups are configured
5. **Monitor Logins**: Keep track of login attempts and user access

## Creating Additional Users

To create additional users, you can:

### Option 1: Use the Frontend
1. Login as admin
2. Navigate to Settings or User Management
3. Create new user with desired role

### Option 2: Use SQL
```sql
-- Hash password first with bcryptjs
INSERT INTO users (
  franchise_id, username, email, password, full_name, phone, role, status
) VALUES (
  1, 'username', 'email@example.com', 'hashed_password', 
  'Full Name', '+91 9876543210', 'staff', 'active'
);
```

### Option 3: Use Node.js Script
Create a script similar to `setup-demo-users.js` for your specific needs.

---

**Need help?** Check your error logs:
```bash
# Backend logs
tail -f backend/logs/error.log

# Database logs
tail -f /var/log/mysql/error.log
```
