# 📊 BOOKING CREATION - UPWARD WORKFLOW DIAGRAM

## 🎯 Complete Data Flow (Upward)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND - ADD BOOKING                        │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Form Fields:                                                  │   │
│  │ ├─ Consignment Number                                        │   │
│  │ ├─ Booking Date                                              │   │
│  │ ├─ Service Type (Air/Surface/Express) 🎯                    │   │
│  │ ├─ Sender Details (Name, Phone, Address, Pincode, City, State) │
│  │ ├─ Receiver Details (Name, Phone, Address, Pincode, City, State)│
│  │ ├─ Content Description                                       │   │
│  │ ├─ Declared Value                                            │   │
│  │ ├─ Other Charges                                             │   │
│  │ ├─ Payment Mode                                              │   │
│  │ └─ Document File Upload 📄                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│                    Submit Form + File                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  BACKEND - bookingController.js                      │
│                     createBooking() function                         │
│                                                                       │
│  ✅ Step 1: VALIDATION                                              │
│  ├─ Check all required fields present                                │
│  ├─ Check file uploaded                                              │
│  └─ Check no errors in request                                       │
│                              ↓                                        │
│  ✅ Step 2: CHECK DATABASE                                          │
│  ├─ Query: SELECT FROM bookings                                      │
│  │  WHERE consignment_number = ? AND franchise_id = ?               │
│  └─ If exists → Return Error 400                                     │
│                              ↓                                        │
│  ✅ Step 3: EXTRACT WEIGHT FROM DOCUMENT 📄                         │
│  ├─ Read Excel file                                                  │
│  ├─ Parse sheet to JSON                                              │
│  ├─ Find weight column (looks for "weight", "wt", etc.)             │
│  ├─ Extract numerical value                                          │
│  └─ Example: 2.5 kg 🎯                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              RATE LOOKUP - rateCalculationService.js                 │
│                  calculateBookingRate() function                     │
│                                                                       │
│  📊 Input Parameters:                                                │
│  ├─ franchise_id = 1                                                 │
│  ├─ sender_pincode = "110001"      (from_pincode)                   │
│  ├─ receiver_pincode = "400001"    (to_pincode)                     │
│  ├─ service_type = "Air"           🎯 (NOT mode, NOT char_wt)      │
│  ├─ weight = 2.5 kg                🎯 (extracted from doc)          │
│  ├─ pieces = 1                     (quantity)                       │
│  └─ other_charges = 100                                              │
│                              ↓                                        │
│  🔍 Query rate_master:                                              │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ SELECT * FROM rate_master WHERE                           │      │
│  │   franchise_id = 1                                        │      │
│  │   AND (from_pincode = '110001' OR from_pincode = '*')    │      │
│  │   AND (to_pincode = '400001' OR to_pincode = '*')        │      │
│  │   AND service_type = 'Air'        🎯                      │      │
│  │   AND weight_from <= 2.5          ✅                      │      │
│  │   AND weight_to >= 2.5            ✅                      │      │
│  │   AND status = 'active'                                   │      │
│  │ ORDER BY weight_from DESC                                 │      │
│  │ LIMIT 1                                                   │      │
│  └───────────────────────────────────────────────────────────┘      │
│                              ↓                                        │
│  📦 Found Rate Entry:                                                │
│  ├─ id = 42                                                          │
│  ├─ rate = 500 (per kg)              🎯                             │
│  ├─ gst_percentage = 18              🎯                             │
│  ├─ fuel_surcharge = 5 (percent)     🎯                             │
│  └─ status = "active"                                                │
│                              ↓                                        │
│  💰 CALCULATE CHARGES:                                              │
│  ├─ freight_charge = rate × pieces                                   │
│  │  = 500 × 1 = 500 ✅                                              │
│  │                                                                    │
│  ├─ gst_amount = freight_charge × (gst% / 100)                     │
│  │  = 500 × (18 / 100) = 90 ✅                                      │
│  │                                                                    │
│  ├─ fuel_surcharge = freight_charge × (fuel% / 100)                │
│  │  = 500 × (5 / 100) = 25 ✅                                       │
│  │                                                                    │
│  └─ total_amount = freight + gst + fuel + other                     │
│     = 500 + 90 + 25 + 100 = 715 ✅                                  │
│                                                                       │
│  📋 Return to Controller:                                            │
│  {                                                                    │
│    rate: 500,                                                         │
│    lineAmount: 500,          (freight_charge)                        │
│    taxAmount: 90,            (gst_amount)                            │
│    fuelAmount: 25,           (fuel_surcharge)                        │
│    netAmount: 715,           (total_amount)                          │
│    gstPercent: 18,                                                    │
│    fuelPercent: 5,                                                    │
│    rateMasterId: 42                                                   │
│  }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              BACKEND - BUILD BOOKING DATA                            │
│                                                                       │
│  ✅ Step 7: BUILD BOOKING DATA WITH CORRECT FIELDS                  │
│                                                                       │
│  const bookingData = {                                               │
│    franchise_id: 1,                                                  │
│    booking_number: "BK-123456-7890",     🎯 Auto-generated         │
│    consignment_number: "CN123456",                                   │
│    booking_date: "2024-01-15",                                       │
│                                                                       │
│    // 📋 SENDER DETAILS - ALL FIELDS                                │
│    sender_name: "John Doe",                                          │
│    sender_phone: "9876543210",                                       │
│    sender_address: "123 Main Street",                                │
│    sender_pincode: "110001",                                         │
│    sender_city: "Delhi",                                             │
│    sender_state: "Delhi",                                            │
│                                                                       │
│    // 📋 RECEIVER DETAILS - ALL FIELDS                              │
│    receiver_name: "Jane Doe",                                        │
│    receiver_phone: "9876543211",                                     │
│    receiver_address: "456 Park Avenue",                              │
│    receiver_pincode: "400001",                                       │
│    receiver_city: "Mumbai",                                          │
│    receiver_state: "Maharashtra",                                    │
│                                                                       │
│    // 📦 PACKAGE DETAILS                                            │
│    service_type: "Air",                 🎯 (correct field name)     │
│    weight: 2.5,                         🎯 (from document)          │
│    pieces: 1,                           🎯 (correct field name)     │
│    content_description: "Documents",                                 │
│    declared_value: 5000,                                             │
│                                                                       │
│    // 💰 BILLING DETAILS - ALL CALCULATED                           │
│    freight_charge: 500,                 🎯 (calculated)             │
│    fuel_surcharge: 25,                  🎯 (calculated)             │
│    gst_amount: 90,                      🎯 (calculated)             │
│    other_charges: 100,                                               │
│    total_amount: 715,                   🎯 (calculated)             │
│                                                                       │
│    // 💳 PAYMENT DETAILS                                            │
│    payment_mode: "cash",                                             │
│    payment_status: "unpaid",            🎯 (default)                │
│    paid_amount: 0,                      🎯 (default)                │
│                                                                       │
│    // 📊 STATUS                                                     │
│    status: "booked",                    🎯 (lowercase)              │
│    remarks: "Handle with care",                                      │
│  }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE - INSERT BOOKING                         │
│                                                                       │
│  ✅ Step 8: INSERT INTO BOOKINGS TABLE                              │
│                                                                       │
│  SQL Query:                                                           │
│  INSERT INTO bookings SET {                                          │
│    franchise_id = 1,                                                 │
│    booking_number = "BK-123456-7890",                                │
│    consignment_number = "CN123456",                                  │
│    booking_date = "2024-01-15",                                      │
│                                                                       │
│    sender_name = "John Doe",                                         │
│    sender_phone = "9876543210",                                      │
│    sender_address = "123 Main Street",                               │
│    sender_pincode = "110001",                                        │
│    sender_city = "Delhi",                                            │
│    sender_state = "Delhi",                                           │
│                                                                       │
│    receiver_name = "Jane Doe",                                       │
│    receiver_phone = "9876543211",                                    │
│    receiver_address = "456 Park Avenue",                             │
│    receiver_pincode = "400001",                                      │
│    receiver_city = "Mumbai",                                         │
│    receiver_state = "Maharashtra",                                   │
│                                                                       │
│    service_type = "Air",                                             │
│    weight = 2.5,                                                     │
│    pieces = 1,                                                       │
│    content_description = "Documents",                                │
│    declared_value = 5000,                                            │
│                                                                       │
│    freight_charge = 500,                                             │
│    fuel_surcharge = 25,                                              │
│    gst_amount = 90,                                                  │
│    other_charges = 100,                                              │
│    total_amount = 715,                                               │
│                                                                       │
│    payment_mode = "cash",                                            │
│    payment_status = "unpaid",                                        │
│    paid_amount = 0,                                                  │
│                                                                       │
│    status = "booked",                                                │
│    remarks = "Handle with care"                                      │
│  }                                                                    │
│                                                                       │
│  Result: ✅ Inserted with ID = 42                                   │
│                                                                       │
│  Bookings Table Now Has:                                             │
│  ├─ id = 42                                                          │
│  ├─ All sender details ✅                                           │
│  ├─ All receiver details ✅                                         │
│  ├─ Correct field names ✅                                          │
│  ├─ Calculated charges ✅                                           │
│  └─ Auto-timestamps ✅                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE - INSERT TRACKING                        │
│                                                                       │
│  ✅ Step 9: CREATE INITIAL TRACKING ENTRY                           │
│                                                                       │
│  INSERT INTO tracking SET {                                          │
│    booking_id = 42,                                                  │
│    consignment_number = "CN123456",                                  │
│    status = "booked",                                                │
│    location = "Origin",                                              │
│    remarks = "Consignment booked successfully",                      │
│    status_date = NOW(),                                              │
│    updated_by = "admin"                                              │
│  }                                                                    │
│                                                                       │
│  Result: ✅ Tracking entry created                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        API RESPONSE                                  │
│                                                                       │
│  HTTP 201 CREATED                                                    │
│                                                                       │
│  {                                                                    │
│    "success": true,                                                  │
│    "message": "Booking created successfully",                        │
│    "data": {                                                         │
│      "id": 42,                                                       │
│      "booking_number": "BK-123456-7890",  ✅                        │
│      "consignment_number": "CN123456",    ✅                        │
│      "weight_extracted": 2.5,             ✅ From document          │
│      "freight_charge": 500,               ✅ Calculated             │
│      "gst_amount": 90,                    ✅ Calculated             │
│      "fuel_surcharge": 25,                ✅ Calculated             │
│      "total_amount": 715                  ✅ Calculated             │
│    }                                                                  │
│  }                                                                    │
│                                                                       │
│  ✅ BOOKING CREATED SUCCESSFULLY!                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comparison: OLD vs NEW

