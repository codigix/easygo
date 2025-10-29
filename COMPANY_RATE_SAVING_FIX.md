# Company Rate Master - Rate Saving Failure FIX ✅

## Issue Summary

When adding a new company at `/ratemaster/add-company`, the **company details were saved but courier rates were NOT persisted** to the database. Error message: `Table 'frbilling.courier_company_rates' doesn't exist`

## Root Cause

The database migration file existed but **hadn't been executed**, so the `courier_company_rates` table was missing from the database.

## Solution Applied

### Step 1: Run Database Migration ✅

```bash
npm run migrate
# OR from root: cd backend && npm run migrate
```

**Status**: Migration successfully created `courier_company_rates` table in batch 9.

### Table Structure Created

```
courier_company_rates table:
├── id (int unsigned, primary key)
├── franchise_id (int unsigned, foreign key)
├── company_id (int unsigned, foreign key)
├── courier_type (varchar(50)) - Dox, NonDox, Dtdc PLUS, etc.
├── row_name (varchar(100)) - Within City, Metro, etc.
├── sub_type (varchar(50)) - For NonDox (air/surface), Dtdc PTP (ptp/ptp2)
├── slab_type (enum: Slab 2, Slab 3, Slab 4)
├── rates (json) - {"rate_1": "100", "rate_2": "150", "rate_3": "200"}
├── status (enum: active, inactive)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## What's Fixed

### Frontend (AddCompanyPage.jsx)

Previously improved rate formatting with:

- ✅ Proper numeric validation for all courier types
- ✅ Intelligent error messaging
- ✅ Console logging for debugging

### Backend Database

Now has:

- ✅ Table structure for storing courier company rates
- ✅ Foreign keys to `franchises` and `company_rate_master`
- ✅ Indexes for performance
- ✅ JSON column for flexible rate storage

## Testing Instructions

### Test 1: Create Company with Rates

1. Navigate to `/ratemaster/add-company`
2. Fill in company details:
   - Company Name: "Test Company XYZ"
   - Rate Master: Select any rate master
3. Add rates for Dox courier:
   - Within City, Slab 2: 100
   - Within City, Slab 3: 150
4. Click "Save Company"

**Expected Result**:

```
Company created successfully!
✅ Rates saved successfully (3 rates inserted)
```

### Test 2: Verify Rate Data

1. Check backend console - should see:
   ```
   All slab stored
   Courier company rates saved successfully
   ```
2. Check database:
   ```sql
   SELECT * FROM courier_company_rates
   WHERE company_id = <your_new_company_id>;
   ```
   Should show inserted rate records.

### Test 3: Empty Rate Handling

1. Create company with NO rates filled in
2. Click "Save Company"

**Expected Result**:

```
Company created successfully!
❌ No courier rates data provided. You can add rates later using the Rate Master section.
```

## Verification Checklist

- [x] Database migration executed (`npm run migrate`)
- [x] `courier_company_rates` table exists
- [x] Table has correct structure with all required columns
- [x] Foreign keys configured
- [x] Indexes created for performance
- [x] Frontend validation improved (rates formatting)
- [x] Error messages are user-friendly

## If Issues Persist

### 1. Check Migration Status

```bash
# From backend folder
sqlite3 .migrations.db "SELECT * FROM knex_migrations;" # or check with your DB client
```

### 2. View Backend Logs

Look at the terminal running `npm run dev` for detailed error messages

### 3. Database Connection

Verify `.env` file has correct database credentials:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Backend
MYSQL_DATABASE=frbilling
```

### 4. Manual Table Creation (If Migration Fails)

```sql
CREATE TABLE `courier_company_rates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `franchise_id` int unsigned NOT NULL,
  `company_id` int unsigned NOT NULL,
  `courier_type` varchar(50) NOT NULL,
  `row_name` varchar(100) NOT NULL,
  `sub_type` varchar(50),
  `slab_type` enum('Slab 2','Slab 3','Slab 4') NOT NULL,
  `rates` json NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `company_rate_master`(`id`) ON DELETE CASCADE,
  KEY `idx_company_rates` (`franchise_id`, `company_id`, `courier_type`),
  KEY `idx_courier_rates` (`courier_type`, `row_name`)
);
```

## Next Steps

1. **Restart Backend**: Ensure backend is running after migration

   ```bash
   npm run dev
   ```

2. **Test the Flow**: Follow the testing instructions above

3. **Monitor Logs**: Check browser console (F12) and backend terminal for any errors

## Files Modified/Created

- ✅ Database migration: `backend/migrations/20240101000021_create_courier_company_rates_table.cjs`
- ✅ Verification script: `backend/verify_table.js` (can be deleted after verification)
- ✅ Frontend: `frontend/src/pages/AddCompanyPage.jsx` (rate formatting improvements)

## API Endpoint Details

### Save Courier Rates

**Endpoint**: `POST /api/rates/courier`

**Request Body**:

```json
{
  "company_id": 1,
  "rates": [
    {
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 2",
      "rates": { "rate_1": "100", "rate_2": "150", "rate_3": "200" }
    }
  ]
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Courier company rates saved successfully",
  "inserted": 3,
  "warnings": []
}
```

**Error Response** (if table doesn't exist):

```json
{
  "success": false,
  "message": "Error saving rates",
  "error": "Table 'frbilling.courier_company_rates' doesn't exist"
}
```

## Support Commands

```powershell
# Check database tables exist
Set-Location backend
node verify_table.js

# Run migrations
npm run migrate

# Rollback migrations (if needed)
npm run migrate:rollback

# Check migration status
# Look in knex_migrations table in your database
```

## Summary

The issue has been **RESOLVED** by running the database migration. The `courier_company_rates` table now exists with proper structure, and company rates should save successfully. 🎉
