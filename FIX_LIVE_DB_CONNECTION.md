# Fix Live Database Connection Issues

## The Real Problem

Your login fails because **the backend can't connect to the live database** - not because of missing users!

When backend tries to query the database to check if user exists, the connection fails, so login fails.

---

## Step 1: Verify Database Credentials

On your live server, check what database settings you're using:

```bash
# Go to backend directory
cd /path/to/easygo/backend

# Show .env file
cat .env | grep MYSQL
```

You should see:
```
MYSQL_HOST=xxx
MYSQL_PORT=xxxx
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
MYSQL_DATABASE=xxx
```

---

## Step 2: Test Connection

Run the connection test script:

```bash
node test-db-connection.js
```

### If It Shows ✅ Connection Successful

Your database connection works! Then auto-creation feature will work too.

### If It Shows ❌ Connection FAILED

Read the error details provided and follow the troubleshooting steps.

---

## Step 3: Find Correct Database Credentials

### If You Have SSH Access to Database Server

```bash
# Find MySQL config
cat /etc/mysql/my.cnf | grep port
cat /etc/mysql/my.cnf | grep socket

# Or try to connect locally
mysql -u root -p
# Then run: SELECT USER(), DATABASE();
```

### If Database is Remote/Managed (AWS RDS, etc.)

Check your hosting provider's control panel:
- **Host**: Usually something like `db.example.com` or `your-server.rds.amazonaws.com`
- **Port**: Usually `3306` (or different if configured)
- **User**: Your database user (might be `admin`, `root`, etc.)
- **Password**: Your database password
- **Database**: Your database name

### If You Don't Know Credentials

Ask your hosting provider or check:
- Hosting control panel (cPanel, Plesk, etc.)
- Welcome email from hosting provider
- Original setup documentation

---

## Step 4: Fix .env Configuration

Update your `.env` file with correct credentials:

```bash
# SSH into server
ssh user@your-server.com

# Edit .env (using nano)
cd /path/to/easygo/backend
nano .env

# Update these values:
MYSQL_HOST=your-correct-host
MYSQL_PORT=3306
MYSQL_USER=your-correct-user
MYSQL_PASSWORD=your-correct-password
MYSQL_DATABASE=your-correct-database
```

### Common Examples

**Local Server (same machine):**
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=frbilling
```

**Remote Server (AWS RDS):**
```
MYSQL_HOST=mydb.123456789.us-east-1.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=YourP@ssw0rd
MYSQL_DATABASE=frbilling
```

**Shared Hosting (cPanel):**
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=username_frbilling
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=username_frbilling
```

### Save and Exit (nano editor)
```
Ctrl + X
Y
Enter
```

---

## Step 5: Verify Database Exists

Make sure the database is actually created:

```bash
# Connect to MySQL
mysql -h your-host -u your-user -p your-database

# If it asks for password, enter your-password

# You should see: mysql>

# If error like "Unknown database 'frbilling'"
# Then the database doesn't exist, create it:

mysql -h your-host -u your-user -p -e "CREATE DATABASE frbilling CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## Step 6: Run Migrations (If Database is New)

If you just created the database, run migrations:

```bash
cd /path/to/easygo/backend

# Run migrations to create tables
npm run migrate

# You should see:
# Batch 1 run: 25 migrations
```

---

## Step 7: Test Connection Again

```bash
node test-db-connection.js
```

Should show:
```
✅ Connection successful!
✅ MySQL Version: 5.7.xxx
✅ Current Database: frbilling
📊 Checking tables:
   Found 15 tables:
   ✅ bookings
   ✅ expenses
   ✅ franchises
   ... (all tables listed)
```

---

## Step 8: Restart Backend and Test Login

```bash
# Restart backend
pm2 restart easygo-backend

# Or
systemctl restart easygo-backend

# Or manually
pkill -f "node src/server.js"
npm start &
```

Then try login:
- URL: https://easygo.codigix.co/
- Username: `admin`
- Password: `password123`
- Should auto-create user and login successfully! ✅

---

## Common Connection Issues & Fixes

### Issue 1: "ECONNREFUSED - Connection refused"

**Cause**: MySQL not running or wrong port

**Fix**:
```bash
# Check if MySQL is running
systemctl status mysql
# or
service mysql status

