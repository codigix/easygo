# Live Login Troubleshooting Guide

## Quick Diagnostic Steps

### Step 1: Check Backend Health

1. Open your browser and go to:
   ```
   https://easygo.codigix.co/api/auth/health
   ```

2. You should see:
   ```json
   { "success": true, "message": "Backend is running" }
   ```

3. If you see an error, the **backend is not running or not accessible**.

### Step 2: Check Database Users

1. Go to:
   ```
   https://easygo.codigix.co/api/auth/debug/users
   ```

2. You should see a list of users created by the setup script. Example:
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "franchise_id": 3,
         "username": "admin",
         "email": "admin@frbilling.com",
         "full_name": "Admin User",
         "role": "admin",
         "status": "active"
       }
     ]
   }
   ```

3. If you don't see any users, the **setup script didn't work or database is wrong**.

### Step 3: Check Browser Console

1. Go to https://easygo.codigix.co/
2. Open browser developer tools (F12 or Ctrl+Shift+I)
3. Go to Console tab
4. Try to login with admin/password123
5. Look for error messages

**Common errors:**

- **"CORS policy"** → Backend CORS configuration issue
- **"404 Not Found"** → API endpoint doesn't exist
- **"ERR_EMPTY_RESPONSE"** → Backend crashed
- **"timeout"** → Backend not responding

### Step 4: Check Backend Logs

SSH into your live server and check:

```bash
# View recent logs
tail -100 backend/logs/error.log
tail -100 backend/logs/combined.log

# Or if using PM2
pm2 logs easygo-backend

# Or if using systemd
journalctl -u easygo-backend -n 100
```

Look for `[LOGIN]` messages to see what's happening during login attempts.

---

## Common Issues & Solutions

### Issue 1: Backend Not Responding

**Symptoms:** "Connection refused" or "timeout"

**Solutions:**

```bash
# Check if backend is running
ps aux | grep node

# Check if port 5000 is listening
netstat -tlnp | grep 5000
# or on Windows
netstat -ano | findstr :5000

# Restart backend
pm2 restart easygo-backend
# or
systemctl restart easygo-backend
```

### Issue 2: Database Connection Error

**Symptoms:** `/api/auth/debug/users` returns error

**Solutions:**

1. Check `.env` file has correct database credentials:
   ```bash
   cat .env | grep MYSQL
   ```

2. Test database connection:
   ```bash
   mysql -h your-host -u your-user -p your-password your-database -e "SELECT 1;"
   ```

3. Verify database exists:
   ```bash
   mysql -h your-host -u your-user -p -e "SHOW DATABASES;" | grep frbilling
   ```

### Issue 3: No Users Found in Database

**Symptoms:** `/api/auth/debug/users` returns empty array

**Solutions:**

```bash
# Go to backend directory
cd /path/to/easygo/backend

# Update .env with correct database credentials
nano .env

# Run the setup script again
node setup-demo-users.js

# If setup script fails, manually check what's in database
mysql -h your-host -u your-user -p your-database -e "SELECT COUNT(*) FROM users;"
```

### Issue 4: CORS Error

**Symptoms:** Browser console shows CORS policy error

**Solutions:**

1. Check backend `.env`:
   ```bash
   cat .env | grep CORS_ORIGIN
   ```
   Should be:
   ```
   CORS_ORIGIN=https://easygo.codigix.co
   ```

2. Restart backend after changing:
   ```bash
   pm2 restart easygo-backend
   ```

### Issue 5: Invalid Credentials Despite Setup Script Success

**Symptoms:** Setup script says ✅ but login still fails

**Solutions:**

1. Verify password hash matches:
   ```bash
   node check-demo-user.js
   ```

2. Check user status is 'active':
   ```bash
   mysql -h your-host -u your-user -p your-database -e "SELECT username, status FROM users;"
   ```

3. Check user's franchise exists and is active:
   ```bash
   mysql -h your-host -u your-user -p your-database -e "
   SELECT u.username, u.status, f.franchise_name, f.status 
   FROM users u 
   JOIN franchises f ON u.franchise_id = f.id;
   "
   ```

---

## Advanced Debugging

### Enable Debug Mode

1. Edit backend `.env`:
   ```
   NODE_ENV=development
   ```

2. Restart backend

3. Check logs for detailed error messages

### Test Login via cURL

```bash
curl -X POST https://easygo.codigix.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

Should return:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

### Check Frontend Configuration

1. Build frontend with production config:
   ```bash
   cd frontend
   npm run build
   ```

2. Check the build output contains correct API URL:
   ```bash
   grep "easygo.codigix.co/api" dist/assets/*.js
   ```

---

## Complete Setup from Scratch

If nothing works, do a complete reset:

```bash
# 1. SSH to server
ssh user@easygo.codigix.co

# 2. Stop backend
pm2 stop easygo-backend

# 3. Update .env with correct database info
cd /path/to/backend
nano .env

# 4. Run setup script
node setup-demo-users.js

# 5. Verify it worked
node check-demo-user.js

# 6. Restart backend
pm2 restart easygo-backend

# 7. Check backend is running
curl https://easygo.codigix.co/api/auth/health

# 8. Check users exist
curl https://easygo.codigix.co/api/auth/debug/users

# 9. Try login
curl -X POST https://easygo.codigix.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

---

## Validation Checklist

Before testing login, verify:

- [ ] Backend is running (`pm2 list` or `systemctl status easygo-backend`)
- [ ] Backend responds to health check (`/api/auth/health` returns success)
- [ ] Database users exist (`/api/auth/debug/users` shows users)
- [ ] User "admin" status is "active"
- [ ] User's franchise status is "active"
- [ ] Frontend `.env.production` has correct API URL
- [ ] CORS_ORIGIN in backend `.env` matches frontend domain
- [ ] No database connection errors in logs
- [ ] No CORS errors in browser console

---

## Still Not Working?

Collect this information and share:

1. Output of `/api/auth/debug/users`
2. Output of `node check-demo-user.js`
3. Last 50 lines of backend logs
4. Error messages from browser console (F12)
5. Output of `curl https://easygo.codigix.co/api/auth/health`
6. Output of `pm2 list` or `systemctl status easygo-backend`

This will help diagnose the exact issue.
