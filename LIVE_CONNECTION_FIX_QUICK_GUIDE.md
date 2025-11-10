# Live Connection Fix - Quick Action Guide

## The Issue

Your live backend **cannot connect to the live database**, so login fails.

This is NOT a user/password issue - it's a **database connection configuration issue**.

---

## Action Plan (Do This NOW)

### Step 1: Upload Test Script to Live Server

Upload `test-db-connection.js` to your backend directory:

```bash
# From local machine
scp backend/test-db-connection.js user@easygo.codigix.co:/path/to/backend/
```

Or upload via FTP/hosting control panel.

### Step 2: SSH to Live Server

```bash
ssh user@easygo.codigix.co
cd /path/to/easygo/backend
```

### Step 3: Run Connection Test

```bash
node test-db-connection.js
```

### Step 4A: If It Shows ✅ Connection Successful

```
✅ Connection successful!
✅ MySQL Version: 5.7.xxx
✅ Current Database: frbilling
📊 Checking tables: Found 15 tables
```

Then:
1. Delete the test script: `rm test-db-connection.js`
2. Restart backend: `pm2 restart easygo-backend`
3. Try login: admin / password123
4. **Should work now!**

### Step 4B: If It Shows ❌ Connection FAILED

Look at the error message. Common ones:

**Error: "ECONNREFUSED"**
→ MySQL is not running
```bash
systemctl start mysql
# Then test again
```

**Error: "ENOTFOUND"**
→ Wrong hostname
```bash
# Check what you have now:
cat .env | grep MYSQL_HOST
# Update it with correct hostname/IP
```

**Error: "ER_ACCESS_DENIED_FOR_USER"**
→ Wrong username or password
```bash
# Check credentials:
cat .env | grep MYSQL_USER
cat .env | grep MYSQL_PASSWORD
# Update if wrong
```

**Error: "ER_BAD_DB_ERROR"**
→ Database doesn't exist
```bash
# Create it:
mysql -u root -p -e "CREATE DATABASE frbilling CHARACTER SET utf8mb4;"
# Then run migrations:
npm run migrate
# Then test again
```

### Step 5: Update .env If Needed

```bash
# Edit .env
nano .env

# Make sure these are CORRECT:
MYSQL_HOST=your-actual-database-host
MYSQL_PORT=3306
MYSQL_USER=your-actual-database-user
MYSQL_PASSWORD=your-actual-database-password
MYSQL_DATABASE=frbilling

# Save: Ctrl+X, Y, Enter
```

### Step 6: Test Again After Changes

```bash
node test-db-connection.js
```

Should show ✅ Connection successful

---

## Finding Correct Database Credentials

If you don't know your live database credentials, check:

1. **Your Hosting Provider's Control Panel**
   - cPanel → Databases
   - Plesk → Databases
   - AWS RDS Console
   - Google Cloud SQL Console
   - Azure Database
   
2. **Email from Hosting Provider**
   - Often has default credentials
   
3. **Server Administration Tools**
   - phpMyAdmin (if available)
   - MySQL Workbench
   - Command line: `mysql -u root -p`

4. **Previous Deployment Notes**
   - Check if you documented it

---

## Quick Diagnostic Commands

Run these on your live server:

```bash
# Check if MySQL is running
systemctl status mysql
# or
service mysql status

# Check MySQL is listening on port 3306
netstat -tlnp | grep 3306

# Test connection manually
mysql -h localhost -u root -p -e "SELECT 1;"

# Check .env is correct
cat .env | grep MYSQL

# Check if database exists
mysql -u root -p -e "SHOW DATABASES;" | grep frbilling

# Check if tables exist
mysql -u root -p frbilling -e "SHOW TABLES;"
```

---

## After Connection Works

Once `node test-db-connection.js` shows ✅ Connection successful:

1. **Restart backend:**
   ```bash
   pm2 restart easygo-backend
   # or
   systemctl restart easygo-backend
   ```

2. **Try login:**
   - URL: https://easygo.codigix.co/
   - Username: `admin`
   - Password: `password123`
   - **Should auto-create user and login!**

3. **Check backend logs:**
   ```bash
   tail -20 logs/easygo-backend.log | grep LOGIN
   ```
   Should show:
   ```
   [LOGIN] ✅ Created demo user: admin
   [LOGIN] ✅ Successful login for user: admin
   ```

---

## Most Common Live Issues & Quick Fixes

### "Connection refused"
```bash
systemctl start mysql
# Wait 5 seconds
node test-db-connection.js
```

### "Unknown host"
```bash
# Update .env with correct host (try localhost first):
sed -i 's/MYSQL_HOST=.*/MYSQL_HOST=localhost/' .env
node test-db-connection.js
```

### "Unknown database 'frbilling'"
```bash
# Create database:
mysql -u root -p -e "CREATE DATABASE frbilling CHARACTER SET utf8mb4;"
npm run migrate
node test-db-connection.js
```

### "Access denied for user"
```bash
# Try with root user:
sed -i 's/MYSQL_USER=.*/MYSQL_USER=root/' .env
# Update password if needed
# Then test:
node test-db-connection.js
```

---

## Clean Up After Success

Once everything works:

```bash
# Remove test script
rm test-db-connection.js

# Remove other temporary files if you have them
rm check-demo-user.js
rm reset-admin-password.js
rm seed-demo-user.js
rm setup-demo-users.js
```

---

## Verification Checklist

Before declaring success:

- [ ] `node test-db-connection.js` shows ✅ Connection successful
- [ ] Backend is running: `pm2 list` shows easygo-backend ONLINE
- [ ] Can access API: `curl https://easygo.codigix.co/api/auth/health` returns success
- [ ] Login works: admin / password123 → Logged in successfully
- [ ] Backend logs show: `[LOGIN] ✅ Successful login for user: admin`

---

## If Still Not Working

Collect and share:

1. Output of:
   ```bash
   node test-db-connection.js 2>&1
   ```

2. Your .env (hide password):
   ```bash
   cat .env | sed 's/PASSWORD=.*/PASSWORD=HIDDEN/'
   ```

3. Backend status:
   ```bash
   pm2 list
   pm2 logs easygo-backend | tail -50
   ```

4. Database status:
   ```bash
   systemctl status mysql
   mysql -e "SELECT 1;"
   ```

This info will help diagnose the exact issue!

---

## Key Point

**This is a connection issue, NOT a user issue!**

Once the backend can connect to the database → Everything else works automatically!

The auto-creation feature I added will handle demo user creation once you fix the connection. ✅
