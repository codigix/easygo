# 🎯 BOOKING CONTROLLER - CORRECTED VERSION GUIDE

## 📋 OVERVIEW

A **new corrected version** of `bookingController.js` has been created that:

✅ Uses **correct database field names**  
✅ **Extracts weight from documents** (no manual input)  
✅ **Calculates charges automatically** (no manual dtdc_amt)  
✅ **Follows upward workflow** (Document → Rate Master → Database)  
✅ **Includes all required fields** (sender/receiver details)  
✅ **Generates booking numbers** automatically

---

## 🔄 WORKFLOW COMPARISON

### ❌ OLD WORKFLOW (Broken)

```
Manual Input  →  Wrong Field Names  →  Database Error
char_wt manually entered
dtdc_amt manually entered
mode (wrong) → database expects service_type
Database rejects: Unknown fields
```

### ✅ NEW WORKFLOW (Fixed)

```
Upload Document File
        ↓
Extract Weight (Automatic)
        ↓
Look up Rate in rate_master (service_type + weight)
        ↓
Calculate Charges:
  - freight_charge = rate × pieces
  - gst_amount = freight_charge × 18%
  - fuel_surcharge = freight_charge × fuel%
        ↓
Save with CORRECT field names to database
        ↓
✅ Booking Created Successfully
```

---

## 📊 FIELD MAPPING COMPARISON

### What Changed

| Old Field     | New Field          | Source     | Notes                     |
| ------------- | ------------------ | ---------- | ------------------------- |
| `customer_id` | ❌ Removed         | -          | Not in database schema    |
| `char_wt`     | `weight`           | Document   | Extracted from file       |
| `qty`         | `pieces`           | Document   | Default 1 per consignment |
| `mode`        | `service_type`     | Input      | Air, Surface, Express     |
| `amount`      | `freight_charge`   | Calculated | From rate_master          |
| `tax_amount`  | `gst_amount`       | Calculated | freight_charge × 18%      |
| `fuel_amount` | `fuel_surcharge`   | Calculated | From rate_master          |
| `dtdc_amt`    | ❌ Removed         | -          | Calculated automatically  |
| `total`       | `total_amount`     | Calculated | Sum of all charges        |
| `receiver`    | `receiver_name`    | Input      | Full receiver details     |
| `address`     | `receiver_address` | Input      | Plus city, state, phone   |
| `pincode`     | `receiver_pincode` | Input      | Correct field name        |
| `status`      | `status`           | Auto       | "booked" (lowercase)      |

---

## 📥 NEW REQUEST FORMAT

### Endpoint

```
POST /api/bookings
```

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Request Body (Form Data)

```json
{
  "consignment_number": "CN123456",
  "booking_date": "2024-01-15",
  "service_type": "Air", // Air, Surface, Express

  "sender_name": "John Doe",
  "sender_phone": "9876543210",
  "sender_address": "123 Main Street",
  "sender_pincode": "110001",
  "sender_city": "Delhi",
  "sender_state": "Delhi",

  "receiver_name": "Jane Doe",
  "receiver_phone": "9876543211",
  "receiver_address": "456 Park Avenue",
  "receiver_pincode": "400001",
  "receiver_city": "Mumbai",
  "receiver_state": "Maharashtra",

  "content_description": "Documents & Samples",
  "declared_value": "5000",
  "other_charges": "100",
  "payment_mode": "cash", // cash, online, card, to_pay
  "remarks": "Handle with care - Fragile"
}
```

### File Upload

```
file: [Document file containing weight]
      Supported formats: .xlsx, .xls
```

---

## 💾 DATABASE STORAGE

### What Gets Saved to Bookings Table

```sql
INSERT INTO bookings (
  franchise_id,
  booking_number,        -- Auto-generated: BK-TIMESTAMP-RANDOM
  consignment_number,
  booking_date,

  -- Sender Details
  sender_name,
  sender_phone,
  sender_address,
  sender_pincode,
  sender_city,
  sender_state,

  -- Receiver Details
  receiver_name,
  receiver_phone,
  receiver_address,
  receiver_pincode,
  receiver_city,
  receiver_state,

  -- Package Details
  service_type,          -- Air, Surface, Express
  weight,                -- Extracted from document
  pieces,                -- Default 1
  content_description,
  declared_value,

  -- Billing Details (ALL CALCULATED)
  freight_charge,        -- Calculated from rate_master
  fuel_surcharge,        -- Calculated from rate_master
  gst_amount,            -- Calculated: freight_charge × 18%
  other_charges,
  total_amount,          -- Sum of all charges

  -- Payment Details
  payment_mode,
  payment_status,        -- Defaults to "unpaid"
  paid_amount,           -- Defaults to 0

  -- Status
  status,                -- "booked"
  remarks,
  created_at,            -- Auto-generated
  updated_at             -- Auto-generated
)
```

