# 🔄 Visual Data Flow: RateMaster → Booking → Invoice

## Complete Data Journey with Actual Numbers

---

## 📊 MASTER DATA: RateMaster Table

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            RATEMASTER (12 ROWS)                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TYPE    │ MODE    │ WEIGHT RANGE │ RATE/KG │ GST% │ FUEL% │ EXAMPLE             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Doc     │ Air     │ 0-5 kg       │ ₹50     │ 18%  │  5%   │ Light documents     │
│ Doc     │ Air     │ 5-10 kg      │ ₹80     │ 18%  │  5%   │ Medium documents    │
│ Doc     │ Air     │ 10-20 kg     │ ₹120    │ 18%  │  5%   │ Heavy documents     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ NonDoc  │ Air     │ 0-5 kg       │ ₹100    │ 18%  │  8%   │ Light parcels       │
│ NonDoc  │ Air     │ 5-10 kg      │ ₹160    │ 18%  │  8%   │ Medium parcels      │
│ NonDoc  │ Air     │ 10-20 kg     │ ₹250    │ 18%  │  8%   │ Heavy parcels       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Doc     │ Surface │ 0-5 kg       │ ₹25     │ 18%  │  2%   │ Light economy docs  │
│ Doc     │ Surface │ 5-10 kg      │ ₹40     │ 18%  │  2%   │ Medium economy docs │
│ Doc     │ Surface │ 10-20 kg     │ ₹60     │ 18%  │  2%   │ Heavy economy docs  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ NonDoc  │ Surface │ 0-5 kg       │ ₹50     │ 18%  │  3%   │ Light economy pckgs │
│ NonDoc  │ Surface │ 5-10 kg      │ ₹80     │ 18%  │  3%   │ Medium eco. pckgs   │
│ NonDoc  │ Surface │ 10-20 kg     │ ₹120    │ 18%  │  3%   │ Heavy eco. pckgs    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 BOOKING CREATION FLOW

### BOOKING 1: Light Document (Air)

```
INPUT DATA
══════════════════════════════════════════════════════════════════
│
│  consignment_no: "FASTSHIP-DOC-001"
│  type: "Doc"
│  mode: "Air"
│  weight: 3 kg
│  quantity: 1
│  destination: "New Delhi"
│
↓

STEP 1: LOOKUP RATEMASTER
══════════════════════════════════════════════════════════════════
│
│  Query: WHERE type='Doc' AND mode='Air' AND weight BETWEEN 0-5
│  Result: ✓ Found rate = ₹50/kg, GST=18%, Fuel=5%
│
↓

STEP 2: CALCULATE LINE AMOUNT
══════════════════════════════════════════════════════════════════
│
│  Formula: lineAmount = rate × quantity
│           ₹50 × 1 = ₹50.00
│
↓

STEP 3: CALCULATE GST
══════════════════════════════════════════════════════════════════
│
│  Formula: taxAmount = lineAmount × (GST% / 100)
│           ₹50 × (18 / 100) = ₹9.00
│
↓

STEP 4: CALCULATE FUEL SURCHARGE
══════════════════════════════════════════════════════════════════
│
│  Formula: fuelAmount = lineAmount × (Fuel% / 100)
│           ₹50 × (5 / 100) = ₹2.50
│
↓

STEP 5: CALCULATE TOTAL
══════════════════════════════════════════════════════════════════
│
│  Formula: total = lineAmount + taxAmount + fuelAmount
│           ₹50.00 + ₹9.00 + ₹2.50 = ₹61.50
│
↓

DATABASE STORAGE
══════════════════════════════════════════════════════════════════
│
│  Booking Record:
│  ├─ consignment_number: "FASTSHIP-DOC-001"
│  ├─ amount: ₹50.00                    ← Line amount
│  ├─ tax_amount: ₹9.00                 ← GST calculated
│  ├─ fuel_amount: ₹2.50                ← Fuel surcharge
│  ├─ gst_percent: 18                   ← For audit trail
│  ├─ fuel_percent: 5                   ← For audit trail
│  ├─ rate: ₹50                         ← Rate used
│  ├─ rate_master_id: 1                 ← Audit link
│  └─ status: "Unbilled"                ← Ready for invoice
│
↓

OUTPUT
══════════════════════════════════════════════════════════════════
│
│  ✅ BOOKING CREATED
│  Total Amount: ₹61.50
│  (₹50 + ₹9 + ₹2.50)
```

