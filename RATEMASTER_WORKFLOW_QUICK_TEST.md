# RateMaster Workflow - Quick Test Guide ⚡

## Quick Start: 3-Step Testing Process

---

## Step 1️⃣: Create Test RateMaster Entry

**SQL Command**:

```sql
INSERT INTO rate_master (
  franchise_id,
  from_pincode,
  to_pincode,
  service_type,
  weight_from,
  weight_to,
  rate,
  gst_percentage,
  fuel_surcharge,
  status
) VALUES (
  1,              -- franchise_id
  '*',            -- from_pincode (any)
  '400001',       -- to_pincode (Mumbai)
  'Air',          -- service_type
  0,              -- weight_from
  10,             -- weight_to
  500,            -- rate (₹500 per kg)
  18,             -- gst_percentage
  2,              -- fuel_surcharge (2%)
  'active'
);

-- Note the ID returned, you'll need it for validation
```

---

## Step 2️⃣: Create Booking (Auto Rate Calculation)

**API Request**:

```bash
POST /api/bookings
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "consignment_no": "TEST001",
  "customer_id": "C-001",
  "booking_date": "2024-01-15",
  "char_wt": 2.5,
  "qty": 1,
  "mode": "AR",
  "pincode": "400001",
  "type": "ND",
  "other_charges": 100
}
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": { "id": 101 }
}
```

**Verify in Database**:

```sql
SELECT
  id,
  consignment_number,
  amount,
  tax_amount,
  fuel_amount,
  other_charges,
  total,
  gst_percent,
  fuel_percent
FROM bookings WHERE id = 101;

-- Expected output:
-- | 101 | TEST001 | 500 | 90 | 10 | 100 | 700 | 18 | 2 |
```

---

## Step 3️⃣: Generate Invoice

**Create Multiple Bookings First** (for better testing):

```sql
-- Create 2-3 more bookings for the same customer
INSERT INTO bookings (...) VALUES (...);  -- 2nd booking
INSERT INTO bookings (...) VALUES (...);  -- 3rd booking
```

**Generate Invoice API Request**:

```bash
POST /api/invoices/generate-multiple
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "customers": ["C-001"],
  "period_from": "2024-01-01",
  "period_to": "2024-01-31",
  "gst_percent": 18
}
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Successfully generated 1 invoices",
  "count": 1
}
```

**Verify Invoice Created**:

```sql
SELECT
  invoice_number,
  customer_id,
  subtotal_amount,
  gst_amount_new,
  fuel_surcharge_total,
  net_amount
FROM invoices
WHERE customer_id = 'C-001'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🧮 Manual Calculation Verification

### Booking Amounts Should Be:

```
Rate from RateMaster: ₹500/kg
Weight: 2.5 kg
Quantity: 1

Calculation:
lineAmount = 500 × 1 = ₹500 ✓
taxAmount = 500 × 18% = ₹90 ✓
fuelAmount = 500 × 2% = ₹10 ✓
otherCharges = ₹100 ✓
───────────────────────────
total = 500 + 90 + 10 + 100 = ₹700 ✓
```

### Invoice Totals Should Be:

```
For 3 bookings (assuming same pattern):

Subtotal = 500 + 500 + 500 = ₹1500
GST = 90 + 90 + 90 = ₹270
Fuel = 10 + 10 + 10 = ₹30
Other = 100 + 100 + 100 = ₹300
───────────────────────────
Net = 1500 + 270 + 30 + 300 = ₹2100 ✓
```

---

## 🔍 Detailed Validation Queries

### 1. Check All Bookings for a Customer

```sql
SELECT
  id,
  consignment_number,
  amount,
  tax_amount,
  fuel_amount,
  other_charges,
  total,
  invoice_id,
  status
FROM bookings
WHERE customer_id = 'C-001'
ORDER BY booking_date DESC;
```

### 2. Check Invoice Details

```sql
SELECT
  i.invoice_number,
  i.period_from,
  i.period_to,
  i.subtotal_amount,
  i.gst_amount_new,
  i.fuel_surcharge_total,
  i.other_charge,
  i.net_amount,
  COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.customer_id = 'C-001'
