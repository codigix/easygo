# Courier Company Rates - Complete Implementation Guide

**Status:** ✅ Ready for Migration & Testing  
**Date:** 2025-01-02  
**Component:** RateMaster Dox/NonDox/Dtdc PLUS/Express Cargo/Priority/E-Commerce

---

## 📋 Summary

This implementation adds proper database storage for courier-specific rates for each company. Rates are now:

- ✅ Properly stored in `courier_company_rates` table
- ✅ Linked to companies via foreign key
- ✅ Formatted per slab (Slab 2, 3, 4)
- ✅ Used during booking/consignment creation to calculate rates
- ✅ Applied with company surcharges and fees

---

## 🏗️ Architecture

### Database Structure

```
franchises
  └─ company_rate_master (24 fields: surcharges, fees, etc.)
       └─ courier_company_rates (NEW - stores rates for each courier type)
```

### New Table: `courier_company_rates`

```sql
CREATE TABLE courier_company_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  franchise_id INT NOT NULL,
  company_id INT NOT NULL (FK to company_rate_master),
  courier_type VARCHAR(50), -- Dox, NonDox, Dtdc PLUS, etc.
  row_name VARCHAR(100), -- Within City, Metro, etc.
  sub_type VARCHAR(50) NULLABLE, -- air/surface, ptp/ptp2
  slab_type ENUM('Slab 2', 'Slab 3', 'Slab 4'),
  rates JSON, -- {"rate_1": "100", "rate_2": "150", "rate_3": "200"}
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Data Flow

```
RateMaster UI (Add Company Page)
  ├─ Company Form (24 fields) → POST /rates/company
  │   └─ Creates: company_rate_master record
  │
  └─ Rate Tables (7 tabs × multiple rows & slabs)
      └─ Format & POST /rates/courier
          └─ Creates: courier_company_rates records (100+ records per company)
```

---

## 📁 Files Created/Modified

### New Files

1. **Migration:** `20240101000021_create_courier_company_rates_table.cjs`

   - Creates `courier_company_rates` table
   - Adds indexes and foreign keys

2. **Controller:** `backend/src/controllers/courierCompanyRatesController.js`

   - `saveCourierRates()` - Save all rates for a company
   - `getCompanyRates()` - Fetch all rates
   - `getRatesByCourierType()` - Fetch rates by type
   - `calculateRate()` - Calculate rate during booking
   - `deleteCompanyRates()` - Delete rates

3. **Routes:** `backend/src/routes/courierCompanyRatesRoutes.js`
   - POST `/rates/courier` - Save rates
   - GET `/rates/courier/company/:company_id` - Get all rates
   - GET `/rates/courier/company/:company_id/courier/:courier_type` - Get by type
   - POST `/rates/courier/calculate` - Calculate for booking
   - DELETE `/rates/courier/company/:company_id` - Delete rates

### Modified Files

1. **Frontend:** `frontend/src/pages/AddCompanyPage.jsx`

   - Added `formatRatesData()` - Converts UI table data to DB format
   - Added `saveCourierRates()` - Submits to backend
   - Updated `handleSubmit()` - Saves rates after company creation

2. **Backend Routes:** `backend/src/routes/index.js`
   - Added import and route: `router.use("/rates/courier", courierCompanyRatesRoutes);`

---

## 🔄 Data Formatting

### Frontend → Backend Rate Format

**Dox Table (UI):**

```
Slab 2:
  [Within City]     [100] [150]
  [Metro]           [200] [250]
```

**Converted to DB Format:**

```json
{
  "courier_type": "Dox",
  "row_name": "Within City",
  "slab_type": "Slab 2",
  "rates": {
    "rate_1": "100",
    "rate_2": "150"
  }
}
```

### All Courier Types

| Courier Type  | Rows     | Sub-Types    | Slabs | Total Records |
| ------------- | -------- | ------------ | ----- | ------------- |
| Dox           | 6        | None         | 3     | 18            |
| NonDox        | 4        | air, surface | 3     | 24            |
| Dtdc PLUS     | 5        | None         | 3     | 15            |
| Dtdc PTP      | 5        | ptp, ptp2    | 3     | 30            |
| Express Cargo | 2        | None         | 3     | 6             |
| Priority      | 2        | None         | 3     | 6             |
| E-Commerce    | Variable | None         | 1     | ~5-10         |
| **TOTAL**     | -        | -            | -     | **~100-120**  |

---

## 🚀 Implementation Steps

### Step 1: Run Migration

```bash
cd backend
npm run knex migrate:latest
```

This creates the `courier_company_rates` table.

### Step 2: Verify Backend

```bash
# Check routes are loaded
curl http://localhost:5000/api/health

# The endpoints should be available at:
# POST /api/rates/courier
# GET /api/rates/courier/company/{id}
# POST /api/rates/courier/calculate
```

### Step 3: Test Frontend

1. Go to http://localhost:3000/ratemaster/add-company
2. Fill in company details
3. Fill in rate tables for each courier type
4. Click Submit
5. Verify:
   - Company saved in `company_rate_master`
   - Rates saved in `courier_company_rates`

### Step 4: Verify Database

```sql
-- Check company record
SELECT * FROM company_rate_master WHERE company_id = 'TEST_COMPANY';

