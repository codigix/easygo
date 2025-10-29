# Complete Rate Saving Test Script

## 🎯 Test Objective

Verify that courier rates are properly saved to the database when adding a new company.

---

## 📋 Pre-Test Checklist

### ✅ Backend Ready?

```bash
# Terminal 1: Backend
cd c:\Users\admin\Desktop\easygo\backend
npm start

# Expected output:
# ✅ MySQL connected
# 🚀 Server running on port 5000
```

### ✅ Frontend Running?

```bash
# Terminal 2: Frontend
cd c:\Users\admin\Desktop\easygo\frontend
npm run dev

# Expected output:
# VITE v5.x.x  ready in xxx ms
# Local: http://localhost:5000
```

### ✅ Browser Ready?

- Open: http://localhost:3000
- Login with your credentials
- Navigate to: **RateMaster → Add Company**

---

## 🚀 Test Steps

### Step 1: Open Developer Console

```
1. Press F12
2. Go to Console tab
3. Clear previous logs (right-click → Clear console)
```

### Step 2: Fill Company Form

| Field                | Value                        |
| -------------------- | ---------------------------- |
| **Company ID**       | `TEST_RATE_SAVE_001`         |
| **Company Name**     | `Rate Saving Test Company`   |
| **Company Address**  | `123 Test Street, Test City` |
| **Phone**            | `9876543210`                 |
| **Email**            | `test@ratesave.com`          |
| **GST No**           | `27ABCDE1234F1Z5`            |
| **Insurance %**      | `5`                          |
| **Fuel Surcharge %** | `10`                         |
| **Royalty %**        | `15`                         |

**Fill all other fields with:**

- `0` (for numeric fields)
- Leave blank (for optional text fields)

### Step 3: Fill Dox Rates

1. Click **Dox** tab
2. **Slab 2** should be selected (radio button)
3. Fill rates for each row:

```
Row 1 - Within City:       [100] [150]
Row 2 - Within State:      [120] [170]
Row 3 - Special Dest:      [150] [200]
Row 4 - Metro:             [200] [250]
Row 5 - Rest of India:     [250] [300]
Row 6 - Pune:              [180] [220]
```

### Step 4: Fill NonDox Rates (Optional)

1. Click **NonDox** tab
2. **Slab 2** and **Air** should be selected
3. Fill rates:

```
Air Rates:
Row 1 - Special Dest:      [100] [150]
Row 2 - Metro:             [120] [170]
Row 3 - Rest of India:     [150] [200]
Row 4 - Pune:              [180] [220]

Then click "Surface" tab and fill same rates
```

### Step 5: Click Save Company Button

**Console Output - Watch for:**

```
🚀 Form submission started
✅ Validation passed
📤 Posting company data to /rates/company
✅ Company created: { success: true, data: { id: 123, ... } }
📌 Company ID: 123
🔄 Formatting rate data...
✅ Rate data formatted, total records: 42
📤 Sending rates to backend...
Company ID: 123
Rates data count: 42
API URL: http://localhost:5000/api/rates/courier
✅ Rates saved successfully: {
  success: true,
  message: "42 courier rates saved successfully",
  data: { inserted: 42 }
}
```

**Expected Alert:**

```
Company and rates added successfully!
```

---

## ✅ Verify Success

### Check 1: Frontend Confirmation

- ✅ Alert shows success message
- ✅ Form resets to blank
- ✅ Company appears in company list

### Check 2: Network Tab

Open **F12 → Network** tab:

**Request 1: POST /api/rates/company**

```
Status: 201 Created
Response: { "success": true, "data": { "id": 123, "company_id": "TEST_RATE_SAVE_001" } }
```

**Request 2: POST /api/rates/courier**

```
Status: 200 OK
Response: { "success": true, "message": "42 courier rates saved successfully", "data": { "inserted": 42 } }
```

### Check 3: Database Verification

**Terminal 3: MySQL**

```sql
-- Find the company
SELECT id, company_id, company_name
FROM company_rate_master
WHERE company_id = 'TEST_RATE_SAVE_001';

-- Get the ID (e.g., 123)
-- Use it in the next query
SELECT
  courier_type,
  COUNT(*) as total_records,
  GROUP_CONCAT(DISTINCT slab_type) as slabs,
  GROUP_CONCAT(DISTINCT row_name) as rows
FROM courier_company_rates
WHERE company_id = 123
GROUP BY courier_type;
```

**Expected Results:**

```
Dox:     6 records,  Slab 2, All 6 row names
NonDox:  8 records,  Slab 2, 4 rows each (air+surface)
```

**Full Count:**

```sql
SELECT COUNT(*) as total_rates
FROM courier_company_rates
WHERE company_id = 123;

-- Should show: 42 (6 Dox + 8 NonDox + ... )
```

---

## 🔍 Expected Rate Records

### Dox Courier Type (6 rows × 1 slab = 6 records)

```sql
SELECT * FROM courier_company_rates
WHERE company_id = 123 AND courier_type = 'Dox'
ORDER BY row_name;
```

Expected output:

```
| id  | courier_type | row_name              | slab_type | rates                    |
|----|--------------|----------------------|-----------|--------------------------|
| 1  | Dox          | Within City           | Slab 2    | {"rate_1":"100","rate_2":"150"} |
| 2  | Dox          | Within State          | Slab 2    | {"rate_1":"120","rate_2":"170"} |
| 3  | Dox          | Special Destination   | Slab 2    | {"rate_1":"150","rate_2":"200"} |
| 4  | Dox          | Metro                 | Slab 2    | {"rate_1":"200","rate_2":"250"} |
| 5  | Dox          | Rest of India         | Slab 2    | {"rate_1":"250","rate_2":"300"} |
| 6  | Dox          | Pune                  | Slab 2    | {"rate_1":"180","rate_2":"220"} |
```

