# Rate Saving - Quick Fix Guide

## 🚀 TL;DR - Quick Steps

1. **Open Browser Console:**

   - Press `F12`
   - Go to `Console` tab

2. **Fill Company Form:**

   ```
   Company ID: TEST_001
   Company Name: Test Company
   Address: 123 Main St
   Phone: 9876543210
   Email: test@test.com
   GST No: 27ABCDE1234F1Z0
   ```

3. **Fill Rate Table:**

   - Click `Dox` tab
   - Enter rates in first row: `[100, 150]`

4. **Click Save Company Button**

5. **Check Console:**
   - Look for: `✅ Rates saved successfully:`
   - If NOT there → See troubleshooting below

---

## ✅ Success Indicators

When you click "Save Company" button, you should see in console:

```
🚀 Form submission started
✅ Validation passed
📤 Posting company data to /rates/company
✅ Company created: { success: true, data: { id: 123, ... } }
🔄 Formatting rate data...
✅ Rate data formatted, total records: 18
📤 Sending rates to backend...
✅ Rates saved successfully: { success: true, message: "18 courier rates saved successfully" }
```

**Alert Box:** "Company and rates added successfully!"

---

## ❌ Common Issues & Quick Fixes

### Issue: "Validation failed - Missing required fields"

**Fix:**

- Check all 6 fields are filled:
  - ✅ Company ID
  - ✅ Company Name
  - ✅ Company Address
  - ✅ Phone
  - ✅ Email
  - ✅ GST No

### Issue: Nothing Happens When Clicking Button

**Fix:**

1. Hard refresh: `Ctrl+Shift+R`
2. Check backend is running: http://localhost:5000/api/health
   - Should show: `{"success":true,"message":"API is running"}`

### Issue: Company Created but "rates failed to save"

**Fix:**

1. **Restart Backend:**

   ```bash
   cd backend
   npm start
   ```

2. **Check Error Message in Console:**

   - Look for: `Error response: { ... }`
   - If says "Cannot POST /rates/courier" → Backend crashed

3. **Verify Migration Ran:**
   ```bash
   cd backend
   npm run knex migrate:latest
   ```

### Issue: No Rates in Database

**Check:**

1. Rates were actually filled in UI (not empty fields)
2. Rates were sent (check Network tab):
   - F12 → Network → look for `rates/courier` request
   - Should have Status `200` and Response with `"success": true`

---

## 🔧 Debug Mode

### Enable Detailed Logging

In browser console, paste:

```javascript
localStorage.setItem("DEBUG_RATES", "true");
location.reload();
```

Then try saving company again and watch console.

### Check API URL

In browser console:

```javascript
console.log(import.meta.env.VITE_API_URL);
```

Should show: `http://localhost:5000/api`

---

## 🗄️ Verify Rates Saved in Database

```sql
-- Find company
SELECT id, company_id FROM company_rate_master
WHERE company_id = 'TEST_001';

-- Use the ID from above (e.g., 123)

-- Check rates
SELECT COUNT(*)
FROM courier_company_rates
WHERE company_id = 123;

-- Should show: ~18 (or more if you filled multiple slabs)
```

---

## 📞 Still Stuck?

**Provide:**

1. Screenshot of console errors (red text)
2. Network tab screenshot showing the failed request
3. The error response in Network tab

**Then we can debug!**

---

## 🎯 Test the Whole Thing

**Run this test:**

```
1. Go to http://localhost:3000/ratemaster/add-company
2. F12 → Console
3. Fill form with test data (see "TL;DR" above)
4. Click Dox tab
5. Enter rate: Within City → [100, 150]
6. Click "Save Company"
7. Check console for success message
8. Check database for 6 Dox records (or more if you filled more slabs)
```

**If all steps work:** ✅ Rate saving is working!

**If any step fails:** See "Common Issues" above
