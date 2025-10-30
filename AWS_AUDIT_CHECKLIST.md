# ✅ AWS DATABASE AUDIT CHECKLIST

## 🎯 Your Task: Complete These Steps

---

## PHASE 1️⃣: DIAGNOSIS (5-10 minutes)

### Step 1: Run Automatic Diagnostic

- [ ] Open PowerShell
- [ ] Navigate to: `cd c:\Users\admin\Desktop\easygo`
- [ ] Run: `.\check_aws_database.ps1`
- [ ] Wait for automatic report generation
- [ ] Report file opens in Notepad

**Expected Output:**

- [ ] Database connection successful ✅
- [ ] Bookings table structure displayed
- [ ] Rate Master table structure displayed
- [ ] Sample data shown
- [ ] Critical fields listed

---

## PHASE 2️⃣: ANALYSIS (5 minutes)

### Step 2: Verify Booking Table Structure

In the generated report, look for these fields:

**Critical Fields** (should exist):

- [ ] `id` (primary key)
- [ ] `franchise_id`
- [ ] `consignment_number`
- [ ] `booking_date`
- [ ] `service_type` or `mode`? ← Note which one
- [ ] `weight` or `char_wt`? ← Note which one
- [ ] `freight_charge` or `amount`? ← Note which one
- [ ] `gst_amount` or `tax_amount`? ← Note which one
- [ ] `fuel_surcharge` or `fuel_amount`? ← Note which one

**Check for these** (nice-to-have):

- [ ] `customer_id` (exists? YES / NO)
- [ ] `type` (Doc vs NonDoc)
- [ ] `invoice_id` (for linking)
- [ ] `rate_master_id` (for tracking)

### Step 3: Verify Rate Master Table

**Critical Fields:**

- [ ] `id`
- [ ] `franchise_id`
- [ ] `service_type` (values: Surface, Air, Express?)
- [ ] `gst_percentage`
- [ ] `fuel_surcharge`
- [ ] `weight_from`
- [ ] `weight_to`
- [ ] `rate`

**Check for:**

- [ ] `type` field (for Doc vs NonDoc? YES / NO)

### Step 4: Document Your Schema

**Answer these questions:**

**Q1: How many bookings are in the database?**

```
Answer: ________ records
```

**Q2: How many rates are in rate_master?**

```
Answer: ________ records
```

**Q3: Which schema matches your bookings table?**

- [ ] Schema A: sender_name, receiver_name, service_type, weight, freight_charge, gst_amount
- [ ] Schema B: customer_id, receiver, pincode, mode, char_wt, qty, amount, tax_amount
- [ ] Schema C: Mixed/Different

**Q4: Critical field names in YOUR database:**

```
Service Type Field Name:  _____________ (service_type or mode?)
Weight Field Name:        _____________ (weight or char_wt?)
Freight Field Name:       _____________ (freight_charge or amount?)
GST Field Name:           _____________ (gst_amount or tax_amount?)
Fuel Field Name:          _____________ (fuel_surcharge or fuel_amount?)
```

---

## PHASE 3️⃣: UI VERIFICATION (10 minutes)

### Step 5: Test Booking Creation

Go to: **Booking Form Page**

**Fill in test data:**

- Sender: Any name
- Receiver: Any name
- Service: Select "Surface" or "Air"
- Weight: 5 kg
- Pieces: 1
- Pincode: 400001 (or any)

**Try to save:**

- [ ] Click "Save Booking"
- [ ] Check result: Success? YES / NO
- [ ] If error, note it: `_____________________`

**Check database:**

```sql
SELECT * FROM bookings WHERE consignment_number LIKE 'LATEST%' ORDER BY id DESC LIMIT 1;
```

- [ ] Data appeared in database? YES / NO
- [ ] All fields populated? YES / NO / PARTIAL
- [ ] Calculations correct? YES / NO / UNKNOWN

### Step 6: Test Invoice Generation

Go to: **Generate Invoice Page**

**Try to create invoice:**

- [ ] Enter Customer ID or select booking
- [ ] Click "Show Bookings"
- [ ] Bookings appear? YES / NO
- [ ] Totals calculated? YES / NO
- [ ] Can generate invoice? YES / NO

**If failed:**

- [ ] Note exact error: `_____________________`
- [ ] Check browser console (F12): `_____________________`

---

## PHASE 4️⃣: PROBLEM IDENTIFICATION (5 minutes)

### Step 7: Identify Issues

**Mark which problems you have:**

- [ ] **No Schema Mismatch** ✅ Everything perfect
- [ ] **Schema Mismatch** ❌ Database and code don't match
- [ ] **Booking Won't Save** ❌ Create booking fails
- [ ] **Wrong Calculations** ❌ Rates/taxes are incorrect
- [ ] **Invoice Won't Generate** ❌ Can't create invoices
- [ ] **Can't Link Bookings to Invoices** ❌ No invoice_id field
- [ ] **Multiple Issues** ❌ Multiple problems

### Step 8: Classify Your Database Type

Based on analysis, you have:

- [ ] **Type A:** Standard Migrations (sender/receiver fields)
  - Action: Update controller code
  - Effort: Low
- [ ] **Type B:** Custom Schema (customer_id, mode, type fields)
  - Action: Update migrations or revert
  - Effort: Medium