---

### BOOKING 2: Medium Parcel (Air)

```
INPUT DATA → LOOKUP → CALCULATION → STORAGE
════════════════════════════════════════════════════════════════════

  consignment: "FASTSHIP-PKG-001"    ├─ type: NonDoc
  weight: 7 kg                        ├─ mode: Air
  quantity: 2                         └─ Range 5-10 kg

                    ↓

  RateMaster: Rate=₹160, GST=18%, Fuel=8%

                    ↓

  CALCULATION:
  ├─ Line Amount:   ₹160 × 2    = ₹320.00
  ├─ GST (18%):     ₹320 × 0.18 = ₹57.60
  ├─ Fuel (8%):     ₹320 × 0.08 = ₹25.60
  └─ TOTAL:                       ₹403.20

                    ↓

  DATABASE:
  ├─ amount: ₹320.00
  ├─ tax_amount: ₹57.60
  ├─ fuel_amount: ₹25.60
  ├─ gst_percent: 18
  ├─ fuel_percent: 8
  ├─ rate: ₹160
  └─ status: "Unbilled"
```

---

### BOOKING 3: Regular Document (Surface)

```
INPUT DATA → LOOKUP → CALCULATION → STORAGE
════════════════════════════════════════════════════════════════════

  consignment: "FASTSHIP-DOC-002"    ├─ type: Doc
  weight: 2 kg                        ├─ mode: Surface
  quantity: 3                         └─ Range 0-5 kg

                    ↓

  RateMaster: Rate=₹25, GST=18%, Fuel=2%

                    ↓

  CALCULATION:
  ├─ Line Amount:   ₹25 × 3     = ₹75.00
  ├─ GST (18%):     ₹75 × 0.18  = ₹13.50
  ├─ Fuel (2%):     ₹75 × 0.02  = ₹1.50
  └─ TOTAL:                       ₹90.00

                    ↓

  DATABASE:
  ├─ amount: ₹75.00
  ├─ tax_amount: ₹13.50
  ├─ fuel_amount: ₹1.50
  ├─ gst_percent: 18
  ├─ fuel_percent: 2
  ├─ rate: ₹25
  └─ status: "Unbilled"
```

---

### BOOKING 4: Bulk Order (Surface)

```
INPUT DATA → LOOKUP → CALCULATION → STORAGE
════════════════════════════════════════════════════════════════════

  consignment: "FASTSHIP-PKG-002"    ├─ type: NonDoc
  weight: 15 kg                       ├─ mode: Surface
  quantity: 5                         └─ Range 10-20 kg

                    ↓

  RateMaster: Rate=₹120, GST=18%, Fuel=3%

                    ↓

  CALCULATION:
  ├─ Line Amount:   ₹120 × 5    = ₹600.00
  ├─ GST (18%):     ₹600 × 0.18 = ₹108.00
  ├─ Fuel (3%):     ₹600 × 0.03 = ₹18.00
  └─ TOTAL:                       ₹726.00

                    ↓

  DATABASE:
  ├─ amount: ₹600.00
  ├─ tax_amount: ₹108.00
  ├─ fuel_amount: ₹18.00
  ├─ gst_percent: 18
  ├─ fuel_percent: 3
  ├─ rate: ₹120
  └─ status: "Unbilled"
```

---

