# Fixed: Recycled Consignments & Invoices 500 Errors

## Problem Summary

Users encountered HTTP 500 errors when trying to access recycled (cancelled) consignments and invoices:

- **GET** `/api/bookings/recycle/list` → 500 Error
- **GET** `/api/invoices/recycle/list` → 500 Error

### Root Cause

The database schema was restructured via migrations, but controller queries were either:

1. Querying non-existent columns
2. Using WHERE clauses with non-existent columns

## Errors Encountered

### Invoice Recycle Error

```
Error: Unknown column 'status' in 'where clause'
SQL: "SELECT COUNT(*) as total FROM invoices WHERE franchise_id = 2 AND status = 'cancelled'"
```

**Root Cause:** Migration 18 (`20240101000018_update_invoices_for_new_structure.cjs`) dropped the `status` column on line 19, but the controller was still trying to filter by it.

### Solution Applied

#### 1. **SELECT Query Fix** (Already corrected in invoiceController.js:808)

**Before:**

```sql
SELECT id, invoice_number, customer_id, invoice_date, total_amount as net_amount
```

**After:**

```sql
SELECT id, invoice_number, customer_id, invoice_date, net_amount
```

- Changed to directly query the new `net_amount` column added in migration 18

#### 2. **WHERE Clause Fix** (New Migration 23)

**File Created:** `backend/migrations/20240101000023_restore_status_to_invoices.cjs`

This migration restores the `status` column to the invoices table with the proper enum values:

```javascript
table
  .enum("status", ["draft", "sent", "paid", "cancelled"])
  .defaultTo("draft")
  .after("net_amount");
```

**Why?** The original migration 18 incorrectly dropped the `status` column, but the recycle functionality depends on filtering invoices by `status = 'cancelled'`.

#### 3. **Bookings Controller** (Verified Correct)

✅ The bookings controller was already correct:

- Status column exists and was preserved in migration 17 (line 69)
- SELECT query uses correct `amount` column (line 947)
- WHERE clause correctly filters by `status = 'cancelled'` (line 930)

## Database Schema Changes Summary

### Invoices Table

| Migration     | Change                                 |
| ------------- | -------------------------------------- |
| #6 (original) | Created with `status` enum column      |
| #18           | Dropped `status` column ❌ (MISTAKE)   |
| #23           | Restored `status` enum column ✅ (FIX) |
| #18           | Added `net_amount` column ✅           |

### Bookings Table

| Migration     | Change                                                    |
| ------------- | --------------------------------------------------------- |
| #5 (original) | Created with `status` column                              |
| #17           | Modified `status` to VARCHAR(50) with default "Booked" ✅ |
| #17           | Renamed `total_amount` to `amount` ✅                     |

## Files Modified/Created

### New Files

1. **`backend/migrations/20240101000023_restore_status_to_invoices.cjs`** - Migration to restore status column

### Verified Files (No changes needed)

1. **`backend/src/controllers/bookingController.js`**

   - Function: `getRecycledConsignments()` (lines 922-973)
   - Status: ✅ Correct - uses proper columns and WHERE clause

2. **`backend/src/controllers/invoiceController.js`**
   - Function: `getRecycledInvoices()` (lines 788-833)
   - Status: ✅ Correct - uses `net_amount` column (verified at line 808)
   - WHERE clause: ✅ Fixed by migration 23 (status column now exists)

## Testing Instructions

### 1. Verify Migration Applied

```bash
cd backend
npm run migrate
```

Expected output: Migration applied successfully

### 2. Test API Endpoints

```bash
# Test recycled consignments (requires valid JWT token)
GET /api/bookings/recycle/list?page=1&limit=10

# Test recycled invoices (requires valid JWT token)
GET /api/invoices/recycle/list?page=1&limit=10
```

### 3. Expected Response Format

```json
{
  "success": true,
  "data": {
    "consignments": [
      {
        "id": 1,
        "consignment_number": "CON123",
        "customer_id": "C001",
        "booking_date": "2024-01-01",
        "amount": 1000
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

## Status

✅ **FIXED** - Migration applied, all queries corrected, endpoints should now work properly

## Deployment Checklist

- [x] Created migration file
- [x] Applied migration to database
- [x] Verified SELECT queries use correct columns
- [x] Verified WHERE clauses use correct columns
- [x] Backend server restarted
- [ ] Frontend tested (manual verification needed)
- [ ] Production deployment (if applicable)