### ❌ OLD WORKFLOW (BROKEN)

```
Frontend Form
    ↓
    ├─ User enters: char_wt = 2.5 (manual) ❌
    ├─ User enters: dtdc_amt = 200 (manual) ❌
    └─ User enters: mode = "AR" (wrong field) ❌
    ↓
Backend Controller
    ↓
    ├─ Tries INSERT with: char_wt, dtdc_amt, mode ❌
    └─ Database field names:  weight, NOT char_wt ❌
    ↓
DATABASE ERROR ❌
"Unknown column 'char_wt' in field list"
```

### ✅ NEW WORKFLOW (FIXED)

```
Frontend Form + Document
    ↓
    ├─ User enters: All details + uploads document 📄
    └─ NO manual weight ✅
       NO manual charges ✅
    ↓
Backend Controller
    ↓
    ├─ Extracts weight from document: 2.5 kg ✅
    ├─ Looks up rate in rate_master ✅
    ├─ Calculates charges automatically ✅
    │  - freight_charge = 500
    │  - gst_amount = 90
    │  - fuel_surcharge = 25
    └─ Sends correct field names ✅
    ↓
Database Insertion
    ↓
    ├─ weight = 2.5 ✅
    ├─ freight_charge = 500 ✅
    ├─ gst_amount = 90 ✅
    ├─ fuel_surcharge = 25 ✅
    └─ service_type = "Air" ✅
    ↓
✅ BOOKING CREATED SUCCESSFULLY!
```