- [ ] **Type C:** Hybrid/Modified (Mixed fields)
  - Action: Document and fix carefully
  - Effort: High

---

## PHASE 5️⃣: INFORMATION COLLECTION (2 minutes)

### Step 9: Prepare Report for Support

**Copy this information:**

```
═════════════════════════════════════════════════════
AWS DATABASE AUDIT REPORT - USER SUBMISSION
═════════════════════════════════════════════════════

1. DATABASE INFO:
   - Host: frbilling.cxqc440y2mz9.eu-north-1.rds.amazonaws.com
   - Total Bookings: _______
   - Total Rates: _______

2. BOOKINGS TABLE SCHEMA:
   [PASTE SHOW COLUMNS FROM bookings; OUTPUT HERE]

3. RATE MASTER TABLE SCHEMA:
   [PASTE SHOW COLUMNS FROM rate_master; OUTPUT HERE]

4. CRITICAL FIELDS MAPPING:
   Service Type Field: ______________
   Weight Field: ______________
   Freight Field: ______________
   GST Field: ______________
   Fuel Field: ______________

5. ISSUES FOUND:
   ☐ No schema mismatch
   ☐ Schema mismatch detected
   ☐ Booking creation fails
   ☐ Calculations wrong
   ☐ Invoice generation fails
   ☐ No invoice linking
   ☐ Other: _______________

6. CURRENT STATUS:
   Schema Type: [A / B / C]
   Severity: [Low / Medium / High]
   Data Loss Risk: [No / Possible / Yes]

═════════════════════════════════════════════════════
```

---

## PHASE 6️⃣: SHARE & GET FIXES (1 minute)

### Step 10: Submit Information

**Share with support:**

1. [ ] Diagnostic report file (aws_database_report.txt)
2. [ ] Answers to questions above
3. [ ] Any error messages from UI tests
4. [ ] Current status of application

**You will receive:**

- ✅ Corrected bookingController.js
- ✅ Corrected rateCalculationService.js
- ✅ SQL migration fixes (if needed)
- ✅ Updated test data for YOUR schema
- ✅ Deployment instructions

---

## PHASE 7️⃣: IMPLEMENTATION (15 minutes)

### Step 11: Apply Fixes

Once you receive corrected files:

- [ ] Backup current files
- [ ] Replace bookingController.js
- [ ] Replace rateCalculationService.js
- [ ] Run SQL migrations (if provided)
- [ ] Restart backend server
- [ ] Test booking creation again
- [ ] Test invoice generation again
- [ ] Verify calculations

### Step 12: Verification

**After applying fixes:**

- [ ] Create test booking → Check database
- [ ] Booking has correct amount ✅
- [ ] Booking has correct tax ✅
- [ ] Booking has correct fuel ✅
- [ ] Total adds up ✅
- [ ] Generate invoice from booking ✅
- [ ] Invoice shows correct totals ✅
- [ ] No double-taxation ✅

---

## 🎯 COMPLETION CHECKLIST

### Diagnostic Complete

- [ ] Automatic diagnostic run successfully
- [ ] Report generated
- [ ] Schema verified
- [ ] Problems identified

### UI Testing Complete

- [ ] Booking creation tested
- [ ] Invoice generation tested
- [ ] Errors documented

### Report Prepared

- [ ] Questions answered
- [ ] Schema documented
- [ ] Issues listed
- [ ] Submitted for analysis

### Fixes Applied

- [ ] Updated files received
- [ ] Files deployed
- [ ] Tests passed
- [ ] Production ready

---

## ⏱️ TIME TRACKER

```
Phase 1 (Diagnosis):      ___ / 10 min
Phase 2 (Analysis):       ___ / 5 min
Phase 3 (UI Testing):     ___ / 10 min
Phase 4 (Problem ID):     ___ / 5 min
Phase 5 (Information):    ___ / 2 min
Phase 6 (Share):          ___ / 1 min
Phase 7 (Implementation): ___ / 15 min
─────────────────────────────────
TOTAL:                    ___ / 48 min
```

---

## 🚀 START NOW!

### Your immediate action:

```
1. Open PowerShell
2. cd c:\Users\admin\Desktop\easygo
3. .\check_aws_database.ps1
4. Fill out this checklist
5. Share the results
```

---

## 📞 SUPPORT CONTACTS

**If PowerShell script fails:**

- [ ] Install MySQL: https://dev.mysql.com/downloads/
- [ ] Use MySQL Workbench: https://dev.mysql.com/downloads/workbench/
- [ ] Run AWS_DATABASE_DIAGNOSTIC.sql manually

**If anything is unclear:**

- [ ] Re-read: AWS_DATABASE_CHECK_QUICKSTART.md
- [ ] Check: AWS_DATABASE_AUDIT_REPORT.md
- [ ] Ask: Any questions?

---

## ✅ FINAL CHECKLIST

Before submitting report:

- [ ] Diagnostic completed
- [ ] All questions answered
- [ ] Schema documented
- [ ] UI tests performed
- [ ] Errors noted
- [ ] Report ready to share

**Status: READY FOR NEXT PHASE ✅**

---

**Good luck! You've got this! 🚀**

**Next: Run the diagnostic and come back with results!**