---

## 🔧 STEP-BY-STEP CREATION FLOW

### Step 1: Receive Request

```javascript
POST /api/bookings
Body: Form data + File
```

### Step 2: Validate Required Fields

```
✓ consignment_number
✓ booking_date
✓ service_type
✓ sender details (name, phone)
✓ receiver details (name, phone, pincode)
✓ file uploaded
```

### Step 3: Check Duplicate Consignment

```sql
SELECT id FROM bookings
WHERE consignment_number = ? AND franchise_id = ?
```

**If exists → Return 400 error**

### Step 4: Extract Weight from Document

```javascript
// Extract from Excel file
const weight = extractWeightFromDocument(filePath);
// Looks for: "weight", "Weight", "wt", "Wt", etc.
```

### Step 5: Fetch Rate from rate_master

```sql
SELECT * FROM rate_master
WHERE franchise_id = ?
  AND service_type = ?
  AND weight_from <= ?
  AND weight_to >= ?
  AND status = 'active'
ORDER BY weight_from DESC
LIMIT 1
```

### Step 6: Calculate All Charges

```javascript
freight_charge = rate.rate × pieces
gst_amount = freight_charge × (rate.gst_percentage / 100)
fuel_surcharge = freight_charge × (rate.fuel_surcharge / 100)
total_amount = freight_charge + gst_amount + fuel_surcharge + other_charges
```

### Step 7: Generate Booking Number

```javascript
Format: BK-[TIMESTAMP(6 digits)]-[RANDOM(4 digits)]
Example: BK-123456-7890
```

### Step 8: Save to Database

```sql
INSERT INTO bookings SET {...all data...}
```

### Step 9: Create Tracking Entry

```sql
INSERT INTO tracking SET {
  booking_id,
  consignment_number,
  status: "booked",
  location: "Origin",
  remarks: "Consignment booked successfully"
}
```

### Step 10: Return Response

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 42,
    "booking_number": "BK-123456-7890",
    "consignment_number": "CN123456",
    "weight_extracted": 2.5,
    "freight_charge": 500,
    "gst_amount": 90,
    "fuel_surcharge": 25,
    "total_amount": 615
  }
}
```

---

## 🎯 KEY IMPROVEMENTS

### 1. **No Manual Weight Input** ✅

- Document file is uploaded
- Weight automatically extracted
- No typos, no manual errors

### 2. **No Manual Charges** ✅

- All charges calculated from rate_master
- Tax calculated automatically (18% default)
- Fuel surcharge applied automatically
- No dtdc_amt field anymore

### 3. **Complete Sender/Receiver Info** ✅

- All 6 receiver fields captured
- All 6 sender fields captured
- Phone numbers, cities, states included
- Proper addresses stored

### 4. **Correct Field Names** ✅

- `service_type` (not mode)
- `weight` (not char_wt)
- `pieces` (not qty)
- `freight_charge` (not amount)
- `gst_amount` (not tax_amount)
- `fuel_surcharge` (not fuel_amount)
- `total_amount` (not total)

### 5. **Auto-Generated Values** ✅

- `booking_number` - Unique identifier
- `booking_date` - From request
- `status` - "booked"
- `payment_status` - "unpaid"
- Timestamps - Auto-generated

### 6. **Better Error Handling** ✅

- File validation
- Weight extraction errors caught
- Rate lookup failures reported
- Duplicate checking
- Proper cleanup on failure

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Backup Current File

```bash
cp backend/src/controllers/bookingController.js backend/src/controllers/bookingController.js.backup
```

### Step 2: Replace with Corrected Version

```bash
cp backend/src/controllers/bookingController_CORRECTED.js backend/src/controllers/bookingController.js
```

### Step 3: Test with Sample Data

**Sample Document (Excel):**

```
| Weight (kg) |
|-------------|
| 2.5         |
```

**Sample Request:**

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -F "consignment_number=CN123456" \
  -F "booking_date=2024-01-15" \
  -F "service_type=Air" \
  -F "sender_name=John" \
  -F "sender_phone=9876543210" \
  -F "sender_address=123 Main" \
  -F "sender_pincode=110001" \
  -F "sender_city=Delhi" \
  -F "sender_state=Delhi" \
  -F "receiver_name=Jane" \
  -F "receiver_phone=9876543211" \
  -F "receiver_address=456 Park" \
  -F "receiver_pincode=400001" \
  -F "receiver_city=Mumbai" \
  -F "receiver_state=Maharashtra" \
  -F "content_description=Documents" \
  -F "other_charges=100" \
  -F "file=@document.xlsx"
```

