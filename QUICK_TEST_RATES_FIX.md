# Quick Test: Company Rate Saving Fix 🚀

## What Was Fixed?

The database table `courier_company_rates` now exists. Company rates will be saved successfully.

## Pre-Test Checklist

- [ ] Backend running on `localhost:3000` (npm run dev)
- [ ] Frontend running on `localhost:5173` (npm run build:dev or npm run dev)
- [ ] Database migrations applied (`npm run migrate` from backend folder)

---

## Test Scenario 1: Save Company with Rates ✅

### Step 1: Navigate to Add Company

```
URL: http://localhost:5173/ratemaster/add-company
```

### Step 2: Fill Company Details

```
Company Name: Test Company ABC
Address: 123 Test Street
Contact: 9999999999
Rate Master: [Select any from dropdown]
```

### Step 3: Add Dox Rates

Scroll to "Dox" section and enter:

| Location    | Slab 2 | Slab 3 | Slab 4 |
| ----------- | ------ | ------ | ------ |
| Within City | 100    | 150    | 200    |
| Metro       | 80     | 120    | 160    |

### Step 4: Submit Form

- Click "Save Company" button
- Wait 2-3 seconds

### Expected Output

✅ **Success Message**:

```
Company created successfully!
✅ Rates saved successfully (6 rates inserted)
```

✅ **Browser Console** (F12 → Console):

```
All slab stored
Courier company rates saved successfully
```

✅ **Backend Console**:

```
POST /api/rates/courier 200 XXms
```

---

## Test Scenario 2: Save Without Rates

### Step 1: Navigate to Add Company

```
URL: http://localhost:5173/ratemaster/add-company
```

### Step 2: Fill Company Details ONLY

```
Company Name: Test Company 2
Address: 456 Test Avenue
Contact: 8888888888
Rate Master: [Select any from dropdown]
```

### Step 3: Leave All Rates Empty

- Don't fill any rate values

### Step 4: Submit Form

- Click "Save Company"

### Expected Output

✅ **Success Message**:

```
Company created successfully!
ℹ️ No courier rates data provided. You can add rates later using the Rate Master section.
```

---

## Test Scenario 3: Database Verification

### Using MySQL Command Line

```sql
-- Connect to frbilling database
USE frbilling;

-- View all saved rates
SELECT * FROM courier_company_rates;

-- View rates for specific company
SELECT * FROM courier_company_rates
WHERE company_id = 1;

-- Count rates by courier type
SELECT courier_type, COUNT(*) as total
FROM courier_company_rates
GROUP BY courier_type;
```

### Using Verification Script

```powershell
Set-Location c:\Users\admin\Desktop\easygo\backend
node verify_table.js
```

Expected output:

```
✅ Table courier_company_rates EXISTS

Table structure:
  - id: int unsigned
  - franchise_id: int unsigned
  - company_id: int unsigned
  - courier_type: varchar(50)
  - row_name: varchar(100)
  - sub_type: varchar(50)
  - slab_type: enum('Slab 2','Slab 3','Slab 4')
  - rates: json
  - status: enum('active','inactive')
  - created_at: timestamp
  - updated_at: timestamp
```

---

## Troubleshooting

### ❌ Still getting "Table doesn't exist"?

**Solution 1: Run migrations again**

```powershell
Set-Location c:\Users\admin\Desktop\easygo\backend
npm run migrate
```

**Solution 2: Verify database connection**
Check `.env` file:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Backend
MYSQL_DATABASE=frbilling
```

**Solution 3: Check backend is reading .env correctly**
Restart backend:

```
CTRL+C to stop backend
npm run dev  # to restart
```

### ❌ Rates not appearing in table?

**Check frontend console** (F12):

- Look for errors in red
- Check "Network" tab for failed requests
- Verify `Authorization: Bearer <token>` headers exist

**Check backend console**:

- Look for error messages
- Check database query logs

### ⚠️ Rates appear blurry after save?

- This is a UI display issue, not a database issue
- Refresh page with F5
- Clear browser cache if needed
- Check developer tools for JavaScript errors

---

## Data Flow Diagram

```
User Input (Form)
    ↓
AddCompanyPage.jsx (Frontend Validation)
    ↓
POST /api/companies (Save company)
    ↓
Company saved ✓
    ↓
POST /api/rates/courier (Save rates)
    ↓
courier_company_rates table ✓
    ↓
Success Message + Redirect
```

---

## Important Notes

1. **Token Required**: Must be logged in to test (token in localStorage)
2. **Rate Format**: Rates stored as JSON in database
3. **Async Operation**: Rates save AFTER company (0.5s delay for UX)
4. **No Validation**: Accepts 0 values, negative values, empty strings
5. **Database**: Uses MySQL with foreign keys (CASCADE delete)

---

## Performance Metrics (Expected)

| Operation              | Time        | Expected                      |
| ---------------------- | ----------- | ----------------------------- |
| Save Company           | ~50-100ms   | ✅ Quick                      |
| Save Rates (6 entries) | ~100-200ms  | ✅ Normal                     |
| Total Time             | ~500-1000ms | ✅ With success message delay |

---

## Next Steps After Testing

1. ✅ Test all courier types (Dox, NonDox, Dtdc PLUS, etc.)
2. ✅ Test Rate Master page to verify saved rates display correctly
3. ✅ Test pagination with multiple companies
4. ✅ Test with different rate masters
5. ✅ Run full integration tests

## Files Involved

- Frontend: `frontend/src/pages/AddCompanyPage.jsx`
- Backend API: `backend/src/controllers/courierCompanyRatesController.js`
- Database: `backend/migrations/20240101000021_create_courier_company_rates_table.cjs`
- Verification: `backend/verify_table.js`

---

**✅ All systems go! Ready to test.** 🚀
