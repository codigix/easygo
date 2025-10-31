# Workflow Architecture - Visual Diagrams

## 1. Current System Architecture (BROKEN ❌)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EASYGO BILLING SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│   COMPANY MASTER        │ ✅ CORRECT
├─────────────────────────┤
│ company_id              │
│ company_name            │
│ fuel_surcharge_percent  │
│ royalty_charges_percent │
│ insurance_percent       │
│ due_days                │
└──────────────┬──────────┘
               │
               │ (customer_id)
               │
               ▼
┌─────────────────────────┐
│    BOOKING ENTRY        │ ❌ ISSUE #1
├─────────────────────────┤
│ customer_id             │ ← Exists but NOT used for defaults!
│ amount                  │ ← Calculated, but company charges ignored
│ tax_amount              │ ← Calculated from rate
│ fuel_amount             │ ← 0! (company fuel% not applied)
│ other_charges           │ ← Missing company royalty%
│ total                   │ ← Incorrect total
│                         │
│ (NO VALIDATION)         │ ← ERROR NOT CAUGHT
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│    RATE MASTER          │ ✅ CORRECT (but not always used)
├─────────────────────────┤
│ from_pincode            │
│ to_pincode              │
│ rate                    │
│ fuel_surcharge_percent  │
│ gst_percentage          │
└─────────────────────────┘

               │
               ▼
┌──────────────────────────────┐
│   INVOICE GENERATION         │ ❌ ISSUE #2
├──────────────────────────────┤
│ Fetch bookings for period    │
│ Calculate invoice totals:    │
│   - subtotal (sum amounts)   │
│   - gstTotal (sum tax) ✅    │
│   - fuelTotal (sum fuel) ✅  │
│ THEN:                        │
│   - RECALCULATE GST! ❌      │
│   - gst = (net * 18%) / 100  │
│   - This is DOUBLE TAXATION! │
│                              │
│ (NO VALIDATION) ❌           │
├──────────────────────────────┤
│ Results in:                  │
│ Over-charged customer ❌     │
│ Wrong financial records ❌   │
└──────────────────────────────┘

PROBLEMS:
❌ Company defaults not used
❌ Fuel surcharge missing
❌ Royalty not applied
❌ GST double-calculated
❌ No error detection
❌ Financial losses
```

---

## 2. Fixed System Architecture (CORRECT ✅)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EASYGO BILLING SYSTEM (FIXED)                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   COMPANY MASTER         │ ✅ CORRECT
├──────────────────────────┤
│ company_id               │
│ company_name             │
│ fuel_surcharge_percent   │
│ royalty_charges_percent  │
│ insurance_percent        │
│ due_days                 │
└────────────┬─────────────┘
             │
             │ (getCompanyDefaults)
             │ [NEW SERVICE CALL]
             ▼
┌──────────────────────────┐
│   COMPANY SERVICE        │ ✅ NEW
├──────────────────────────┤
│ getCompanyDefaults()     │
│ calculateCompanyCharges()│
│                          │
│ Returns defaults for:    │
│ - fuel%                  │
│ - royalty%               │
│ - insurance%             │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────┐
│    BOOKING ENTRY (FIXED)         │ ✅ FIXED #1
├──────────────────────────────────┤
│ Step 1: Fetch company defaults   │ ← NEW!
│ Step 2: Lookup rate_master       │
│ Step 3: Calculate amounts:       │
│   - amount                       │
│   - tax = amount × 18%           │
│   - fuel = amount × fuel%        │ ← From company!
│   - royalty = amount × royalty%  │ ← From company!
│   - other = other_charges        │
│ Step 4: total = sum of all parts │
│ Step 5: VALIDATE total ✅        │ ← NEW!
│         (catch errors now)       │
│                                  │
│ Storage:                         │
│ - booking.amount                 │
│ - booking.tax_amount             │
│ - booking.fuel_amount            │
│ - booking.other_charges          │
│ - booking.total (validated)      │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────┐
│    RATE MASTER           │ ✅ CORRECT
├──────────────────────────┤
│ from_pincode             │
│ to_pincode               │
│ rate                     │
│ fuel_surcharge_percent   │
│ gst_percentage           │
└──────────────────────────┘

               │
               ▼
┌────────────────────────────────────┐
│   INVOICE GENERATION (FIXED)       │ ✅ FIXED #2
├────────────────────────────────────┤
│ Step 1: Fetch bookings for period  │
│ Step 2: Sum pre-calculated amounts:│
│   - subtotal = SUM(amount)         │
│   - gstTotal = SUM(tax_amount) ✅  │ ← NO recalculation!
│   - fuelTotal = SUM(fuel_amount)   │
│   - otherTotal = SUM(other)        │
│ Step 3: Calculate net_amount       │
│   = subtotal + gst + fuel + other  │
│ Step 4: VALIDATE total ✅          │ ← NEW!
│         (catch errors now)         │
│ Step 5: Store invoice              │
│                                    │
│ Results in:                        │
│ ✅ Correct amounts                 │
│ ✅ Accurate GST                    │
│ ✅ Proper records                  │
│ ✅ Customer trust                  │
└────────────────────────────────────┘

IMPROVEMENTS:
✅ Company defaults used
✅ Fuel surcharge applied
✅ Royalty applied
✅ GST calculated once
✅ Double validation
✅ Accurate financials
```

