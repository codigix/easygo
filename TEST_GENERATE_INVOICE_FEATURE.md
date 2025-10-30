# 🧪 Test Guide - Generate Single Invoice Feature

## Implementation Complete ✅

This guide helps you test the newly implemented **"Generate & View Single Invoice"** feature based on the video reference.

---

## 🚀 Quick Start Testing

### Phase 1: Backend Verification

**Step 1: Check Backend Routes**

```bash
# Verify the new route exists in invoiceRoutes.js
grep -n "generate-customer-bulk" backend/src/routes/invoiceRoutes.js
# Expected: POST /invoices/generate-customer-bulk route should be visible
```

**Step 2: Verify Export**

```bash
# Check that the new function is exported
grep -n "export const generateBulkInvoiceForCustomer" backend/src/controllers/invoiceController.js
# Expected: Should find the function definition
```

### Phase 2: Frontend Verification

**Step 1: Navigate to the Page**

1. Start your development server
2. Go to: `http://localhost:5173` (or your dev port)
3. Navigate to **"Generate Single Invoice"** page

**Step 2: Verify UI Elements**

- [ ] Title: "Generate Single Invoice"
- [ ] Customer ID input field
- [ ] Search button with search icon
- [ ] Period from/to date fields (initially hidden)
- [ ] GST %, Fuel Surcharge %, etc. fields (initially hidden)
- [ ] Summary card (initially hidden)

---

## 🧪 Test Scenarios

### Scenario 1: Search for Customer with Unbilled Consignments ✅

**Prerequisite**: You need a customer with unbilled bookings

**Steps**:

1. Enter a valid customer ID (e.g., "12345")
2. Click "Search" button
3. Wait for results

**Expected Results**:

- [ ] Success message appears: "Found X unbilled consignment(s)"
- [ ] Table shows consignments with columns: Consignment #, Destination, Weight, Mode, Amount
- [ ] Form fields become visible below the table
- [ ] Summary card shows total weight and subtotal

**Example Output**:

```
✅ Found 3 unbilled consignment(s)
Total Weight: 15.5 kg | Subtotal: ₹1500
```

---

### Scenario 2: Search for Customer with No Unbilled Consignments ❌

**Prerequisite**: Customer with all billed consignments

**Steps**:

1. Enter a customer ID that has no unbilled bookings
2. Click "Search" button

**Expected Results**:

- [ ] Error message appears: "No unbilled consignments found for this customer"
- [ ] Table remains empty
- [ ] Form fields remain hidden

**Example Output**:

```
❌ No unbilled consignments found for this customer
```

---

### Scenario 3: Generate Invoice with Default Values

**Prerequisite**: Customer has unbilled consignments

**Steps**:

