# Rate Saving Troubleshooting Guide

## ✅ Step-by-Step Debugging

### Step 1: Open Browser Console

1. Go to http://localhost:3000/ratemaster/add-company
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab

### Step 2: Fill Out the Form

**Required Fields (MUST all be filled):**

- ✅ Company ID: `TEST_DOX_001`
- ✅ Company Name: `Test Dox Company`
- ✅ Company Address: `123 Main Street`
- ✅ Phone: `9876543210`
- ✅ Email: `test@dox.com`
- ✅ GST No: `27ABCDE1234F1Z0`

**Optional but recommended:**

- Insurance %: `5`
- Fuel Surcharge %: `10`
- Royalty %: `15`

### Step 3: Fill at Least One Rate Table

**Dox Tab → Slab 2:**

1. Click **Dox** tab
2. Ensure **Slab 2** is selected (radio button)
3. Fill in first row "Within City": `[100, 150]`
4. Fill in second row "Within State": `[120, 170]`

### Step 4: Click Save Company Button

**Watch the Console for these messages:**

#### ✅ Success Path:

```
🚀 Form submission started
✅ Validation passed
📤 Posting company data to /rates/company
✅ Company created: { success: true, data: { id: 123, ... } }
📌 Company ID: 123
🔄 Formatting rate data...
✅ Rate data formatted, total records: 18
📤 Sending rates to backend...
Company ID: 123
Rates data count: 18
API URL: http://localhost:5000/api/rates/courier
✅ Rates saved successfully: { success: true, message: "18 courier rates saved successfully", ... }
```

---

## ❌ Troubleshooting Common Issues

### Issue 1: "Missing required fields" Alert

**Error Message:**

```
❌ Validation failed - Missing required fields
Alert: "Company ID, Company Name, Company Address... are required!"
```

**Solution:**

- Check console shows: `❌ Validation failed - Missing required fields`
- Make sure you've filled in ALL 6 required fields
- Check for typos or spaces
- Required fields: Company ID, Company Name, Address, Phone, Email, GST No

---

### Issue 2: Company Creation Fails

**Error Message in Console:**

```
❌ Error adding company: ...
Error response: { success: false, message: "..." }
```

**Check the Error Message:**

**If message says: "Duplicate company_id"**

- Use a different Company ID (must be unique)
- Try: `TEST_DOX_002`, `TEST_DOX_003`, etc.

**If message says: "Invalid email"**

- Check email format: `name@domain.com`
- Try: `test@gmail.com`

**If message says: "Phone must be numeric"**

- Use only numbers: `9876543210`
- No spaces or special characters

**If message says: "Invalid GST No"**

- Format: `27ABCDE1234F1Z0` (2 digits + 10 chars + 1 char + Z + 1 digit)
- Example: `27ABCDE1234F1Z5`

---

### Issue 3: Company Created but Rates Not Saved

**Error Message:**

```
✅ Company created: { success: true, data: { id: 123, ... } }
...
❌ Error saving courier rates: ...
Alert: "Company added but rates failed to save. Please add rates manually."
```

**Check Console for:**

```
Error response: { success: false, message: "..." }
```

**Common Solutions:**

| Error                                            | Solution                                          |
| ------------------------------------------------ | ------------------------------------------------- |
| `Cannot find module 'courierCompanyRatesRoutes'` | Backend server crashed - restart with `npm start` |
| `company_id and rates_data are required`         | Frontend not sending data correctly               |
| `Company not found`                              | Company ID mismatch between frontend and backend  |
| `Authorization required`                         | JWT token expired - login again                   |

---

### Issue 4: No Console Messages at All

**Problem:** Button click does nothing, no console output

**Solution:**

1. **Check Console Visibility:**

   - F12 → Console tab
   - Make sure you're in the Console tab (not Elements, Network, etc.)

2. **Check Browser Cache:**

   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear cache: F12 → Application → Clear storage