---

## 3. Data Flow Diagram

### BEFORE (Broken ❌)

```
Customer "ACME" (fuel=5%, royalty=3%)
         │
         ▼
    Create Booking
    amount=1000
         │
         ├─ No company lookup ❌
         │
         └─ Rate calc:
            • rate = 1000
            • tax = 180 (18% of 1000)
            • fuel = 0 ❌ (should be 50!)
            • royalty = 0 ❌ (should be 30!)
            • other = 0
            • total = 1180 ❌

         │
         ▼
    Store Booking
    booking: {
      amount: 1000,
      tax: 180,
      fuel: 0,      ❌ WRONG
      royalty: 0,   ❌ WRONG
      total: 1180   ❌ WRONG
    }
         │
         ▼
    Create Invoice (2 bookings)
    subtotal = 2000
    tax_sum = 360
    fuel_sum = 0 ❌
    royalty_sum = 0 ❌
         │
         ├─ Recalculate GST: ❌
         │  net = 2360
         │  gst = 2360 * 18% = 424.80
         │
         └─ FINAL: 2784.80 ❌
            (Should be 2520)
            Over-charged: 264.80
```

### AFTER (Fixed ✅)

```
Customer "ACME" (fuel=5%, royalty=3%)
         │
         ▼
    Create Booking
    amount=1000
         │
         ├─ Fetch company defaults ✅
         │  fuel=5%, royalty=3%
         │
         └─ Calculate:
            • rate = 1000
            • tax = 180 (18% of 1000)
            • fuel = 50 (5% of 1000) ✅
            • royalty = 30 (3% of 1000) ✅
            • other = 0
            • total = 1260 ✅

         ├─ Validate: 1260 = 1000+180+50+30 ✅
         │
         ▼
    Store Booking
    booking: {
      amount: 1000,
      tax: 180,
      fuel: 50,      ✅ CORRECT
      royalty: 30,   ✅ CORRECT
      total: 1260    ✅ CORRECT
    }
         │
         ▼
    Create Invoice (2 bookings)
    subtotal = 2000
    tax_sum = 360 ✅
    fuel_sum = 100 ✅
    royalty_sum = 60 ✅
         │
         ├─ NO recalculation ✅
         │  gst = 360 (just sum)
         │
         └─ FINAL: 2520 ✅
            (Correct amount)
            Accurate: No over-charge ✅
```

---

## 4. Module Dependency Diagram

### Current (Incomplete)

```
bookingController.js
  │
  ├─ rateCalculationService.js ✅
  │
  ├─ companyRateMasterController.js ❌ NOT CALLED
  │
  └─ (No validation service) ❌

invoiceController.js
  │
  ├─ rateCalculationService.js ✅
  │
  └─ (Validation done wrong) ❌
```

### After Fix (Complete)

```
bookingController.js
  │
  ├─ rateCalculationService.js ✅
  │
  ├─ companyService.js ✅ NEW - called!
  │  └─ getCompanyDefaults()
  │  └─ calculateCompanyCharges()
  │
  └─ calculationValidationService.js ✅ NEW
     └─ validateBookingCalculation()
     └─ validateGstPercentage()

invoiceController.js
  │
  ├─ rateCalculationService.js ✅
  │
  └─ calculationValidationService.js ✅ NEW
     └─ validateInvoiceCalculation()
```

---

## 5. Database Schema Relationships