### Step 4: Verify Response

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 42,
    "booking_number": "BK-123456-7890",
    "weight_extracted": 2.5,
    "freight_charge": 500,
    "gst_amount": 90,
    "fuel_surcharge": 25,
    "total_amount": 615
  }
}
```

### Step 5: Check Database

```sql
SELECT * FROM bookings WHERE id = 42;
SELECT * FROM tracking WHERE booking_id = 42;
```

---

## 📝 MIGRATION CHECKLIST

- [ ] Backup current bookingController.js
- [ ] Replace with corrected version
- [ ] Restart Node.js server
- [ ] Test with sample document
- [ ] Verify database insertion
- [ ] Test rate calculation
- [ ] Test error handling
- [ ] Update API documentation
- [ ] Test with different service types (Air, Surface, Express)
- [ ] Test weight extraction from Excel
- [ ] Verify sender/receiver details saved correctly
- [ ] Test with different weight ranges
- [ ] Test duplicate consignment detection
- [ ] Test file cleanup after errors

---

## 🐛 TROUBLESHOOTING

### Error: "Document file required to extract weight"

**Solution:** Upload an Excel file with the request

### Error: "Could not extract weight from document"

**Solution:** Ensure document has a column named "weight", "Weight", "wt", or similar

### Error: "No matching rate found"

**Solution:**

- Ensure rate_master has entries for the service_type and weight range
- Check rate_master data for franchise
- Verify service_type matches exactly (case-sensitive)

### Error: "Consignment number already exists"

**Solution:** Use a unique consignment_number

### Booking created but charges are wrong

**Solution:**

- Check rate_master entries
- Verify weight extraction worked (check console logs)
- Verify calculation formula

---

## 📊 SAMPLE DATA FOR TESTING

### rate_master entries needed:

```sql
INSERT INTO rate_master (
  franchise_id, from_pincode, to_pincode, service_type,
  weight_from, weight_to, rate, fuel_surcharge, gst_percentage
) VALUES
(1, '110001', '400001', 'Air', 0, 2.5, 500, 5, 18),
(1, '110001', '400001', 'Air', 2.5, 5, 400, 5, 18),
(1, '110001', '400001', 'Surface', 0, 2.5, 300, 3, 18);
```

### Sample booking:

```json
{
  "consignment_number": "TEST001",
  "booking_date": "2024-01-15",
  "service_type": "Air",
  "sender_name": "Test Sender",
  "sender_phone": "9876543210",
  "sender_address": "123 Test St",
  "sender_pincode": "110001",
  "sender_city": "Delhi",
  "sender_state": "Delhi",
  "receiver_name": "Test Receiver",
  "receiver_phone": "9876543211",
  "receiver_address": "456 Test Ave",
  "receiver_pincode": "400001",
  "receiver_city": "Mumbai",
  "receiver_state": "Maharashtra",
  "content_description": "Test Shipment",
  "other_charges": 50,
  "payment_mode": "cash"
}
```

---

## ✅ VALIDATION CHECKLIST

After implementation, verify:

- [ ] All booking fields save to correct database columns
- [ ] Weight extracted from document correctly
- [ ] Charges calculated using rate_master
- [ ] Booking number generated automatically
- [ ] Tracking entry created
- [ ] Status is "booked" (lowercase)
- [ ] Payment status is "unpaid"
- [ ] Sender/receiver details complete
- [ ] File cleaned up after processing
- [ ] Error handling works
- [ ] Duplicate detection works
- [ ] All calculations correct

---

## 📁 FILES INVOLVED

| File                                          | Status          | Action                         |
| --------------------------------------------- | --------------- | ------------------------------ |
| `bookingController_CORRECTED.js`              | ✅ Created      | Use this                       |
| `bookingController.js`                        | ⚠️ Backup first | Replace with corrected version |
| `rateCalculationService.js`                   | ✅ OK           | No changes needed              |
| `20240101000005_create_bookings_table.cjs`    | ✅ OK           | Database schema correct        |
| `20240101000003_create_rate_master_table.cjs` | ✅ OK           | Database schema correct        |

---

## 🎯 NEXT STEPS

1. **Replace** bookingController.js with corrected version
2. **Test** with sample data
3. **Update** API documentation
4. **Deploy** to production
5. **Monitor** for any issues
6. **Update** frontend to use new format
7. **Train** team on new workflow

---

**Version:** 1.0 - Corrected  
**Created:** Today  
**Status:** Ready for Implementation  
**Next:** Update Frontend Integration
