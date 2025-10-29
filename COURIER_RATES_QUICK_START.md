# Courier Rates - Quick Start & Testing

## 🚀 Run Migration

```bash
cd c:\Users\admin\Desktop\easygo\backend

# Run the latest migration
npm run knex migrate:latest

# Verify migration
npm run knex migrate:status
```

**Expected Output:**

```
✓ 20240101000021_create_courier_company_rates_table.cjs
```

---

## ✅ Verify Table Created

```bash
# In MySQL, run:
DESCRIBE courier_company_rates;

# Should show:
# - id (INT, PK)
# - franchise_id (INT, FK)
# - company_id (INT, FK)
# - courier_type (VARCHAR 50)
# - row_name (VARCHAR 100)
# - sub_type (VARCHAR 50, nullable)
# - slab_type (ENUM)
# - rates (JSON)
# - status (ENUM)
# - created_at, updated_at (TIMESTAMP)
```

---

## 🧪 Test Data Flow

### 1. Test: Add Company with Rates

**URL:** http://localhost:3000/ratemaster/add-company

**Steps:**

1. Fill Company Details:

   - Company ID: `TEST_DOX_001`
   - Company Name: `Test Dox Company`
   - Company Address: `123 Main St`
   - Phone: `9876543210`
   - Email: `test@example.com`
   - GST No: `27ABCDE1234F1Z0`

2. Fill Dox Rates (Slab 2):

   - Within City: [100, 150]
   - Within State: [120, 170]
   - Special Destination: [150, 200]
   - Metro: [200, 250]
   - Rest of India: [250, 300]
   - Pune: [180, 220]

3. Fill other tabs (at least Slab 2)

4. Click "Submit"

**Expected Result:**

```
✅ Company and rates added successfully!
```

---

### 2. Test: Verify Database Records

```sql
-- Find company
SELECT id, company_id, company_name
FROM company_rate_master
WHERE company_id = 'TEST_DOX_001';

-- Find rates for this company
SELECT *
FROM courier_company_rates
WHERE company_id = <ID_FROM_ABOVE>
ORDER BY courier_type, slab_type, row_name;

-- Count rates
SELECT courier_type, COUNT(*) as count
FROM courier_company_rates
WHERE company_id = <ID_FROM_ABOVE>
GROUP BY courier_type;
```

**Expected Result:**

```
Dox: 18 records (6 rows × 3 slabs)
NonDox: 24 records (4 rows × 2 sub_types × 3 slabs)
... etc
Total: 100-120 records
```

---

### 3. Test: API Endpoints

#### Get All Rates for Company

```bash
curl -X GET "http://localhost:5000/api/rates/courier/company/1" \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "courier_type": "Dox",
      "row_name": "Within City",
      "slab_type": "Slab 2",
      "rates": {
        "rate_1": "100",
        "rate_2": "150"
      },
      "status": "active",
      "created_at": "2025-01-02T10:30:00Z"
    },
    ...
  ]
}
```

#### Get Rates by Courier Type

```bash
curl -X GET "http://localhost:5000/api/rates/courier/company/1/courier/Dox" \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# Response: Only Dox rates (18 records)
```

#### Calculate Rate with Surcharges

```bash
curl -X POST "http://localhost:5000/api/rates/courier/calculate" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "courier_type": "Dox",
    "row_name": "Within City",
    "weight": 2.5
  }'

# Response:
{
  "success": true,
  "data": {
    "base_rate": 100,
    "fuel_surcharge": 10,
    "royalty_surcharge": 5,
    "final_rate": 115,
    "slab_type": "Slab 2"
  }
}
```

---

## 📊 Test Scenarios

### Scenario 1: NonDox with Air/Surface

```sql
INSERT INTO courier_company_rates VALUES
(null, <franchise_id>, <company_id>, 'NonDox', 'Special Destination', 'air', 'Slab 2', '{"rate_1":"100","rate_2":"150"}', 'active', NOW(), NOW()),
(null, <franchise_id>, <company_id>, 'NonDox', 'Special Destination', 'surface', 'Slab 2', '{"rate_1":"80","rate_2":"120"}', 'active', NOW(), NOW());

-- Query
SELECT * FROM courier_company_rates
WHERE courier_type = 'NonDox' AND row_name = 'Special Destination'
ORDER BY sub_type;
```

### Scenario 2: Dtdc PTP with Dual Tables

```sql
-- PTP table rates
INSERT INTO courier_company_rates VALUES
(null, <franchise_id>, <company_id>, 'Dtdc PTP', 'City', 'ptp', 'Slab 2', '{"rate_1":"200","rate_2":"250"}', 'active', NOW(), NOW());

-- PTP2 table rates
INSERT INTO courier_company_rates VALUES
(null, <franchise_id>, <company_id>, 'Dtdc PTP', 'City', 'ptp2', 'Slab 2', '{"rate_1":"220","rate_2":"270"}', 'active', NOW(), NOW());
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Migration File Not Found

```
Error: ENOENT: no such file or directory
```

**Solution:**

- Ensure file exists: `backend/migrations/20240101000021_create_courier_company_rates_table.cjs`
- Run: `npm run knex migrate:latest`

### Issue 2: Table Already Exists

```
Error: Table 'frbilling.courier_company_rates' already exists
```

**Solution:**

```sql
DROP TABLE courier_company_rates;
npm run knex migrate:latest
```

### Issue 3: Foreign Key Constraint

```
Error: Cannot add or update a child row: a foreign key constraint fails
```

**Solution:**

- Verify company_rate_master record exists
- Check company_id is valid

### Issue 4: JSON Parse Error

```
Error: Unexpected token in JSON
```

**Solution:**

- Verify rates_data is properly formatted JSON
- Check controller is parsing rates correctly

---

## 📈 Performance Optimization

### Add Indexes

```sql
-- Index by company and courier type (done in migration)
ALTER TABLE courier_company_rates
ADD INDEX idx_company_courier (company_id, courier_type);

-- For booking lookups
ALTER TABLE courier_company_rates
ADD INDEX idx_lookup (company_id, courier_type, row_name);
```

### Query Optimization

```sql
-- Get rate for specific booking
SELECT * FROM courier_company_rates
WHERE company_id = ?
  AND courier_type = ?
  AND row_name = ?
  AND slab_type = ?
LIMIT 1;
```

---

## ✨ Next: Integration with Booking System

Once rates are stored, update booking creation:

```javascript
// In bookingController.js
import { calculateRate } from "./courierCompanyRatesController.js";

async function createBooking(req, res) {
  const { company_id, courier_type, weight, destination } = req.body;

  // Determine row based on destination
  const row_name = determineRowFromDestination(destination);

  // Get rate with surcharges
  const rateCalc = await axios.post("/rates/courier/calculate", {
    company_id,
    courier_type,
    row_name,
    weight,
  });

  // Use rateCalc.data.final_rate in booking
}
```

---

## 📝 Rollback (If Needed)

```bash
# Rollback migration
npm run knex migrate:rollback

# This will drop the courier_company_rates table
```

---

## ✅ Success Indicators

- [ ] Migration runs without errors
- [ ] Table created with all columns
- [ ] Indexes created successfully
- [ ] Can insert test data
- [ ] Can query rates by company
- [ ] Can calculate rates with surcharges
- [ ] JSON rates parse correctly
- [ ] Foreign keys enforce constraints
- [ ] Frontend sends rates after company creation
- [ ] Database shows 100+ rate records per company