---

## 📊 DATA TRANSFORMATION TABLE

### From Frontend Input to Database Storage

| Frontend Input       | Processing     | Database Storage         |
| -------------------- | -------------- | ------------------------ |
| Service Type: "Air"  | Validated      | service_type: "Air"      |
| Document File        | Extract weight | weight: 2.5              |
| (No char_wt input)   | -              | pieces: 1                |
| (No dtdc_amt input)  | Look up rate   | freight_charge: 500      |
| (No tax input)       | Calculate 18%  | gst_amount: 90           |
| (No fuel input)      | Calculate 5%   | fuel_surcharge: 25       |
| other_charges: 100   | Sum            | total_amount: 715        |
| Payment Mode: "cash" | Validate       | payment_mode: "cash"     |
| (Not provided)       | Default        | payment_status: "unpaid" |
| (Not provided)       | Default        | status: "booked"         |

---

## 🎯 KEY TRANSFORMATION POINTS

### 1️⃣ Weight Extraction

```
Document File (Excel)
    ↓
extractWeightFromDocument()
    ↓
Find column: "weight", "Weight", "wt"
    ↓
Extract value: 2.5
    ↓
Database field: weight = 2.5 ✅
```

### 2️⃣ Rate Lookup

```
Parameters:
  - franchise_id = 1
  - from_pincode = "110001"
  - to_pincode = "400001"
  - service_type = "Air"
  - weight = 2.5
    ↓
Query rate_master
    ↓
Find matching rate record
    ↓
Return: {rate: 500, gst%: 18, fuel%: 5}
```

