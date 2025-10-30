# 🚀 End-to-End Test Data: Complete RateMaster → Booking → Invoice Workflow

This document provides **COMPLETE TEST DATA** with actual numbers flowing through the entire system.

---

## 📋 Table of Contents

1. [Step 1: Setup - RateMaster Data](#step-1-ratemaster-data)
2. [Step 2: Booking Creation with Auto-Calculation](#step-2-booking-creation)
3. [Step 3: Invoice Generation](#step-3-invoice-generation)
4. [Step 4: Verification Queries](#step-4-verification)
5. [API Testing Examples](#api-testing)

---

## STEP 1: RateMaster Data Setup

### Scenario: Courier Company "FastShip Express"

**Insert RateMaster Entries:**

```sql
-- ========================================
-- RATEMASTER SETUP FOR TESTING
-- ========================================

-- Clear existing test data
DELETE FROM rate_master WHERE franchise_id IN (SELECT id FROM franchises WHERE name LIKE '%FastShip%');

-- Get or Create Franchise
INSERT INTO franchises (name, city, state, contact_person, mobile, email, status, created_at, updated_at)
VALUES ('FastShip Express', 'Mumbai', 'Maharashtra', 'Rajesh Kumar', '9876543210', 'rajesh@fastship.com', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Get the franchise ID
SET @franchise_id = (SELECT id FROM franchises WHERE name = 'FastShip Express' LIMIT 1);

-- ========================================
-- AIR + DOC RATES (Priority Service)
-- ========================================

-- Air + Doc: Light (0-5kg) - Metro to Metro
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Air', '*', '*',
  0, 5, 50, 18, 5, 'active'
);

-- Air + Doc: Medium (5-10kg) - Metro to Metro
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Air', '*', '*',
  5, 10, 80, 18, 5, 'active'
);

-- Air + Doc: Heavy (10-20kg) - Metro to Metro
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Air', '*', '*',
  10, 20, 120, 18, 5, 'active'
);

-- ========================================
-- AIR + NON-DOC RATES
-- ========================================

-- Air + Non-Doc: Light (0-5kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Air', '*', '*',
  0, 5, 100, 18, 8, 'active'
);

-- Air + Non-Doc: Medium (5-10kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Air', '*', '*',
  5, 10, 160, 18, 8, 'active'
);

-- Air + Non-Doc: Heavy (10-20kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Air', '*', '*',
  10, 20, 250, 18, 8, 'active'
);

-- ========================================
-- SURFACE + DOC RATES (Economy Service)
-- ========================================

-- Surface + Doc: Light (0-5kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Surface', '*', '*',
  0, 5, 25, 18, 2, 'active'
);

-- Surface + Doc: Medium (5-10kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Surface', '*', '*',
  5, 10, 40, 18, 2, 'active'
);

-- Surface + Doc: Heavy (10-20kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'Doc', 'Surface', '*', '*',
  10, 20, 60, 18, 2, 'active'
);

-- ========================================
-- SURFACE + NON-DOC RATES
-- ========================================

-- Surface + Non-Doc: Light (0-5kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Surface', '*', '*',
  0, 5, 50, 18, 3, 'active'
);

-- Surface + Non-Doc: Medium (5-10kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Surface', '*', '*',
  5, 10, 80, 18, 3, 'active'
);

-- Surface + Non-Doc: Heavy (10-20kg)
INSERT INTO rate_master (
  franchise_id, type, mode, from_pincode, to_pincode,
  weight_from, weight_to, rate, gst_percentage, fuel_surcharge, status
) VALUES (
  @franchise_id, 'NonDoc', 'Surface', '*', '*',
  10, 20, 120, 18, 3, 'active'
);
```

### Verify RateMaster Data

```sql
-- View all inserted rates
SELECT
  id, type, mode,
  CONCAT('₹', rate) as rate_per_kg,
  CONCAT(gst_percentage, '%') as gst,
  CONCAT(fuel_surcharge, '%') as fuel,
  weight_from, weight_to
FROM rate_master
WHERE franchise_id = @franchise_id
ORDER BY type, mode, weight_from;
```

**Expected Output:**

```
id  type    mode     rate_per_kg  gst   fuel   weight_from  weight_to
1   Doc     Air      ₹50          18%   5%     0            5
2   Doc     Air      ₹80          18%   5%     5            10
3   Doc     Air      ₹120         18%   5%     10           20
4   NonDoc  Air      ₹100         18%   8%     0            5
5   NonDoc  Air      ₹160         18%   8%     5            10
6   NonDoc  Air      ₹250         18%   8%     10           20
7   Doc     Surface  ₹25          18%   2%     0            5
8   Doc     Surface  ₹40          18%   2%     5            10
9   Doc     Surface  ₹60          18%   2%     10           20
10  NonDoc  Surface  ₹50          18%   3%     0            5
11  NonDoc  Surface  ₹80          18%   3%     5            10
12  NonDoc  Surface  ₹120         18%   3%     10           20
```

---

## STEP 2: Booking Creation with Auto-Calculation

### Test Booking Scenario 1: Air + Doc (Urgent Document)

**Booking Input Data:**

```json
{
  "consignment_no": "FASTSHIP-DOC-001",
  "customer_id": 101,
  "type": "Doc",
  "mode": "Air",
  "weight": 3,
  "quantity": 1,
  "from_pincode": "400001",
  "to_pincode": "110001",
  "destination": "New Delhi",
  "description": "Important Legal Document"
}
```

**Auto-Calculation Process:**

```
STEP 1: Query RateMaster
━━━━━━━━━━━━━━━━━━━━━━━━
- Type: Doc
- Mode: Air
- Weight: 3 kg (falls in range 0-5)
- Result: Found rate = ₹50/kg

STEP 2: Calculate Line Amount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- lineAmount = rate × quantity
- lineAmount = ₹50 × 1
- lineAmount = ₹50.00

STEP 3: Calculate GST (Tax)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GST Percentage: 18%
- taxAmount = lineAmount × (18/100)
- taxAmount = ₹50.00 × 0.18
- taxAmount = ₹9.00

STEP 4: Calculate Fuel Surcharge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fuel Percentage: 5%
- fuelAmount = lineAmount × (5/100)
- fuelAmount = ₹50.00 × 0.05
- fuelAmount = ₹2.50

STEP 5: Calculate Final Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- netAmount = lineAmount + taxAmount + fuelAmount
- netAmount = ₹50.00 + ₹9.00 + ₹2.50
- netAmount = ₹61.50
```

**Booking Data Stored in Database:**

```sql
INSERT INTO bookings (
  consignment_number, customer_id, type, mode, weight, quantity,
  from_pincode, to_pincode, destination, description,
  amount, tax_amount, fuel_amount, gst_percent, fuel_percent,
  rate, rate_master_id, franchise_id, status,
  created_at, updated_at
) VALUES (
  'FASTSHIP-DOC-001', 101, 'Doc', 'Air', 3, 1,
  '400001', '110001', 'New Delhi', 'Important Legal Document',
  50.00, 9.00, 2.50, 18, 5,
  50, 1, @franchise_id, 'Unbilled',
  NOW(), NOW()
);
```

---

### Test Booking Scenario 2: Air + Non-Doc (Parcel)

**Booking Input Data:**

```json
{
  "consignment_no": "FASTSHIP-PKG-001",
  "customer_id": 102,
  "type": "NonDoc",
  "mode": "Air",
  "weight": 7,
  "quantity": 2,
  "from_pincode": "400001",
  "to_pincode": "500001",
  "destination": "Hyderabad",
  "description": "Electronics Package - 2 units"
}
```

**Auto-Calculation Process:**

```
STEP 1: Query RateMaster
━━━━━━━━━━━━━━━━━━━━━━━━
- Type: NonDoc
- Mode: Air
- Weight: 7 kg (falls in range 5-10)
- Result: Found rate = ₹160/kg

STEP 2: Calculate Line Amount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- lineAmount = rate × quantity
- lineAmount = ₹160 × 2
- lineAmount = ₹320.00

STEP 3: Calculate GST (Tax)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GST Percentage: 18%
- taxAmount = lineAmount × (18/100)
- taxAmount = ₹320.00 × 0.18
- taxAmount = ₹57.60

STEP 4: Calculate Fuel Surcharge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fuel Percentage: 8%
- fuelAmount = lineAmount × (8/100)
- fuelAmount = ₹320.00 × 0.08
- fuelAmount = ₹25.60

STEP 5: Calculate Final Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- netAmount = lineAmount + taxAmount + fuelAmount
- netAmount = ₹320.00 + ₹57.60 + ₹25.60
- netAmount = ₹403.20
```

**Booking Data Stored:**

```sql
INSERT INTO bookings (
  consignment_number, customer_id, type, mode, weight, quantity,
  from_pincode, to_pincode, destination, description,
  amount, tax_amount, fuel_amount, gst_percent, fuel_percent,
  rate, rate_master_id, franchise_id, status,
  created_at, updated_at
) VALUES (
  'FASTSHIP-PKG-001', 102, 'NonDoc', 'Air', 7, 2,
  '400001', '500001', 'Hyderabad', 'Electronics Package - 2 units',
  320.00, 57.60, 25.60, 18, 8,
  160, 5, @franchise_id, 'Unbilled',
  NOW(), NOW()
);
```

---

### Test Booking Scenario 3: Surface + Doc (Regular Document)

**Booking Input Data:**

```json
{
  "consignment_no": "FASTSHIP-DOC-002",
  "customer_id": 101,
  "type": "Doc",
  "mode": "Surface",
  "weight": 2,
  "quantity": 3,
  "from_pincode": "400001",
  "to_pincode": "700001",
  "destination": "Kolkata",
  "description": "Invoice Documents x3"
}
```

**Auto-Calculation Process:**

```
STEP 1: Query RateMaster
━━━━━━━━━━━━━━━━━━━━━━━━
- Type: Doc
- Mode: Surface
- Weight: 2 kg (falls in range 0-5)
- Result: Found rate = ₹25/kg

STEP 2: Calculate Line Amount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- lineAmount = rate × quantity
- lineAmount = ₹25 × 3
- lineAmount = ₹75.00

STEP 3: Calculate GST (Tax)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GST Percentage: 18%
- taxAmount = lineAmount × (18/100)
- taxAmount = ₹75.00 × 0.18
- taxAmount = ₹13.50

STEP 4: Calculate Fuel Surcharge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fuel Percentage: 2%
- fuelAmount = lineAmount × (2/100)
- fuelAmount = ₹75.00 × 0.02
- fuelAmount = ₹1.50

STEP 5: Calculate Final Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- netAmount = lineAmount + taxAmount + fuelAmount
- netAmount = ₹75.00 + ₹13.50 + ₹1.50
- netAmount = ₹90.00
```

**Booking Data Stored:**

```sql
INSERT INTO bookings (
  consignment_number, customer_id, type, mode, weight, quantity,
  from_pincode, to_pincode, destination, description,
  amount, tax_amount, fuel_amount, gst_percent, fuel_percent,
  rate, rate_master_id, franchise_id, status,
  created_at, updated_at
) VALUES (
  'FASTSHIP-DOC-002', 101, 'Doc', 'Surface', 2, 3,
  '400001', '700001', 'Kolkata', 'Invoice Documents x3',
  75.00, 13.50, 1.50, 18, 2,
  25, 7, @franchise_id, 'Unbilled',
  NOW(), NOW()
);
```

---

### Test Booking Scenario 4: Surface + Non-Doc (Bulk Order)

**Booking Input Data:**

```json
{
  "consignment_no": "FASTSHIP-PKG-002",
  "customer_id": 102,
  "type": "NonDoc",
  "mode": "Surface",
  "weight": 15,
  "quantity": 5,
  "from_pincode": "400001",
  "to_pincode": "560001",
  "destination": "Bangalore",
  "description": "Office Supplies - Bulk Order"
}
```

**Auto-Calculation Process:**

```
STEP 1: Query RateMaster
━━━━━━━━━━━━━━━━━━━━━━━━
- Type: NonDoc
- Mode: Surface
- Weight: 15 kg (falls in range 10-20)
- Result: Found rate = ₹120/kg

STEP 2: Calculate Line Amount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- lineAmount = rate × quantity
- lineAmount = ₹120 × 5
- lineAmount = ₹600.00

STEP 3: Calculate GST (Tax)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- GST Percentage: 18%
- taxAmount = lineAmount × (18/100)
- taxAmount = ₹600.00 × 0.18
- taxAmount = ₹108.00

STEP 4: Calculate Fuel Surcharge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fuel Percentage: 3%
- fuelAmount = lineAmount × (3/100)
- fuelAmount = ₹600.00 × 0.03
- fuelAmount = ₹18.00

STEP 5: Calculate Final Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- netAmount = lineAmount + taxAmount + fuelAmount
- netAmount = ₹600.00 + ₹108.00 + ₹18.00
- netAmount = ₹726.00
```

**Booking Data Stored:**

```sql
INSERT INTO bookings (
  consignment_number, customer_id, type, mode, weight, quantity,
  from_pincode, to_pincode, destination, description,
  amount, tax_amount, fuel_amount, gst_percent, fuel_percent,
  rate, rate_master_id, franchise_id, status,
  created_at, updated_at
) VALUES (
  'FASTSHIP-PKG-002', 102, 'NonDoc', 'Surface', 15, 5,
  '400001', '560001', 'Bangalore', 'Office Supplies - Bulk Order',
  600.00, 108.00, 18.00, 18, 3,
  120, 12, @franchise_id, 'Unbilled',
  NOW(), NOW()
);
```

---

### View All Bookings Created

```sql
SELECT
  id,
  consignment_number,
  customer_id,
  type,
  mode,
  weight,
  quantity,
  CONCAT('₹', ROUND(amount, 2)) as line_amount,
  CONCAT('₹', ROUND(tax_amount, 2)) as gst,
  CONCAT('₹', ROUND(fuel_amount, 2)) as fuel,
  CONCAT('₹', ROUND(amount + tax_amount + fuel_amount, 2)) as total,
  status,
  destination
FROM bookings
WHERE franchise_id = @franchise_id
ORDER BY created_at DESC;
```

**Expected Output:**

```
id  consignment_number     customer_id  type    mode     weight  qty  line_amount  gst      fuel    total      status    destination
4   FASTSHIP-PKG-002       102          NonDoc  Surface  15      5    ₹600.00      ₹108.00  ₹18.00  ₹726.00    Unbilled  Bangalore
3   FASTSHIP-DOC-002       101          Doc     Surface  2       3    ₹75.00       ₹13.50   ₹1.50   ₹90.00     Unbilled  Kolkata
2   FASTSHIP-PKG-001       102          NonDoc  Air      7       2    ₹320.00      ₹57.60   ₹25.60  ₹403.20    Unbilled  Hyderabad
1   FASTSHIP-DOC-001       101          Doc     Air      3       1    ₹50.00       ₹9.00    ₹2.50   ₹61.50     Unbilled  New Delhi
```

---

## STEP 3: Invoice Generation

### Scenario A: Single Invoice from Multiple Bookings (Customer 101)

**Trigger Generation:**

```sql
-- Customer 101 has 2 bookings (DOC-001 and DOC-002)
SELECT
  id, consignment_number, amount, tax_amount, fuel_amount
FROM bookings
WHERE customer_id = 101 AND invoice_id IS NULL AND franchise_id = @franchise_id;
```

**Expected Pre-Generation State:**

```
id  consignment_number  amount   tax_amount  fuel_amount
1   FASTSHIP-DOC-001    50.00    9.00        2.50
3   FASTSHIP-DOC-002    75.00    13.50       1.50
```

**Invoice Calculation (NO RECALCULATION - JUST AGGREGATION):**

```
┌─────────────────────────────────────────────────────┐
│ INVOICE GENERATION FOR CUSTOMER 101                 │
└─────────────────────────────────────────────────────┘

BOOKING 1: FASTSHIP-DOC-001 (Air + Doc)
  Line Amount:    ₹50.00
  GST (18%):      ₹9.00
  Fuel (5%):      ₹2.50
  ──────────────────────
  Total:          ₹61.50

BOOKING 2: FASTSHIP-DOC-002 (Surface + Doc)
  Line Amount:    ₹75.00
  GST (18%):      ₹13.50
  Fuel (2%):      ₹1.50
  ──────────────────────
  Total:          ₹90.00

═════════════════════════════════════════════
INVOICE TOTALS (AGGREGATED - NO RECALCULATION)
═════════════════════════════════════════════
  Sub Total (Line Amount):    ₹50.00 + ₹75.00   = ₹125.00
  GST Total:                  ₹9.00  + ₹13.50   = ₹22.50
  Fuel Total:                 ₹2.50  + ₹1.50    = ₹4.00
  Other Charges:              ₹0.00  + ₹0.00    = ₹0.00
  ──────────────────────────────────────────────
  INVOICE TOTAL:                                ₹151.50

✅ KEY POINT: GST NOT RECALCULATED
   - We used pre-calculated ₹22.50 from bookings
   - Did NOT recalculate: ₹125 × 18% = ₹22.50 (would be same)
   - This prevents double-taxation if rates change
```

**SQL to Insert Invoice:**

```sql
-- Create Invoice Record
INSERT INTO invoices (
  franchise_id,
  customer_id,
  invoice_number,
  invoice_date,
  due_date,
  sub_total,
  gst_total,
  fuel_total,
  other_charges,
  net_amount,
  status,
  created_at,
  updated_at
) VALUES (
  @franchise_id,
  101,
  'INV-2024-001',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 15 DAY),
  125.00,      -- Pre-calculated from bookings
  22.50,       -- Pre-calculated from bookings
  4.00,        -- Pre-calculated from bookings
  0.00,        -- No additional charges
  151.50,      -- Total: 125 + 22.50 + 4
  'Generated',
  NOW(),
  NOW()
);

SET @invoice_id_1 = LAST_INSERT_ID();

-- Create Invoice Items (one per booking)
INSERT INTO invoice_items (
  invoice_id,
  booking_id,
  consignment_number,
  description,
  quantity,
  unit_price,
  line_amount,
  tax_amount,
  fuel_amount,
  item_total,
  created_at,
  updated_at
) VALUES
(
  @invoice_id_1,
  1,
  'FASTSHIP-DOC-001',
  'Important Legal Document - Air Service',
  1,
  50.00,        -- lineAmount / quantity = 50 / 1
  50.00,
  9.00,
  2.50,
  61.50,
  NOW(),
  NOW()
),
(
  @invoice_id_1,
  3,
  'FASTSHIP-DOC-002',
  'Invoice Documents x3 - Surface Service',
  3,
  25.00,        -- lineAmount / quantity = 75 / 3
  75.00,
  13.50,
  1.50,
  90.00,
  NOW(),
  NOW()
);

-- Update Bookings to mark as Billed
UPDATE bookings
SET invoice_id = @invoice_id_1, status = 'Billed'
WHERE id IN (1, 3);
```

---

### Scenario B: Single Invoice from Multiple Bookings (Customer 102)

**Trigger Generation:**

```sql
-- Customer 102 has 2 bookings (PKG-001 and PKG-002)
SELECT
  id, consignment_number, amount, tax_amount, fuel_amount
FROM bookings
WHERE customer_id = 102 AND invoice_id IS NULL AND franchise_id = @franchise_id;
```

**Expected Pre-Generation State:**

```
id  consignment_number  amount    tax_amount  fuel_amount
2   FASTSHIP-PKG-001    320.00    57.60       25.60
4   FASTSHIP-PKG-002    600.00    108.00      18.00
```

**Invoice Calculation:**

```
┌─────────────────────────────────────────────────────┐
│ INVOICE GENERATION FOR CUSTOMER 102                 │
└─────────────────────────────────────────────────────┘

BOOKING 1: FASTSHIP-PKG-001 (Air + NonDoc)
  Line Amount:    ₹320.00
  GST (18%):      ₹57.60
  Fuel (8%):      ₹25.60
  ──────────────────────
  Total:          ₹403.20

BOOKING 2: FASTSHIP-PKG-002 (Surface + NonDoc)
  Line Amount:    ₹600.00
  GST (18%):      ₹108.00
  Fuel (3%):      ₹18.00
  ──────────────────────
  Total:          ₹726.00

═════════════════════════════════════════════
INVOICE TOTALS (AGGREGATED - NO RECALCULATION)
═════════════════════════════════════════════
  Sub Total (Line Amount):    ₹320.00 + ₹600.00  = ₹920.00
  GST Total:                  ₹57.60  + ₹108.00  = ₹165.60
  Fuel Total:                 ₹25.60  + ₹18.00   = ₹43.60
  Other Charges:              ₹0.00   + ₹0.00    = ₹0.00
  ──────────────────────────────────────────────
  INVOICE TOTAL:                                ₹1,129.20

✅ NO RECALCULATION
   - GST: ₹165.60 is sum of pre-calculated amounts
   - Fuel: ₹43.60 is sum of pre-calculated amounts
   - Result is accurate and audit-traceable
```

**SQL to Insert Invoice:**

```sql
-- Create Invoice Record
INSERT INTO invoices (
  franchise_id,
  customer_id,
  invoice_number,
  invoice_date,
  due_date,
  sub_total,
  gst_total,
  fuel_total,
  other_charges,
  net_amount,
  status,
  created_at,
  updated_at
) VALUES (
  @franchise_id,
  102,
  'INV-2024-002',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 15 DAY),
  920.00,       -- Pre-calculated: 320 + 600
  165.60,       -- Pre-calculated: 57.60 + 108
  43.60,        -- Pre-calculated: 25.60 + 18
  0.00,
  1129.20,      -- Total: 920 + 165.60 + 43.60
  'Generated',
  NOW(),
  NOW()
);

SET @invoice_id_2 = LAST_INSERT_ID();

-- Create Invoice Items
INSERT INTO invoice_items (
  invoice_id,
  booking_id,
  consignment_number,
  description,
  quantity,
  unit_price,
  line_amount,
  tax_amount,
  fuel_amount,
  item_total,
  created_at,
  updated_at
) VALUES
(
  @invoice_id_2,
  2,
  'FASTSHIP-PKG-001',
  'Electronics Package - 2 units - Air Service',
  2,
  160.00,       -- lineAmount / quantity = 320 / 2
  320.00,
  57.60,
  25.60,
  403.20,
  NOW(),
  NOW()
),
(
  @invoice_id_2,
  4,
  'FASTSHIP-PKG-002',
  'Office Supplies - Bulk Order - Surface Service',
  5,
  120.00,       -- lineAmount / quantity = 600 / 5
  600.00,
  108.00,
  18.00,
  726.00,
  NOW(),
  NOW()
);

-- Update Bookings to mark as Billed
UPDATE bookings
SET invoice_id = @invoice_id_2, status = 'Billed'
WHERE id IN (2, 4);
```

---

## STEP 4: Verification Queries

### Verify Complete Workflow

```sql
-- ========================================
-- VERIFICATION 1: RateMaster Setup
-- ========================================
SELECT COUNT(*) as total_rates FROM rate_master WHERE franchise_id = @franchise_id;
-- Expected: 12

-- ========================================
-- VERIFICATION 2: Bookings Created
-- ========================================
SELECT
  COUNT(*) as total_bookings,
  SUM(amount) as total_line_amount,
  SUM(tax_amount) as total_gst,
  SUM(fuel_amount) as total_fuel,
  SUM(amount + tax_amount + fuel_amount) as grand_total
FROM bookings
WHERE franchise_id = @franchise_id;
-- Expected: 4 bookings, ₹1,045.00 + ₹188.10 + ₹47.60 = ₹1,280.70

-- ========================================
-- VERIFICATION 3: Invoices Generated
-- ========================================
SELECT
  id,
  invoice_number,
  customer_id,
  CONCAT('₹', ROUND(sub_total, 2)) as sub_total,
  CONCAT('₹', ROUND(gst_total, 2)) as gst,
  CONCAT('₹', ROUND(fuel_total, 2)) as fuel,
  CONCAT('₹', ROUND(net_amount, 2)) as total,
  status
FROM invoices
WHERE franchise_id = @franchise_id;
-- Expected: 2 invoices (Cust 101 & Cust 102)

-- ========================================
-- VERIFICATION 4: Bookings -> Invoices Mapping
-- ========================================
SELECT
  b.id,
  b.consignment_number,
  b.customer_id,
  CONCAT('₹', ROUND(b.amount + b.tax_amount + b.fuel_amount, 2)) as booking_total,
  i.invoice_number,
  b.status
FROM bookings b
LEFT JOIN invoices i ON b.invoice_id = i.id
WHERE b.franchise_id = @franchise_id
ORDER BY b.customer_id, b.id;
-- Expected: All bookings linked to invoices with status = 'Billed'

-- ========================================
-- VERIFICATION 5: Invoice Line Items
-- ========================================
SELECT
  ii.id,
  ii.invoice_id,
  i.invoice_number,
  ii.consignment_number,
  ii.quantity,
  CONCAT('₹', ii.unit_price) as unit_price,
  CONCAT('₹', ROUND(ii.line_amount, 2)) as line_amount,
  CONCAT('₹', ROUND(ii.tax_amount, 2)) as tax,
  CONCAT('₹', ROUND(ii.fuel_amount, 2)) as fuel,
  CONCAT('₹', ROUND(ii.item_total, 2)) as item_total
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.franchise_id = @franchise_id
ORDER BY i.id, ii.id;

-- ========================================
-- VERIFICATION 6: Complete Flow View
-- ========================================
SELECT
  'BOOKINGS' as stage,
  COUNT(*) as count,
  CONCAT('₹', ROUND(SUM(amount + tax_amount + fuel_amount), 2)) as total
FROM bookings
WHERE franchise_id = @franchise_id
UNION ALL
SELECT
  'INVOICES' as stage,
  COUNT(*) as count,
  CONCAT('₹', ROUND(SUM(net_amount), 2)) as total
FROM invoices
WHERE franchise_id = @franchise_id;

-- ========================================
-- VERIFICATION 7: Audit Trail Check
-- ========================================
SELECT
  id,
  consignment_number,
  amount as line_amount,
  rate,
  gst_percent,
  tax_amount,
  fuel_percent,
  fuel_amount,
  amount + tax_amount + fuel_amount as total,
  status
FROM bookings
WHERE franchise_id = @franchise_id
ORDER BY id;
-- Shows complete calculation breakdown for audit
```

---

## STEP 5: API Testing Examples

### API 1: Create Booking with Auto-Calculation

**POST** `/api/bookings/create`

```json
{
  "consignment_no": "FASTSHIP-DOC-001",
  "customer_id": 101,
  "type": "Doc",
  "mode": "Air",
  "weight": 3,
  "quantity": 1,
  "from_pincode": "400001",
  "to_pincode": "110001",
  "destination": "New Delhi",
  "description": "Important Legal Document"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Booking created successfully with auto-calculated amount",
  "data": {
    "booking": {
      "id": 1,
      "consignment_number": "FASTSHIP-DOC-001",
      "customer_id": 101,
      "type": "Doc",
      "mode": "Air",
      "weight": 3,
      "quantity": 1,
      "amount": 50.0,
      "tax_amount": 9.0,
      "fuel_amount": 2.5,
      "total": 61.5,
      "gst_percent": 18,
      "fuel_percent": 5,
      "status": "Unbilled"
    },
    "calculation": {
      "rate_per_kg": 50,
      "line_amount": 50.0,
      "gst_percent": 18,
      "tax_amount": 9.0,
      "fuel_percent": 5,
      "fuel_amount": 2.5,
      "total_amount": 61.5
    }
  }
}
```

---

### API 2: Generate Invoice for Customer

**POST** `/api/invoices/generate-single`

```json
{
  "customer_id": 101,
  "from_date": "2024-01-01",
  "to_date": "2024-12-31"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "invoice": {
      "id": 1,
      "invoice_number": "INV-2024-001",
      "customer_id": 101,
      "invoice_date": "2024-01-15",
      "due_date": "2024-01-30",
      "sub_total": 125.0,
      "gst_total": 22.5,
      "fuel_total": 4.0,
      "other_charges": 0.0,
      "net_amount": 151.5,
      "items": [
        {
          "consignment_number": "FASTSHIP-DOC-001",
          "quantity": 1,
          "unit_price": 50.0,
          "line_amount": 50.0,
          "tax_amount": 9.0,
          "fuel_amount": 2.5,
          "item_total": 61.5
        },
        {
          "consignment_number": "FASTSHIP-DOC-002",
          "quantity": 3,
          "unit_price": 25.0,
          "line_amount": 75.0,
          "tax_amount": 13.5,
          "fuel_amount": 1.5,
          "item_total": 90.0
        }
      ],
      "bookings_billed": 2,
      "status": "Generated"
    }
  }
}
```

---

### API 3: Generate Multiple Invoices

**POST** `/api/invoices/generate-multiple`

```json
{
  "from_date": "2024-01-01",
  "to_date": "2024-12-31"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Multiple invoices generated successfully",
  "data": {
    "invoices_generated": 2,
    "total_bookings_billed": 4,
    "invoices": [
      {
        "id": 1,
        "invoice_number": "INV-2024-001",
        "customer_id": 101,
        "net_amount": 151.5,
        "items": 2
      },
      {
        "id": 2,
        "invoice_number": "INV-2024-002",
        "customer_id": 102,
        "net_amount": 1129.2,
        "items": 2
      }
    ],
    "summary": {
      "total_sub": 1045.0,
      "total_gst": 188.1,
      "total_fuel": 47.6,
      "grand_total": 1280.7
    }
  }
}
```

---

### API 4: Get Rate Calculation Endpoint

**GET** `/api/rates/calculate?type=Doc&mode=Air&weight=3&quantity=1`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "rate_per_kg": 50,
    "gst_percent": 18,
    "fuel_surcharge": 5,
    "line_amount": 50.0,
    "tax_amount": 9.0,
    "fuel_amount": 2.5,
    "total_amount": 61.5
  }
}
```

---

## Summary: Complete End-to-End Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMPLETE WORKFLOW TEST                        │
└──────────────────────────────────────────────────────────────────┘

PHASE 1: SETUP
├─ 12 RateMaster entries (4 combinations × 3 weight ranges)
└─ Rates: ₹25-₹250/kg with 18% GST and 2-8% fuel surcharge

PHASE 2: BOOKING CREATION (Auto-calculated)
├─ 4 Bookings created
├─ Each calculates amount, tax, fuel automatically from RateMaster
└─ Total: ₹1,280.70 (breakdown tracked per booking)

PHASE 3: INVOICE GENERATION (No recalculation)
├─ 2 Invoices generated (one per customer)
├─ Uses pre-calculated amounts (never recalculates taxes)
├─ Aggregates totals: ₹125 + ₹920 = ₹1,045 (line amounts)
└─ Final Totals: ₹1,045 + ₹188.10 + ₹47.60 = ₹1,280.70

PHASE 4: VERIFICATION
├─ All bookings marked as "Billed"
├─ Invoice line items reference bookings
├─ Complete audit trail maintained
└─ Totals match (no double-taxation)

RESULT: ✅ PERFECT END-TO-END WORKFLOW
```

---

## How to Execute This Test

1. **Copy all SQL from Step 1** → Run in your database
2. **Verify RateMaster** → Run verification query
3. **Copy all SQL from Step 2** → Insert bookings
4. **Verify Bookings** → Check calculations are correct
5. **Copy SQL from Step 3** → Generate invoices
6. **Run Step 4 queries** → Verify complete flow
7. **Test APIs** → Use examples from Step 5

---

**Your complete end-to-end workflow is now ready with actual test data! 🎉**