## 📈 BOOKINGS TABLE STATE

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         ALL BOOKINGS AFTER CREATION                                  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ID │ CONSIGNMENT         │ TYPE    │ MODE    │ AMOUNT  │ GST    │ FUEL   │ STATUS   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ 1  │ FASTSHIP-DOC-001    │ Doc     │ Air     │ ₹50.00  │ ₹9.00  │ ₹2.50  │ Unbilled │
│ 2  │ FASTSHIP-PKG-001    │ NonDoc  │ Air     │ ₹320.00 │ ₹57.60 │ ₹25.60 │ Unbilled │
│ 3  │ FASTSHIP-DOC-002    │ Doc     │ Surface │ ₹75.00  │ ₹13.50 │ ₹1.50  │ Unbilled │
│ 4  │ FASTSHIP-PKG-002    │ NonDoc  │ Surface │ ₹600.00 │ ₹108.00│ ₹18.00 │ Unbilled │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                   TOTALS                                             │
│                        ₹1,045.00  │ ₹188.10 │ ₹47.60 │                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 INVOICE GENERATION FLOW

### INVOICE 1: Customer 101 (Multiple Bookings)

```
QUERY UNBILLED BOOKINGS
═══════════════════════════════════════════════════════════════════

SELECT * FROM bookings
WHERE customer_id = 101 AND invoice_id IS NULL

RESULT:
├─ Booking 1: FASTSHIP-DOC-001 (₹50.00 + ₹9.00 + ₹2.50 = ₹61.50)
└─ Booking 3: FASTSHIP-DOC-002 (₹75.00 + ₹13.50 + ₹1.50 = ₹90.00)

                    ↓

STEP 1: AGGREGATE WITHOUT RECALCULATION
═══════════════════════════════════════════════════════════════════

From Booking 1:
├─ Line Amount: ₹50.00
├─ GST:        ₹9.00
└─ Fuel:       ₹2.50

From Booking 3:
├─ Line Amount: ₹75.00
├─ GST:        ₹13.50
└─ Fuel:       ₹1.50

AGGREGATION (JUST SUM - NO RECALCULATION):
├─ Sub Total:  ₹50.00 + ₹75.00       = ₹125.00 ✓
├─ GST Total:  ₹9.00 + ₹13.50        = ₹22.50  ✓
├─ Fuel Total: ₹2.50 + ₹1.50         = ₹4.00   ✓
└─ Net Amount: ₹125.00 + ₹22.50 + ₹4.00 = ₹151.50

                    ↓

STEP 2: CREATE INVOICE RECORD
═══════════════════════════════════════════════════════════════════

INSERT INTO invoices VALUES (
  invoice_number: "INV-2024-001",
  customer_id: 101,
  sub_total: ₹125.00,        ← Pre-calculated from bookings
  gst_total: ₹22.50,         ← Pre-calculated from bookings
  fuel_total: ₹4.00,         ← Pre-calculated from bookings
  net_amount: ₹151.50,       ← Sum of above
  status: "Generated"
)

                    ↓

STEP 3: CREATE INVOICE LINE ITEMS
═══════════════════════════════════════════════════════════════════

Item 1: FASTSHIP-DOC-001
├─ Quantity:      1
├─ Unit Price:    ₹50.00 (₹50 ÷ 1)
├─ Line Amount:   ₹50.00
├─ Tax:           ₹9.00
├─ Fuel:          ₹2.50
└─ Item Total:    ₹61.50

Item 2: FASTSHIP-DOC-002
├─ Quantity:      3
├─ Unit Price:    ₹25.00 (₹75 ÷ 3)
├─ Line Amount:   ₹75.00
├─ Tax:           ₹13.50
├─ Fuel:          ₹1.50
└─ Item Total:    ₹90.00

                    ↓

STEP 4: MARK BOOKINGS AS BILLED
═══════════════════════════════════════════════════════════════════

UPDATE bookings SET
├─ invoice_id: (Invoice 1 ID)
├─ status: "Billed"
WHERE id IN (1, 3)

                    ↓

INVOICE 1 COMPLETE
═══════════════════════════════════════════════════════════════════

✅ Invoice: INV-2024-001
   Customer: 101
   Items: 2
   Total: ₹151.50
   Status: Generated
```

---

### INVOICE 2: Customer 102 (Multiple Bookings)