```
┌─────────────────────────┐
│   franchises            │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
└────────┬────────────────┘
         │ (foreign key)
         │
    ┌────┴────┬────────────────────────────┐
    │         │                            │
    ▼         ▼                            ▼
┌────────────────────┐  ┌──────────────────────────┐  ┌────────────────────┐
│  company_rate_     │  │  rate_master             │  │  bookings          │
│  master            │  ├──────────────────────────┤  ├────────────────────┤
├────────────────────┤  │ id (PK)                  │  │ id (PK)            │
│ id (PK)            │  │ franchise_id (FK) ✅     │  │ franchise_id (FK)  │
│ franchise_id (FK)  │  │ from_pincode             │  │ customer_id        │
│ company_id         │  │ to_pincode               │  │ amount             │
│ company_name       │  │ rate                     │  │ tax_amount         │
│ fuel_surcharge_%   │  │ fuel_surcharge           │  │ fuel_amount        │
│ royalty_charges_%  │  │ gst_percentage           │  │ other_charges      │
│ insurance_%        │  │ status                   │  │ total              │
│ due_days           │  └──────────────────────────┘  │ gst_percent        │
└────────────────────┘                                │ fuel_percent       │
                                                      │ invoice_id (FK)    │
                                                      └────────────────────┘
                                                               │
                                                               │ (FK)
                                                               ▼
                                                      ┌────────────────────┐
                                                      │  invoices          │
                                                      ├────────────────────┤
                                                      │ id (PK)            │
                                                      │ franchise_id (FK)  │
                                                      │ customer_id        │
                                                      │ subtotal_amount    │
                                                      │ gst_amount_new     │
                                                      │ fuel_surcharge_    │
                                                      │ total              │
                                                      │ net_amount         │
                                                      │ invoice_items []   │
                                                      └────────────────────┘

KEY RELATIONSHIPS:
✅ company_rate_master.company_id = bookings.customer_id
   → Link company defaults to booking

✅ rate_master (to_pincode, service_type) = booking (pincode, mode)
   → Link rate lookup to booking

✅ bookings.id → invoice_items.booking_id
   → Link bookings to invoice line items

✅ invoices sums booking amounts
   → Create invoice totals
```

---

## 6. Calculation Flow Diagram

```
INPUT: Single Booking
┌──────────────────────────┐
│ customer_id="ACME"       │
│ amount=1000              │
│ char_wt=10kg             │
│ qty=2                    │
└──────────────┬───────────┘

Step 1: Fetch Company Defaults
┌──────────────────────────┐
│ Company: ACME            │
│ fuel_surcharge_percent=5 │
│ royalty_charges_percent=3│
│ insurance_percent=2      │
└──────────────┬───────────┘

Step 2: Fetch Rate (if amount=0)
┌──────────────────────────┐
│ (Rate Master lookup)     │
│ rate=1000 (in this case) │
└──────────────┬───────────┘

Step 3: Calculate Components
┌──────────────────────────────────────┐
│ Base Amount: 1000                    │
│ × GST%: 18%     → Tax: 180          │
│ × Fuel%: 5%     → Fuel: 50          │
│ × Royalty%: 3%  → Royalty: 30       │
│ × Insurance%: 2% → Insurance: 20    │
└──────────────┬───────────────────────┘

Step 4: Sum Components
┌──────────────────────────────────────┐
│ amount      = 1000                   │
│ tax_amount  = 180                    │
│ fuel_amount = 50                     │
│ other_charges = 30 (royalty) + 20    │
│ TOTAL       = 1080                   │
│ Breakdown: 1000+180+50+30+20=1280    │
└──────────────┬───────────────────────┘

Step 5: Validate
┌──────────────────────────────────────┐
│ expected = 1000 + 180 + 50 + 50      │
│ actual   = 1280                      │
│ Difference = 0 ✅ VALID              │
└──────────────┬───────────────────────┘

Step 6: Store Booking
┌──────────────────────────────────────┐
│ booking = {                          │
│   customer_id: "ACME"                │
│   amount: 1000                       │
│   tax_amount: 180                    │
│   fuel_amount: 50                    │
│   other_charges: 50                  │
│   total: 1280                        │
│   gst_percent: 18                    │
│   fuel_percent: 5                    │
│ }                                    │
└──────────────────────────────────────┘
```

---

## 7. Invoice Calculation Flow