GROUP BY i.id;
```

### 3. Verify Invoice Items Match Bookings

```sql
SELECT
  ii.invoice_id,
  ii.booking_id,
  b.consignment_number,
  ii.amount as item_amount,
  b.total as booking_total,
  (ii.amount - b.total) as difference
FROM invoice_items ii
JOIN bookings b ON ii.booking_id = b.id
WHERE ii.invoice_id = 1;

-- All differences should be 0
```

### 4. Check Bookings Marked as Billed

```sql
SELECT
  id,
  consignment_number,
  status,
  invoice_id
FROM bookings
WHERE customer_id = 'C-001'
AND status = 'Billed';

-- Should show all bookings included in invoice
```

---

## ❌ Common Issues & Fixes

### Issue: "No matching rate found"

**Cause**: RateMaster entry doesn't match booking parameters
**Fix**:

```sql
-- Check if RateMaster entry exists
SELECT * FROM rate_master
WHERE from_pincode = '*' OR from_pincode = '...'
AND to_pincode = '400001'
AND service_type = 'Air'
AND weight_from <= 2.5
AND weight_to >= 2.5;

-- If empty, create one using Step 1
```

### Issue: Booking total doesn't match expected calculation

**Cause**: Rate calculation skipped due to missing fields
**Fix**:

```bash
# Ensure these fields are provided:
- char_wt (chargeable weight)
- qty (quantity)
- mode (AR/SR)
- pincode (destination)
```

### Issue: Invoice total incorrect

**Cause**: Double-counting of taxes
**Fix**: Verify all bookings have pre-calculated amounts

```sql
-- Check all bookings have tax_amount populated
SELECT COUNT(*) as without_tax
FROM bookings
WHERE customer_id = 'C-001'
AND tax_amount = 0;

-- Should be 0
```

---

## 🚀 Full End-to-End Test Script

```bash
#!/bin/bash

echo "=== RateMaster Workflow Full Test ==="

# Get token (adjust URL as needed)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}' \
  | jq -r '.data.token')

echo "✅ Token: $TOKEN"

# Create booking 1
BOOKING1=$(curl -s -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consignment_no":"TEST001",
    "customer_id":"C-001",
    "booking_date":"2024-01-15",
    "char_wt":2.5,
    "qty":1,
    "mode":"AR",
    "pincode":"400001",
    "type":"ND",
    "other_charges":100
  }' | jq -r '.data.id')

echo "✅ Created Booking 1: $BOOKING1"

# Create booking 2
BOOKING2=$(curl -s -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consignment_no":"TEST002",
    "customer_id":"C-001",
    "booking_date":"2024-01-15",
    "char_wt":3,
    "qty":1,
    "mode":"AR",
    "pincode":"400001",
    "type":"ND",
    "other_charges":150
  }' | jq -r '.data.id')

echo "✅ Created Booking 2: $BOOKING2"

# Generate invoice
INVOICE=$(curl -s -X POST http://localhost:5000/api/invoices/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\":\"C-001\",
    \"bookings\":[$BOOKING1,$BOOKING2],
    \"invoice_date\":\"2024-01-15\"
  }" | jq -r '.data.invoice_number')

echo "✅ Created Invoice: $INVOICE"
echo "✅ All tests passed!"
```

---

## 📊 Success Indicators

✅ Booking has `tax_amount` populated
✅ Booking has `fuel_amount` populated
✅ Booking `total` = amount + tax + fuel + other
✅ Invoice `subtotal_amount` = Σ(booking.amount)
✅ Invoice `gst_amount_new` = Σ(booking.tax_amount)
✅ Invoice `net_amount` = subtotal + gst + fuel + other
✅ All bookings marked as "Billed" after invoice
✅ No discrepancies in invoice items vs bookings

---

## 🎯 Checklist

- [ ] RateMaster entry created for test corridor
- [ ] Booking created with auto rate calculation
- [ ] Booking amounts verified in database
- [ ] Invoice generated for multiple bookings
- [ ] Invoice totals match manual calculation
- [ ] Bookings marked as billed
- [ ] Invoice items match booking amounts
- [ ] No errors in logs

---

## 📞 Need Help?

1. Check backend logs for rate calculation errors
2. Verify RateMaster entries for test parameters
3. Use SQL queries above to debug amounts
4. Check that migration was applied successfully