3. **Check Form Tag:**
   - Make sure form has `onSubmit={handleSubmit}`
   - Button must be `type="submit"` inside the form

---

## 🔍 Network Tab Debugging

### Step 1: Open Network Tab

1. F12 → Network tab
2. Check "Preserve log" checkbox

### Step 2: Click Save Button

### Step 3: Look for These Requests:

**Request 1: POST /api/rates/company**

- **Status:** 200 or 201 (success)
- **Response:** `{ "success": true, "data": { "id": 123 } }`

**Request 2: POST /api/rates/courier**

- **Status:** 200 (success)
- **Response:** `{ "success": true, "message": "18 courier rates saved successfully" }`

### If Requests Fail:

#### Status 400 (Bad Request)

```json
{
  "success": false,
  "message": "company_id and rates_data are required"
}
```

**Solution:** Check if rates_data is being sent

#### Status 401 (Unauthorized)

```json
{
  "success": false,
  "message": "No token provided" or "Invalid token"
}
```

**Solution:** Login again - your session expired

#### Status 404 (Not Found)

```json
{
  "success": false,
  "message": "Company not found"
}
```

**Solution:** Different company IDs - verify company was created first

#### Status 500 (Server Error)

```json
{
  "success": false,
  "message": "Failed to save courier rates"
}
```

**Solution:** Check backend logs - restart backend with `npm start`

---

## 📊 Verify Rates Saved in Database

### Using MySQL:

```sql
-- Find the company
SELECT id, company_id, company_name
FROM company_rate_master
WHERE company_id = 'TEST_DOX_001';

-- Get company ID (e.g., 123)
-- Replace <company_id> with the ID from above

-- Check rates
SELECT *
FROM courier_company_rates
WHERE company_id = <company_id>
ORDER BY courier_type, slab_type;

-- Count total rates
SELECT
  courier_type,
  COUNT(*) as count
FROM courier_company_rates
WHERE company_id = <company_id>
GROUP BY courier_type;
```

**Expected Results:**

```
Dox: 18 records
NonDox: 24 records
Dtdc PLUS: 15 records
Dtdc PTP: 30 records
Express Cargo: 6 records
Priority: 6 records
E-Commerce: 5-10 records
Total: ~100-120 records
```

---

## ✅ Full Test Flow

```
1. Open http://localhost:3000/ratemaster/add-company
   └─ F12 → Console

2. Fill Required Fields
   - Company ID: TEST_001
   - Name: Test Company
   - Address: 123 Main St
   - Phone: 9876543210
   - Email: test@test.com
   - GST: 27ABCDE1234F1Z0

3. Click "Dox" Tab
   └─ Fill Slab 2 rates

4. Click "Save Company" Button
   └─ Watch console for logs

5. Expected: Alert says "Company and rates added successfully!"

6. Check Database:
   - SELECT * FROM company_rate_master WHERE company_id = 'TEST_001';
   - SELECT * FROM courier_company_rates WHERE company_id = <id>;
   - Should see ~18 records for Dox

7. Success: Rates are in database!
```

---

## 🚀 Quick Fixes

### Fix 1: Restart Backend

```bash
cd c:\Users\admin\Desktop\easygo\backend
npm start
```

### Fix 2: Hard Refresh Frontend

```
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Fix 3: Clear Browser Storage

```
F12 → Application → Storage → Clear Site Data → Clear All
```

### Fix 4: Re-login

```
1. Logout
2. Login again
3. Try saving company
```

### Fix 5: Check API URL

```javascript
// In browser console:
console.log(import.meta.env.VITE_API_URL);
// Should show: http://localhost:5000/api
```

---

## 📞 Still Not Working?

**Provide this information:**

1. What error message do you see (if any)?
2. What do the console logs show?
3. Can you add a company without rates?
4. Can you see the company in the company list?
5. Screenshot of the error (if visible)

Then we can debug further!