1. Search for customer with unbilled consignments (Scenario 1)
2. Verify form is visible
3. Verify dates are filled (Period From and Period To should be empty, you'll fill them)
4. Set:
   - Period From: 2024-12-01
   - Period To: 2024-12-31
5. Keep other values at defaults (GST 18%, others 0%)
6. Click "Generate Invoice" button

**Expected Results**:

- [ ] Success message appears with invoice number
- [ ] Message shows: "Invoice generated for X consignments"
- [ ] Invoice number format: INV/2025/XXXX
- [ ] Form resets to empty state
- [ ] Net amount is calculated (Subtotal + GST)

**Example Output**:

```
✅ Invoice Generated Successfully! Invoice #INV/2025/0001 - 3 consignments included
```

---

### Scenario 4: Generate Invoice with Custom Charges

**Prerequisite**: Customer has unbilled consignments

**Steps**:

1. Search for customer with unbilled consignments
2. Set invoice dates
3. Set charges:
   - GST %: 18
   - Fuel Surcharge %: 5
   - Royalty %: 2
   - Docket %: 1
   - Other Charge: 100
4. Click "Generate Invoice"

**Expected Results**:

- [ ] Summary shows all charges calculated correctly
- [ ] Net Amount = Subtotal + Fuel Surcharge + Royalty + Docket + Other + GST
- [ ] Invoice is generated successfully
- [ ] All charges are saved in the invoice

**Calculation Example**:

```
Subtotal:         ₹1000.00
Fuel Surcharge:   ₹50.00 (5%)
Royalty:          ₹20.00 (2%)
Docket:           ₹10.00 (1%)
Other:            ₹100.00
Subtotal:         ₹1180.00
GST (18%):        ₹212.40
Net Amount:       ₹1392.40
```

---

### Scenario 5: Live Calculation Test

**Prerequisite**: Customer has unbilled consignments, form is visible

**Steps**:

1. Search for customer with unbilled consignments
2. Watch the summary as you change values:
   - Change GST % from 18 to 20
   - Change Fuel Surcharge from 0 to 5
   - Add Other Charge: 100

**Expected Results**:

- [ ] Summary updates in real-time as you type
- [ ] Net amount changes correctly
- [ ] All calculations are accurate

---

### Scenario 6: View Generated Invoice

**Prerequisite**: You've generated at least one invoice

**Steps**:

1. Navigate to "View Single Invoices" page
2. Search for the invoice by:
   - Customer ID or
   - Invoice Number (INV/2025/XXXX) or
   - Date range
3. Click search

**Expected Results**:

- [ ] Generated invoice appears in results table
- [ ] All invoice details are visible
- [ ] Invoice shows "Unpaid" status
- [ ] Amount matches what was calculated
- [ ] Download button is available

---

### Scenario 7: Invoice Discount (No GST)

**Prerequisite**: Customer has unbilled consignments

**Steps**:

1. Search for customer with unbilled consignments
2. Check "Invoice Discount (No GST)" checkbox
3. Set dates and other charges (GST % will be ignored)
4. Click "Generate Invoice"

**Expected Results**:

- [ ] GST field becomes disabled/grayed out
- [ ] GST is NOT added to Net Amount
- [ ] Net Amount = Subtotal + Charges (without GST)
- [ ] Invoice is generated with invoice_discount flag

**Example**:

```
Without Discount:  ₹1180.00 + ₹212.40 GST = ₹1392.40
With Discount:     ₹1180.00 (No GST) = ₹1180.00
```

---

### Scenario 8: Error Handling - Empty Customer ID

**Steps**:

1. Leave Customer ID empty
2. Click "Search" button

**Expected Results**:

- [ ] Error message: "Please enter a customer ID"
- [ ] No API call is made
- [ ] Form remains unchanged

---

### Scenario 9: Error Handling - Missing Dates

**Prerequisite**: Customer has unbilled consignments, search is done

**Steps**:

1. Search for customer with unbilled consignments
2. Leave "Period From" and "Period To" empty
3. Click "Generate Invoice"

**Expected Results**:

- [ ] Error message: "Please select period from and to dates"
- [ ] Invoice is NOT generated
- [ ] Form remains on the page

---

### Scenario 10: Clear Button

**Prerequisite**: Consignments are loaded and form is visible

**Steps**:

1. Search for customer with unbilled consignments
2. Fill in some form fields
3. Click "Clear" button

**Expected Results**:

- [ ] Customer ID field becomes empty
- [ ] Consignments table is cleared
- [ ] All form fields reset to defaults
- [ ] Summary is hidden

---

## 📊 Database Verification

After generating an invoice, verify in database:

### Check Invoices Table

```sql
SELECT id, invoice_number, customer_id, net_amount, payment_status
FROM invoices
WHERE invoice_number LIKE 'INV/2025/%'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Shows your newly generated invoice

### Check Invoice Items Table

```sql
SELECT ii.id, ii.invoice_id, ii.booking_id, ii.description, ii.amount
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.invoice_number = 'INV/2025/0001'; -- Use actual invoice number
```

**Expected**: Shows all consignments included in the invoice

### Check Bookings Table

```sql
SELECT id, customer_id, consignment_number, invoice_id
FROM bookings
WHERE invoice_id IS NOT NULL
ORDER BY invoice_id DESC
LIMIT 5;
```

**Expected**: Bookings now have invoice_id set (not NULL)

---

## 🐛 Debugging Checklist

If tests fail, check:

- [ ] **Backend running**: Verify `npm start` in backend directory
- [ ] **Frontend running**: Verify `npm run dev` in frontend directory
- [ ] **Database connection**: Check if database is running
- [ ] **API URL**: Verify `VITE_API_URL` in `.env.development`
- [ ] **Authentication**: Check if you're logged in
- [ ] **Browser console**: Check for JavaScript errors
- [ ] **Network tab**: Check API requests and responses
- [ ] **Database**: Verify bookings table has data

---

## 📋 Test Checklist

### Core Features

- [ ] Search for customer with unbilled consignments works
- [ ] Error message shows for customer with no unbilled consignments
- [ ] Invoice is generated with correct invoice number
- [ ] All consignments are linked to invoice
- [ ] Bookings have invoice_id updated

### Calculations

- [ ] Subtotal calculated correctly
- [ ] Fuel surcharge calculated correctly
- [ ] GST calculated correctly
- [ ] Net amount is correct
- [ ] Summary updates in real-time

### UI/UX

- [ ] Error messages are clear
- [ ] Success messages show invoice details
- [ ] Form resets after successful generation
- [ ] Buttons are disabled during loading
- [ ] Loading indicators appear during search/generation
- [ ] Table shows consignment details clearly

### Validation

- [ ] Empty customer ID shows error
- [ ] Missing dates show error
- [ ] No unbilled consignments show error
- [ ] Invalid customer ID shows error

### Integration

- [ ] View Single Invoices page shows generated invoice
- [ ] Invoice appears in filter results
- [ ] Download button works for generated invoice
- [ ] Invoice details are complete and accurate

---

## 🎯 Success Criteria

Feature is complete and working when:

- ✅ Can search for customer with unbilled consignments
- ✅ Can generate invoice for all consignments at once
- ✅ Invoice appears in View Single Invoices page
- ✅ All calculations are correct
- ✅ Error handling works for edge cases
- ✅ Form provides good user experience

---

## 📞 Troubleshooting

### Issue: "No unbilled consignments found" but I know there are some

**Solution**:

- Check if bookings have `invoice_id IS NULL` in database
- Verify customer_id matches exactly (case-sensitive)
- Check franchise_id matches current user's franchise

### Issue: Invoice generated but not appearing in View page

**Solution**:

- Refresh the View Single Invoices page
- Check browser cache (Ctrl+Shift+Delete)
- Verify invoice_id was set on bookings

### Issue: Calculations are wrong

**Solution**:

- Check formula in frontend `calculateTotals()` function
- Verify backend formulas match frontend
- Check decimal precision (using 2 decimal places)

### Issue: API returns 500 error

**Solution**:

- Check backend logs for error details
- Verify all required fields are sent
- Check database connection is working
- Verify franchise_id is correct

---

## 📞 Quick Command Reference

```bash
# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check logs
# Frontend: Browser Console (F12)
# Backend: Terminal window where npm start runs

# Test API with curl
curl -X POST http://localhost:5000/invoices/generate-customer-bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "12345",
    "invoice_date": "2025-01-01",
    "period_from": "2024-12-01",
    "period_to": "2024-12-31"
  }'
```

---

**Created**: January 2025
**Feature**: Generate & View Single Invoice
**Status**: Ready for Testing ✅
