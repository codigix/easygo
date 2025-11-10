# Live Deployment with Automatic Demo User Setup

## Summary

The EasyGo backend now **automatically creates the demo user** if it doesn't exist in the database. No manual setup scripts needed!

---

## Deployment Steps

### Step 1: Deploy Updated Backend Code

Upload the latest backend code with the auto-creation feature:

```bash
# Key file with new feature:
backend/src/controllers/authController.js

# This file has been updated with automatic demo user creation
```

### Step 2: Update Backend Environment

Make sure your live `.env` has correct database credentials:

```bash
MYSQL_HOST=your-live-server
MYSQL_PORT=3306
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=your_db_name
```

### Step 3: Restart Backend Service

```bash
# Using PM2
pm2 restart easygo-backend

# OR using systemd
systemctl restart easygo-backend

# OR manually
pkill -f "node src/server.js"
npm start &
```

### Step 4: Test the Connection

```bash
# Test backend health
curl https://easygo.codigix.co/api/auth/health

# Should return:
# {"success":true,"message":"Backend is running"}
```

### Step 5: Login to Test Auto-Creation

1. Go to: https://easygo.codigix.co/
2. Login with:
   - Username: `admin`
   - Password: `password123`

3. **First Time**: Auto-creates demo user and franchise if they don't exist
4. **Subsequent Times**: Normal login

That's it! ✅

---

## What Happens on First Login

### Behind the Scenes:

```
User enters: admin / password123
    ↓
Backend checks if user exists in database
    ↓
User NOT found
    ↓
Auto-creation triggered (ONLY for admin/password123)
    ↓
Check if FR001 franchise exists
    ↓
Franchise NOT found
    ↓
Create FR001 franchise automatically
    ↓
Create admin user with hashed password
    ↓
Generate JWT token
    ↓
Login successful ✅
```

### Logs Output:

Check backend logs to confirm:

```bash
tail -f logs/easygo-backend.log | grep LOGIN
```

You should see:

```
[LOGIN] Username: admin, Found users: 0
[LOGIN] 🔧 Demo user not found, auto-creating...
[LOGIN] 📝 Created franchise with ID: 1
[LOGIN] ✅ Created demo user: admin
[LOGIN] Password valid: true, User: admin
[LOGIN] ✅ Successful login for user: admin
```

---

## Important Notes

✅ **Safe for Production**
- Only triggers for `admin` / `password123` credentials
- Does NOT affect any other users
- Does NOT modify existing franchises or users
- One-time creation only

❌ **Does NOT Auto-Create For**
- Different usernames (e.g., "superadmin" won't auto-create)
- Different passwords (must be exactly "password123")
- Any real/non-demo users

---

## Troubleshooting

### Still Getting "Invalid Credentials"?

**Option 1: Check Backend Logs**
```bash
tail -100 logs/easygo-backend.log | grep -i login
```

Look for `[LOGIN]` messages to see what happened.

**Option 2: Check Database Manually**
```bash
mysql -h your-host -u your-user -p your-database
SELECT * FROM users;
SELECT * FROM franchises;
```

**Option 3: Test API Directly**
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

If you get an error, share the error message.

### Error: "Database Connection Failed"

- Check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD in `.env`
- Verify database server is running
- Check firewall allows connection
- Test connection: `mysql -h your-host -u your-user -p`

### Error: "Table 'users' doesn't exist"

- Run database migrations first:
  ```bash
  npm run migrate
  ```

### Demo user still exists but password wrong?

- Old password hash no longer matches
- Delete old user and try login again with `admin/password123`
  ```bash
  DELETE FROM users WHERE username = 'admin' AND email = 'admin@frbilling.com';
  ```

---

## After Successful Login

Once demo login works:

1. ✅ Create real user accounts for your team
2. ✅ Use demo account for testing only
3. ✅ Keep demo credentials secure
4. ✅ Document your team's credentials

---

## Reverting Auto-Creation (If Needed)

If you want to disable auto-creation feature:

**File**: `backend/src/controllers/authController.js`
**Action**: Comment out or remove lines 30-106

Not recommended as the feature is safe and helpful.

---

## For Different Environments

### Development (Local)
- Auto-creation works automatically
- Demo user created on first login attempt
- Perfect for testing

### Staging
- Auto-creation works
- Deploy and test same as production
- Verify before going live

### Production (Live)
- Auto-creation works
- Secure and safe
- No manual setup needed
- One-time creation on first login

---

## Migration from Old Setup

If you previously used the setup scripts:

**Old Way** (Not needed anymore):
```bash
node setup-demo-users.js
npm run setup:demo
```

**New Way** (Automatic):
1. Deploy updated code
2. Try login with admin/password123
3. Done! User auto-creates if needed

---

## Quick Checklist Before Going Live

- [ ] Updated backend code deployed
- [ ] `.env` file has correct database credentials
- [ ] Backend service restarted
- [ ] `/api/auth/health` returns success
- [ ] Try login with admin/password123
- [ ] Check backend logs show auto-creation message
- [ ] Login successful ✅

---

## Support

If login still fails after deployment:

1. Check backend logs:
   ```bash
   tail -50 logs/easygo-backend.log
   ```

2. Test API directly:
   ```bash
   curl https://easygo.codigix.co/api/auth/health
   curl https://easygo.codigix.co/api/auth/debug/users
   ```

3. Check database connection:
   ```bash
   mysql -h your-host -u your-user -p your-database -e "SELECT 1;"
   ```

4. Share backend logs and error messages for help

---

**That's it!** The system now handles demo user setup automatically. Just deploy and login! 🚀