### NonDox Courier Type (4 rows × 2 sub_types = 8 records)

```sql
SELECT * FROM courier_company_rates
WHERE company_id = 123 AND courier_type = 'NonDox'
ORDER BY sub_type, row_name;
```

Expected output:

```
| id  | courier_type | row_name              | sub_type | slab_type | rates                    |
|----|--------------|----------------------|----------|-----------|--------------------------|
| 7  | NonDox       | Special Destination   | air      | Slab 2    | {"rate_1":"100","rate_2":"150"} |
| 8  | NonDox       | Metro                 | air      | Slab 2    | {"rate_1":"120","rate_2":"170"} |
| 9  | NonDox       | Rest of India         | air      | Slab 2    | {"rate_1":"150","rate_2":"200"} |
| 10 | NonDox       | Pune                  | air      | Slab 2    | {"rate_1":"180","rate_2":"220"} |
| 11 | NonDox       | Special Destination   | surface  | Slab 2    | {"rate_1":"100","rate_2":"150"} |
| 12 | NonDox       | Metro                 | surface  | Slab 2    | {"rate_1":"120","rate_2":"170"} |
| 13 | NonDox       | Rest of India         | surface  | Slab 2    | {"rate_1":"150","rate_2":"200"} |
| 14 | NonDox       | Pune                  | surface  | Slab 2    | {"rate_1":"180","rate_2":"220"} |
```

---

## ❌ Troubleshooting

### Symptom 1: Nothing Happens When Clicking Save

**Diagnostics:**

1. Check browser console (F12 → Console)
2. Do you see any red errors?
3. Do you see message `🚀 Form submission started`?

**If NO console message:**

- Hard refresh: `Ctrl+Shift+R`
- Check if form has errors
- Try logging in again

**If console shows validation error:**

- Fill all required fields
- Use exact format for GST: `27ABCDE1234F1Z0`

### Symptom 2: Company Created but Rates Not Saved

**Check Console:**

```
✅ Company created: { success: true, data: { id: 123 } }
...
❌ Error saving courier rates: ...
```

**Check the Error Response:**

```javascript
// In console, look for:
Error response: { success: false, message: "..." }
```

**Common Errors:**

| Message                                  | Solution                                       |
| ---------------------------------------- | ---------------------------------------------- |
| `company_id and rates_data are required` | Restart backend: `npm start` in backend folder |
| `Company not found`                      | Different company IDs - check database         |
| `Cannot POST /rates/courier`             | Backend routes not registered - restart        |
| `Authorization required`                 | Login again - token expired                    |

### Symptom 3: Rates Appear to Save but Not in Database

**Check:**

```sql
-- Verify company exists
SELECT * FROM company_rate_master
WHERE company_id = 'TEST_RATE_SAVE_001';

-- Check if table exists
SHOW TABLES LIKE 'courier_company_rates';

-- If table doesn't exist, run migration
-- From backend folder: npm run knex migrate:latest
```

### Symptom 4: Database Shows Wrong Number of Records

**Expected counts (Dox + NonDox only):**

- Dox: 6 records
- NonDox: 8 records
- **Total: 14 records**

**If you see fewer:**

- Some slabs or sub-types weren't saved
- Check if rates were actually entered in UI
- Check formatRatesData() is iterating all slabs

**If you see more:**

- Multiple saves happened
- Delete and retry:
  ```sql
  DELETE FROM courier_company_rates
  WHERE company_id = 123;
  ```

---

## 🎯 Success Criteria

✅ All criteria must pass:

- [ ] Console shows "Company and rates added successfully!"
- [ ] No red errors in console
- [ ] Network shows 2 successful POST requests (200/201 status)
- [ ] Company appears in company list
- [ ] Database has ~42 records for the company
  - Dox: 6 records
  - NonDox: 8 records
  - (Other courier types if filled)
- [ ] Each rate record has valid JSON in rates column
- [ ] All row_names are correct

---

## 📝 Test Report Template

**Copy this and share the results:**

```
TEST DATE: [Date]
TESTER: [Name]

FORM FILLING:
- Company ID: TEST_RATE_SAVE_001 ✅
- All required fields filled: ✅

CONSOLE LOGS:
- 🚀 Form submission started: ✅
- ✅ Company created: ✅
- ✅ Rates saved successfully: ✅

NETWORK REQUESTS:
- POST /api/rates/company: Status ___
- POST /api/rates/courier: Status ___

DATABASE VERIFICATION:
- Company found: ✅
- Total records saved: 42 ✅
- Dox records: 6 ✅
- NonDox records: 8 ✅

RESULT: ✅ PASS / ❌ FAIL

NOTES:
[Add any issues or observations]
```

---

## 🚨 Emergency Commands

**If nothing works:**

```bash
# 1. Restart backend
cd c:\Users\admin\Desktop\easygo\backend
npm start

# 2. Rebuild frontend cache
cd c:\Users\admin\Desktop\easygo\frontend
rm -r node_modules/.vite  # or: Remove-Item -Recurse node_modules/.vite (PowerShell)
npm run dev

# 3. Drop and recreate table
# In MySQL:
DROP TABLE courier_company_rates;
npm run knex migrate:latest

# 4. Clear browser cache
F12 → Application → Storage → Clear Site Data
```