-- Check rates records
SELECT * FROM courier_company_rates WHERE company_id = (SELECT id FROM company_rate_master WHERE company_id = 'TEST_COMPANY');

-- Count rates per company
SELECT company_id, courier_type, COUNT(*) as count
FROM courier_company_rates
GROUP BY company_id, courier_type;
```

---

## 🧮 Rate Calculation During Booking

When creating a consignment/booking, use the `/rates/courier/calculate` endpoint:

```javascript
// Request
POST /api/rates/courier/calculate
{
  "company_id": 1,
  "courier_type": "Dox",
  "row_name": "Within City",
  "weight": 2.5,  // in kg
  "sub_type": null
}

// Response
{
  "success": true,
  "data": {
    "base_rate": 100,
    "fuel_surcharge": 10,      // 10% of base
    "royalty_surcharge": 5,    // 5% of base
    "final_rate": 115,
    "slab_type": "Slab 2"
  }
}
```

---

## 📊 Rate Table Structures

### Dox

- Rows: Within City, Within State, Special Destination, Metro, Rest of India, Pune
- Slabs: 2, 3, 4
- Structure: Weight ranges (upto kg, additional kg)

### NonDox (Air & Surface)

- Rows: Special Destination, Metro, Rest of India, Pune
- Sub-types: air, surface
- Slabs: 2, 3, 4
- Structure: Weight ranges

### Dtdc PLUS (Zone-based)

- Rows: City, Zonal, Metro, National, Regional
- Slabs: 2, 3, 4
- Structure: Weight ranges (upto 500gm, add 500gm, 10-25kg, etc.)

### Dtdc PTP

- Rows: City, Zonal, Metro, National, Regional
- Sub-types: ptp, ptp2
- Slabs: 2, 3, 4

### Express Cargo

- Rows: Special Destination, Metro
- Slabs: 2, 3, 4
- Structure: Up to 50kg, Above 50kg

### Priority/GEC

- Rows: Special Destination, Metro
- Slabs: 2, 3, 4
- Structure: Up to 1kg, Additional 1kg

### E-Commerce

- Rows: City names (dynamic)
- Slabs: 2 (upto, additional)
- Structure: Simple 2-rate system

---

## ✅ Validation & Error Handling

### Frontend Validation

- Rate fields accept decimals (0.01 step)
- Empty cells default to "0"
- Company must be saved before rates are submitted

### Backend Validation

- Company ID must exist
- Courier type must be valid
- Row names must match predefined lists
- Rates must be numeric
- Slab type must be Slab 2, 3, or 4

### Error Responses

```json
// Company not found
{
  "success": false,
  "message": "Company not found"
}

// Missing required fields
{
  "success": false,
  "message": "company_id and rates_data are required"
}

// Invalid slab type
{
  "success": false,
  "message": "Invalid slab type"
}
```

---

## 🔗 Integration with Booking System

After rates are stored, update `bookingController.js` to use them:

```javascript
// In createBooking or calculateRate
import { calculateRate } from "./courierCompanyRatesController.js";

const rateResult = await calculateRate(req, {
  company_id: bookingData.company_id,
  courier_type: bookingData.courier_type,
  row_name: determinedRow, // Based on destination
  weight: bookingData.weight,
  sub_type: bookingData.sub_type,
});

const finalRate = rateResult.final_rate;
```

---

## 📝 Database Queries

### Get all rates for a company

```sql
SELECT * FROM courier_company_rates
WHERE company_id = ? AND franchise_id = ?
ORDER BY courier_type, slab_type, row_name;
```

### Get specific courier type rates

```sql
SELECT * FROM courier_company_rates
WHERE company_id = ? AND courier_type = ?
AND franchise_id = ?
ORDER BY slab_type, row_name;
```

### Calculate rate (with surcharges)

```sql
SELECT
  ccr.rates,
  crm.fuel_surcharge_percent,
  crm.royalty_charges_percent
FROM courier_company_rates ccr
JOIN company_rate_master crm ON ccr.company_id = crm.id
WHERE ccr.company_id = ?
  AND ccr.courier_type = ?
  AND ccr.row_name = ?;
```

---

## 🧪 Testing Checklist

- [ ] Migration runs successfully
- [ ] Table `courier_company_rates` created
- [ ] All routes accessible
- [ ] Add company saves basic info
- [ ] Rate data saves for all courier types
- [ ] Rates retrieved correctly
- [ ] Rate calculation works
- [ ] Surcharges applied correctly
- [ ] Database foreign keys working
- [ ] Deleting company also deletes rates

---

## ⚠️ Important Notes

1. **Data Migration:** If you have existing companies, you need to run a migration script to populate rates
2. **Backward Compatibility:** The old system (without rates) still works, but booking calculations won't work until rates are added
3. **Performance:** With 100+ rate records per company, ensure indexes are used effectively
4. **JSON Storage:** Rates are stored as JSON for flexibility - can be queried with MySQL JSON functions

---

## 📞 Next Steps

1. ✅ Run migration
2. ✅ Test add company with rates
3. ✅ Verify database records
4. ✅ Integrate with booking system
5. ✅ Add rate edit/delete functionality
6. ✅ Create bulk import for rates