```
INPUT: 2 Bookings (from above example)
┌────────────────────────────────────────┐
│ Booking 1:                             │
│   amount=1000, tax=180, fuel=50, other=50, total=1280 │
│ Booking 2:                             │
│   amount=1000, tax=180, fuel=50, other=50, total=1280 │
└─────────────────────┬──────────────────┘

Step 1: Sum Components
┌────────────────────────────────────────┐
│ subtotal    = 1000 + 1000 = 2000      │
│ taxTotal    = 180 + 180 = 360         │
│ fuelTotal   = 50 + 50 = 100           │
│ otherTotal  = 50 + 50 = 100           │
└─────────────────────┬──────────────────┘

Step 2: Calculate Net Amount
┌────────────────────────────────────────┐
│ net_amount = 2000 + 360 + 100 + 100   │
│           = 2560                      │
└─────────────────────┬──────────────────┘

Step 3: Determine GST Amount
┌────────────────────────────────────────┐
│ ✅ CORRECT (After Fix):                │
│ gst_amount = taxTotal = 360            │
│ (Don't recalculate on net_amount)      │
│                                        │
│ ❌ WRONG (Before Fix):                 │
│ gst_amount = (2560 * 18%) / 100        │
│           = 460.80                     │
│ Over-charge = 100.80                   │
└─────────────────────┬──────────────────┘

Step 4: Validate Invoice
┌────────────────────────────────────────┐
│ expected = subtotal + gst + fuel + other
│         = 2000 + 360 + 100 + 100      │
│         = 2560                        │
│ actual   = 2560                       │
│ Difference = 0 ✅ VALID                │
└─────────────────────┬──────────────────┘

Step 5: Store Invoice
┌────────────────────────────────────────┐
│ invoice = {                            │
│   invoice_number: "INV/2024/0001"      │
│   customer_id: "ACME"                  │
│   subtotal_amount: 2000                │
│   gst_amount_new: 360                  │
│   fuel_surcharge_total: 100            │
│   other_charge: 100                    │
│   net_amount: 2560                     │
│   payment_status: "unpaid"             │
│ }                                      │
└────────────────────────────────────────┘
```

---

## 8. Error Handling Flow

```
SCENARIO: Invalid Calculation (After Fix)

Booking Creation with WRONG total
┌─────────────────────────────────────┐
│ Request:                            │
│ {                                   │
│   amount: 1000,                     │
│   tax_amount: 180,                  │
│   fuel_amount: 50,                  │
│   other_charges: 0,                 │
│   total: 1500  ❌ (Should be 1230) │
│ }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
        Validation Check
┌──────────────────────────────────────────┐
│ validateBookingCalculation():            │
│                                          │
│ expected = 1000 + 180 + 50 + 0 = 1230  │
│ actual = 1500                           │
│ difference = 270 > 0.01                 │
│                                          │
│ RESULT: NOT VALID ❌                    │
└──────────────┬───────────────────────────┘
               │
               ▼
        Return Error Response
┌──────────────────────────────────────────┐
│ HTTP 400 Bad Request                    │
│                                          │
│ {                                        │
│   "success": false,                      │
│   "message": "Booking calculation        │
│              error: Booking calculation  │
│              mismatch. Expected:         │
│              ₹1230.00, Got: ₹1500.00"   │
│   "details": {                           │
│     "expected": 1230,                    │
│     "actual": 1500,                      │
│     "difference": 270,                   │
│     "breakdown": {                       │
│       "amount": 1000,                    │
│       "tax": 180,                        │
│       "fuel": 50,                        │
│       "other": 0                         │
│     }                                    │
│   }                                      │
│ }                                        │
└──────────────────────────────────────────┘
```

---

## 9. Service Dependencies

```
BEFORE (Incomplete)
┌────────────────────────────────────┐
│ Frontend                           │
│ (Booking/Invoice Forms)            │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ bookingController                  │
│ ├─ rateCalculationService ✅       │
│ └─ companyRateMasterController ❌  │  (Not called!)
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Database                           │
│ ├─ bookings table                  │
│ ├─ rate_master table               │
│ ├─ company_rate_master table       │
│ └─ invoices table                  │
└────────────────────────────────────┘


AFTER (Complete)
┌────────────────────────────────────┐
│ Frontend                           │
│ (Booking/Invoice Forms)            │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ bookingController                  │
│ ├─ rateCalculationService ✅       │
│ ├─ companyService ✅ NEW!          │
│ │  └─ calculateCompanyCharges()    │
│ └─ validationService ✅ NEW!       │
│    └─ validateBookingCalc()        │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ invoiceController                  │
│ ├─ rateCalculationService ✅       │
│ └─ validationService ✅ NEW!       │
│    └─ validateInvoiceCalc()        │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Database                           │
│ ├─ bookings table                  │
│ ├─ rate_master table               │
│ ├─ company_rate_master table       │
│ └─ invoices table                  │
└────────────────────────────────────┘
```

---

## 10. Summary: What Changes

```
LEVEL 1: DATABASE
❌ No changes needed
   (Schema is already correct)

LEVEL 2: APPLICATION CODE
✅ Create new service: companyService.js
✅ Create new service: calculationValidationService.js
✅ Update: bookingController.js (add company lookup)
✅ Update: invoiceController.js (fix GST calc)

LEVEL 3: LOGIC
Before:
  booking.total = amount + tax + fuel

After:
  booking.total = amount + tax + fuel + royalty + insurance
  ✅ Company defaults used
  ✅ Calculation validated

LEVEL 4: INVOICE
Before:
  invoice_total = sum(bookings) + (net_amount * gst%)

After:
  invoice_total = sum(bookings.total)
  ✅ GST not recalculated
  ✅ Invoice validated
```