# Start MySQL if stopped
systemctl start mysql
# or
service mysql start

# Verify it's listening on port 3306
netstat -tlnp | grep 3306
# or on Windows
netstat -ano | findstr :3306
```

### Issue 2: "ENOTFOUND - Host not found"

**Cause**: Hostname is wrong or DNS not resolving

**Fix**:
```bash
# Test hostname resolution
ping your-host
nslookup your-host
# or
dig your-host

# If doesn't resolve, use IP address instead
# Find IP: ping mysql.example.com
# Then use IP in MYSQL_HOST
```

### Issue 3: "ER_ACCESS_DENIED_FOR_USER"

**Cause**: Wrong username or password

**Fix**:
```bash
# Test credentials manually
mysql -h your-host -u your-user -p

# When prompted, enter password carefully
# If it works, credentials are correct
```

### Issue 4: "ER_BAD_DB_ERROR - Unknown database"

**Cause**: Database doesn't exist

**Fix**:
```bash
# Create database
mysql -h your-host -u your-user -p -e "CREATE DATABASE frbilling CHARACTER SET utf8mb4;"

# Then run migrations
npm run migrate
```

### Issue 5: "ETIMEDOUT - Connection timeout"

**Cause**: Firewall blocking, server too slow, or network issue

**Fix**:
```bash
# Check firewall allows MySQL port
# On Linux:
sudo ufw allow 3306

# Check server is reachable
ping your-host
telnet your-host 3306

# If firewall is blocking, ask hosting provider to open port 3306
# Or use SSH tunnel if available
```

### Issue 6: Wrong .env file location

**Cause**: .env file not found or in wrong place

**Fix**:
```bash
# Make sure .env is in backend root directory
ls -la /path/to/easygo/backend/.env

# Should show:
# -rw-r--r-- 1 user group 1234 Nov 10 12:34 .env

# If not there, create it:
cp .env.example .env
# Then edit with correct values
```

---

## Complete Diagnostic Checklist

Before trying login again, verify all of these:

```
□ .env file exists: ls -la .env
□ .env has all MYSQL_* variables set
□ MYSQL_HOST is correct (test: ping $MYSQL_HOST)
□ MYSQL_PORT is correct (test: telnet $MYSQL_HOST $MYSQL_PORT)
□ MYSQL_USER has access (test: mysql -u $MYSQL_USER -p)
□ MYSQL_PASSWORD is correct (try connecting with it)
□ MYSQL_DATABASE exists (test: mysql -e "SHOW DATABASES;" | grep $MYSQL_DATABASE)
□ Database tables exist (test: npm run migrate)
□ Backend can connect (test: node test-db-connection.js → ✅ Connection successful)
□ Backend is running (test: pm2 list or systemctl status)
□ Frontend can reach backend (test: curl https://easygo.codigix.co/api/auth/health)
□ Login works (test: admin / password123)
```

---

## Quick Fix Summary

1. **SSH to server**: `ssh user@your-server.com`
2. **Check current config**: `cat backend/.env | grep MYSQL`
3. **Test connection**: `node backend/test-db-connection.js`
4. **If fails, fix .env**: `nano backend/.env` → Update credentials
5. **Test again**: `node backend/test-db-connection.js`
6. **Restart backend**: `pm2 restart easygo-backend`
7. **Try login**: admin / password123

---

## Still Not Working?

Share this information:

1. Output of: `node test-db-connection.js`
2. Your .env file (hide password): `cat backend/.env | sed 's/PASSWORD=.*/PASSWORD=***/'`
3. Backend logs: `tail -50 logs/easygo-backend.log`
4. MySQL service status: `systemctl status mysql`
5. Firewall status: `sudo ufw status`

This will help identify the exact issue!

---

## Key Point

**Once database connection works** → Auto-creation feature kicks in → Demo user created automatically → Login works! ✅

The connection is the foundation everything depends on!