```
QUERY UNBILLED BOOKINGS
═══════════════════════════════════════════════════════════════════

SELECT * FROM bookings
WHERE customer_id = 102 AND invoice_id IS NULL

RESULT:
├─ Booking 2: FASTSHIP-PKG-001 (₹320.00 + ₹57.60 + ₹25.60 = ₹403.20)
└─ Booking 4: FASTSHIP-PKG-002 (₹600.00 + ₹108.00 + ₹18.00 = ₹726.00)

                    ↓

AGGREGATION (JUST SUM - NO RECALCULATION):
═══════════════════════════════════════════════════════════════════

Sub Total:  ₹320.00 + ₹600.00    = ₹920.00
GST Total:  ₹57.60 + ₹108.00     = ₹165.60
Fuel Total: ₹25.60 + ₹18.00      = ₹43.60
Net Amount: ₹920.00 + ₹165.60 + ₹43.60 = ₹1,129.20

                    ↓

INVOICE 2 DETAILS
═══════════════════════════════════════════════════════════════════

✅ Invoice: INV-2024-002
   Customer: 102

   Item 1: FASTSHIP-PKG-001
   ├─ Qty: 2, Unit: ₹160.00, Line: ₹320.00
   ├─ Tax: ₹57.60, Fuel: ₹25.60
   └─ Total: ₹403.20

   Item 2: FASTSHIP-PKG-002
   ├─ Qty: 5, Unit: ₹120.00, Line: ₹600.00
   ├─ Tax: ₹108.00, Fuel: ₹18.00
   └─ Total: ₹726.00

   INVOICE TOTALS:
   ├─ Sub Total: ₹920.00
   ├─ GST:       ₹165.60
   ├─ Fuel:      ₹43.60
   └─ NET:       ₹1,129.20
```

---

## 📊 FINAL INVOICES TABLE STATE

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         INVOICES AFTER GENERATION                                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ID │ NUMBER      │ CUSTOMER │ SUB TOTAL │ GST      │ FUEL    │ TOTAL      │ STATUS   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ 1  │ INV-2024-001│    101   │ ₹125.00   │ ₹22.50   │ ₹4.00   │ ₹151.50    │ Generated│
│ 2  │ INV-2024-002│    102   │ ₹920.00   │ ₹165.60  │ ₹43.60  │ ₹1,129.20  │ Generated│
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                   TOTALS                                             │
│                        ₹1,045.00  │ ₹188.10  │ ₹47.60  │ ₹1,280.70  │            │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 COMPLETE FLOW DIAGRAM