### 3️⃣ Charge Calculation

```
freight_charge = rate × pieces
                = 500 × 1 = 500 ✅

gst_amount = freight_charge × (gst% / 100)
            = 500 × 0.18 = 90 ✅

fuel_surcharge = freight_charge × (fuel% / 100)
                = 500 × 0.05 = 25 ✅

total_amount = freight + gst + fuel + other
             = 500 + 90 + 25 + 100 = 715 ✅
```

### 4️⃣ Field Name Mapping

```
OLD → NEW
char_wt → weight
qty → pieces
mode → service_type
amount → freight_charge
tax_amount → gst_amount
fuel_amount → fuel_surcharge
total → total_amount
(No dtdc_amt) → (Calculated automatically)
```

---

## ✅ VERIFICATION CHECKLIST

After booking creation, verify in database:

```sql
SELECT * FROM bookings WHERE id = 42;

✅ booking_number populated
✅ sender_name, sender_phone, etc. populated
✅ receiver_name, receiver_phone, etc. populated
✅ service_type = "Air"
✅ weight = 2.5
✅ freight_charge = 500
✅ gst_amount = 90
✅ fuel_surcharge = 25
✅ total_amount = 715
✅ status = "booked"
✅ payment_status = "unpaid"

SELECT * FROM tracking WHERE booking_id = 42;

✅ Status = "booked"
✅ Location = "Origin"
✅ status_date populated
```

---

## 🚀 COMPLETE FLOW SUMMARY

```
1. Frontend submits form + document
    ↓
2. Backend validates all inputs
    ↓
3. Check duplicate consignment
    ↓
4. Extract weight from document 📄
    ↓
5. Look up rate in rate_master 📊
    ↓
6. Calculate all charges 💰
    ↓
7. Generate booking number 🎫
    ↓
8. Save to bookings table 💾
    ↓
9. Create tracking entry 📍
    ↓
10. Return response to frontend ✅
    ↓
✨ COMPLETE BOOKING CREATED ✨
```

---

**Status:** ✅ Corrected Workflow Ready  
**Flow:** Upward (Document → Rate Master → Database)  
**All Charges:** Calculated Automatically  
**Manual Input:** Eliminated  
**Database Fields:** Correct Mapping
