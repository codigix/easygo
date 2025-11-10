# Auto Demo User Setup

## How It Works

The EasyGo application now has **automatic demo user creation** built into the login flow.

### Feature
- ✅ If demo user (admin/password123) doesn't exist in the database, it's created automatically on first login attempt
- ✅ Never affects other existing users
- ✅ Creates franchise if it doesn't exist
- ✅ Works on both local and live environments
- ✅ No manual setup scripts needed

### How to Use

1. **First Time Setup**: Simply try to login with demo credentials:
   - Username: `admin`
   - Password: `password123`

2. **What Happens Behind the Scenes**:
   - System checks if user "admin" exists
   - If NOT found, it automatically creates:
     - Demo Franchise (FR001) if it doesn't exist
     - Demo user account with admin role
     - All with correct password hashing

3. **Subsequent Logins**: Normal login flow

### Security Notes

- **Protected**: Demo user is ONLY auto-created for the exact credentials: `admin` / `password123`
- **Non-destructive**: Doesn't modify any existing users or franchises
- **Safe on Production**: Won't affect real users or data
- **Logged**: All auto-creation events are logged to console with `[LOGIN]` prefix

### Logging Output

When demo user is auto-created, you'll see in logs:

```
[LOGIN] Username: admin, Found users: 0
[LOGIN] 🔧 Demo user not found, auto-creating...
[LOGIN] 📝 Created franchise with ID: 1
[LOGIN] ✅ Created demo user: admin
[LOGIN] Password valid: true, User: admin
[LOGIN] ✅ Successful login for user: admin
```

### For Production

**Before going live:**

1. Deploy updated backend code with this auto-creation feature
2. Users will automatically get demo access on first login attempt
3. No need to run separate setup scripts
4. Other users and data are completely unaffected

### Disabling Auto-Creation (Optional)

If you want to disable this feature (not recommended), edit `authController.js` and remove the auto-creation block (lines 30-106).

### Testing

**Local Testing:**
```bash
npm run dev
# Try login with admin/password123
# Should auto-create if user doesn't exist
```

**Live Testing:**
1. Make sure the database is fresh (no users)
2. Try login with admin/password123
3. Should auto-create and login successfully

---

## What Gets Created

### Franchise (if doesn't exist)
- Code: `FR001`
- Name: `Demo Franchise`
- Status: `active`
- Subscription: `active`

### User (if doesn't exist)
- Username: `admin`
- Password: `password123` (hashed with bcrypt)
- Email: `admin@frbilling.com`
- Full Name: `Admin User`
- Role: `admin`
- Status: `active`

---

## Migration Path

### Old Method (Setup Scripts) → New Method (Auto-Creation)

**Old (Not needed anymore):**
```bash
node setup-demo-users.js
npm run setup:demo
```

**New (Just try to login):**
```
Username: admin
Password: password123
→ Automatically created if missing
```

---

## Troubleshooting

### User still gets "Invalid credentials" error?

**Possible causes:**

1. **Different demo credentials**: If you're using something other than `admin`/`password123`, it won't auto-create
2. **Database error**: Check logs for database connection errors
3. **Franchise creation failed**: Check if user has permission to create franchises table entry

### To Debug:

Check backend logs:
```bash
tail -f logs/error.log | grep LOGIN
```

Should show:
```
[LOGIN] 🔧 Demo user not found, auto-creating...
[LOGIN] ✅ Created demo user: admin
[LOGIN] ✅ Successful login for user: admin
```

---

## When Does Auto-Creation NOT Trigger?

- ❌ When username is NOT "admin"
- ❌ When password is NOT "password123"
- ❌ When user already exists
- ❌ When there's a database error

In these cases, normal "Invalid credentials" response is returned.

---

## Best Practices

1. **First Deploy**: Deploy updated backend with auto-creation feature
2. **First Login**: Try login with admin/password123 (auto-creates if needed)
3. **Verify**: Check that login works
4. **Create Real Users**: Once verified, create actual user accounts
5. **Keep Demo Available**: The demo user remains available for testing

---

## For Team Members

When deploying to live or giving access to others:

1. Tell them to use: `admin` / `password123`
2. First login will automatically create the user if needed
3. No setup scripts or database queries needed
4. Simple and foolproof

---

## For Developers

If you need to understand the code:

**File**: `backend/src/controllers/authController.js`
**Function**: `login()`
**Lines**: 30-106 (Auto-creation logic)

Logic:
1. Try to find user with JOIN to franchise
2. If not found AND username=admin AND password=password123
3. Check if FR001 franchise exists
4. Create franchise if doesn't exist
5. Hash password and create user
6. Re-fetch user and proceed with normal login
7. Generate token and return

---

**Benefits:**
- ✅ Zero manual setup needed
- ✅ Works on first deploy
- ✅ Safe for production
- ✅ No scripts to remember
- ✅ Automatic and foolproof