```
╔════════════════════════════════════════════════════════════════════╗
║              COMPLETE END-TO-END DATA FLOW                         ║
╚════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│                    RATEMASTER TABLE (12 ROWS)                       │
│  Type|Mode|Weight|Rate|GST%|Fuel%                                   │
│  Doc|Air|0-5|₹50|18%|5% ... and 11 more                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Lookup by: Type, Mode, Weight
                           ↓
        ┌──────────────────────────────────────────────────────┐
        │          BOOKING CREATION (Auto-Calculate)           │
        ├──────────────────────────────────────────────────────┤
        │ Input: Type, Mode, Weight, Quantity                  │
        │ ↓                                                    │
        │ Query RateMaster → Get Rate & Percentages            │
        │ ↓                                                    │
        │ lineAmount = rate × quantity                         │
        │ taxAmount = lineAmount × gst%                        │
        │ fuelAmount = lineAmount × fuel%                      │
        │ total = lineAmount + taxAmount + fuelAmount          │
        │ ↓                                                    │
        │ Store: amount, tax_amount, fuel_amount, rate         │
        └──────────────────────────┬───────────────────────────┘
                                   │ 4 Bookings Created
                                   │ (All Unbilled)
                                   ↓
        ┌──────────────────────────────────────────────────────┐
        │         BOOKINGS TABLE (4 ROWS - ALL UNBILLED)       │
        ├──────────────────────────────────────────────────────┤
        │ Booking 1: ₹50.00 + ₹9.00 + ₹2.50  = ₹61.50         │
        │ Booking 2: ₹320.00 + ₹57.60 + ₹25.60 = ₹403.20      │
        │ Booking 3: ₹75.00 + ₹13.50 + ₹1.50 = ₹90.00         │
        │ Booking 4: ₹600.00 + ₹108.00 + ₹18.00 = ₹726.00     │
        │           ─────────────────────────────────────      │
        │ TOTAL:    ₹1,045.00 + ₹188.10 + ₹47.60 = ₹1,280.70 │
        └──────────────────────────┬───────────────────────────┘
                                   │ Group by Customer
                                   │ & Aggregate
                                   ↓
        ┌──────────────────────────────────────────────────────┐
        │      INVOICE GENERATION (NO RECALCULATION)           │
        ├──────────────────────────────────────────────────────┤
        │ Customer 101:                                        │
        │ ├─ Bookings: 1, 3                                   │
        │ ├─ Sub Total: ₹125.00 (just sum)                    │
        │ ├─ GST Total: ₹22.50 (just sum - NOT recalc!)       │
        │ ├─ Fuel Total: ₹4.00 (just sum)                     │
        │ └─ Invoice Total: ₹151.50                           │
        │                                                      │
        │ Customer 102:                                        │
        │ ├─ Bookings: 2, 4                                   │
        │ ├─ Sub Total: ₹920.00 (just sum)                    │
        │ ├─ GST Total: ₹165.60 (just sum - NOT recalc!)      │
        │ ├─ Fuel Total: ₹43.60 (just sum)                    │
        │ └─ Invoice Total: ₹1,129.20                         │
        └──────────────────────────┬───────────────────────────┘
                                   │ Create Invoice Items
                                   │ Mark Bookings as "Billed"
                                   ↓
        ┌──────────────────────────────────────────────────────┐
        │              FINAL STATE                             │
        ├──────────────────────────────────────────────────────┤
        │ INVOICES TABLE (2 rows)                              │
        │ ├─ INV-2024-001: Customer 101, ₹151.50              │
        │ └─ INV-2024-002: Customer 102, ₹1,129.20            │
        │                  ─────────────────                  │
        │ GRAND TOTAL: ₹1,280.70                              │
        │                                                      │
        │ All Bookings: Status = "Billed"                      │
        │ ✅ WORKFLOW COMPLETE - NO DOUBLE-TAXATION           │
        └──────────────────────────────────────────────────────┘
```

---

## ✅ Key Verification Points

```
VERIFICATION CHECKLIST
══════════════════════════════════════════════════════════════════

1. RateMaster Setup
   ✓ 12 rates configured (4 combinations × 3 weight ranges)
   ✓ All rates have GST% and Fuel% set

2. Booking Calculations
   ✓ Each booking calculated from RateMaster
   ✓ All 4 bookings stored with calculated amounts
   ✓ Total stored amounts match totals: ₹1,280.70

3. Invoice Generation
   ✓ Invoice 1 aggregates Booking 1 + 3: ₹151.50
   ✓ Invoice 2 aggregates Booking 2 + 4: ₹1,129.20
   ✓ Total: ₹1,280.70 ✓ (matches booking totals)

4. No Double-Taxation
   ✓ Invoice GST = sum of booking GST (not recalculated)
   ✓ Invoice Fuel = sum of booking Fuel (not recalculated)

5. Status Updates
   ✓ Bookings changed from "Unbilled" to "Billed"
   ✓ Invoices show "Generated" status

6. Audit Trail
   ✓ Each booking stores: rate, gst%, fuel%
   ✓ rate_master_id links booking to rate table

RESULT: ✅ ALL CHECKS PASS - PERFECT WORKFLOW
```

---

## 🎯 Data Summary

| Metric                      | Value             |
| --------------------------- | ----------------- |
| **RateMaster Entries**      | 12                |
| **Bookings Created**        | 4                 |
| **Customers Billed**        | 2                 |
| **Invoices Generated**      | 2                 |
| **Total Line Amount**       | ₹1,045.00         |
| **Total GST**               | ₹188.10           |
| **Total Fuel Surcharge**    | ₹47.60            |
| **Grand Total**             | ₹1,280.70         |
| **Booking → Invoice Match** | ✅ Perfect (100%) |
| **Double-Taxation Issues**  | ✅ None (0)       |

---

**Your complete data flow is visualized! Now go ahead and test it! 🚀**
