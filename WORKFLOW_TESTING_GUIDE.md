# EasyGo - Comprehensive Workflow Testing Guide

**Date**: November 8, 2025  
**Purpose**: Verify all features work correctly end-to-end

---

## Test Environment Setup

### Prerequisites
- Backend running on `http://localhost:5000` (development) or `https://api.yourdomain.com` (production)
- Frontend running on `http://localhost:3000` (development) or `https://yourdomain.com` (production)
- MySQL database with all migrations applied
- Admin user created with username: `admin`, password: `password123`

### Getting Started

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Open browser to http://localhost:3000
```

---

## Test Workflows

### ✅ Workflow 1: User Authentication & Login

**Objective**: Verify user can login and access dashboard

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `password123`
3. Click "Sign in" button
4. Verify redirect to dashboard (`/` or `/dashboard`)
5. Verify user profile displays correctly
6. Logout from application

**Expected Results**:
- ✅ Login successful with JWT token generated
- ✅ User data stored in localStorage
- ✅ Dashboard displays with user information
- ✅ Logout clears token and redirects to login
- ✅ Cannot access protected routes without token

**Debug Info**:
```bash
# Check JWT token in browser console
localStorage.getItem('token')

# Check user data
localStorage.getItem('user')

# Verify API response
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

---

### ✅ Workflow 2: Create Booking/Consignment

**Objective**: Verify booking creation and data persistence

**Steps**:
1. Login as admin
2. Navigate to "Book Consignment" page
3. Fill in required fields:
   - **Consignment No**: `CNS-TEST-001`
   - **Customer ID**: `CUST001`
   - **Receiver**: `John Doe`
   - **Address**: `123 Main St`
   - **Booking Date**: Today's date
   - **Pincode**: `110001`
   - **Chargeable Weight**: `2.5`
   - **Quantity**: `1`
4. Set optional fields:
   - Mode: `AR` (Air)
   - Amount: `500`
   - Other Charges: `50`
5. Click "Book Consignment"
6. Verify success message
7. Navigate to "Check Booking List"
8. Search for created booking using consignment number

**Expected Results**:
- ✅ Booking created with ID generated
- ✅ All fields saved in database
- ✅ Booking appears in list
- ✅ Can search for booking by consignment number
- ✅ Booking shows with status "Booked"
- ✅ Amounts calculated correctly:
  - Total = Amount + Tax (18%) + Fuel Charge

**Debug Info**:
```sql
-- Check booking in database
SELECT * FROM bookings WHERE consignment_no = 'CNS-TEST-001';

-- Verify calculations
SELECT 
  consignment_no, 
  amount, 
  tax_amount, 
  fuel_amount, 
  total 
FROM bookings 
WHERE consignment_no = 'CNS-TEST-001';
```

---

### ✅ Workflow 3: Generate Invoice from Booking

**Objective**: Verify invoice generation from booking

**Steps**:
1. Login as admin
2. Navigate to "Check Booking List"
3. Find the booking created in Workflow 2
4. Click booking to view details
5. If invoice not generated yet, click "Generate Invoice"
6. Verify invoice number generated (format: INV/YYYY/0001)
7. Navigate to "View Invoice"
8. Search for the generated invoice
9. Verify all booking items appear in invoice

**Expected Results**:
- ✅ Invoice created with unique invoice number
- ✅ Invoice linked to booking (booking.invoice_id set)
- ✅ Invoice contains booking consignment details
- ✅ Amounts calculated:
  - Subtotal = booking total
  - GST = subtotal * 18%
  - Total = subtotal + GST
- ✅ Invoice status shows as "draft" initially
- ✅ Can view invoice details

**Debug Info**:
```sql
-- Check invoice created
SELECT * FROM invoices WHERE customer_id = 'CUST001';

-- Check invoice items
SELECT * FROM invoice_items 
JOIN invoices ON invoice_items.invoice_id = invoices.id 
WHERE invoices.customer_id = 'CUST001';

-- Verify linking
SELECT 
  b.consignment_no, 
  i.invoice_number,
  b.invoice_id
FROM bookings b
LEFT JOIN invoices i ON b.invoice_id = i.id
WHERE b.consignment_no = 'CNS-TEST-001';
```

---

### ✅ Workflow 4: Download Invoice as PDF

**Objective**: Verify invoice can be downloaded as PDF

**Steps**:
1. From "View Invoice" page
2. Find the invoice created in Workflow 3
3. Click "Download" or "Print" button
4. Verify PDF downloads
5. Check PDF content:
   - Invoice number
   - Customer details
   - Line items with amounts
   - Total amount with GST breakdown
   - Franchise details in header

**Expected Results**:
- ✅ PDF generated without errors
- ✅ PDF contains all required information
- ✅ Formatting is professional
- ✅ Company name and address visible
- ✅ Invoice date and number correct
- ✅ Calculations displayed correctly

**Debug Info**:
```bash
# Check if PDF endpoint works
curl http://localhost:5000/api/invoices/1/download \
  -H "Authorization: Bearer <jwt_token>"
```

---

### ✅ Workflow 5: Record Payment Against Invoice

**Objective**: Verify payment recording and status updates

**Steps**:
1. Navigate to "Payment Track"
2. Find the invoice from Workflow 3
3. Record payment:
   - Select Invoice
   - Enter Amount: Full invoice total
   - Payment Mode: "Cash"
   - Payment Date: Today
4. Click "Record Payment"
5. Verify success message
6. Check invoice status:
   - Navigate to "View Invoice"
   - Search for same invoice
   - Verify "Paid" status
   - Verify "Balance Amount" = 0

**Expected Results**:
- ✅ Payment recorded with unique payment number
- ✅ Payment linked to invoice and booking
- ✅ Invoice payment_status updated to "paid"
- ✅ Invoice balance_amount updated
- ✅ Can track payment history

**Debug Info**:
```sql
-- Check payment recorded
SELECT * FROM payments WHERE invoice_id = (
  SELECT id FROM invoices WHERE customer_id = 'CUST001'
);

-- Verify invoice status
SELECT 
  invoice_number, 
  payment_status, 
  total_amount, 
  paid_amount, 
  balance_amount 
FROM invoices 
WHERE customer_id = 'CUST001';
```

---

### ✅ Workflow 6: Update Tracking Status

**Objective**: Verify shipment tracking updates

**Steps**:
1. Navigate to "Consignment Tracking" (if available)
2. Find the booking from Workflow 2
3. Update status:
   - Current: "Booked"
   - Change to: "In Transit"
   - Location: "Distribution Center"
   - Remarks: "Handed over to logistics partner"
4. Update again:
   - Change to: "Out for Delivery"
   - Location: "Local Courier Center"
5. Check tracking history - verify all status updates appear

**Expected Results**:
- ✅ Tracking status updated
- ✅ Timestamp recorded for each update
- ✅ History shows progression: Booked → In Transit → Out for Delivery
- ✅ Location information saved
- ✅ Remarks saved for reference

**Debug Info**:
```sql
-- Check tracking history
SELECT * FROM tracking 
WHERE booking_id = (
  SELECT id FROM bookings WHERE consignment_no = 'CNS-TEST-001'
) 
ORDER BY status_date DESC;

-- Verify latest status
SELECT 
  b.consignment_no,
  t.status,
  t.location,
  t.status_date,
  t.remarks
FROM bookings b
LEFT JOIN tracking t ON b.id = t.booking_id
WHERE b.consignment_no = 'CNS-TEST-001'
ORDER BY t.status_date DESC
LIMIT 1;
```

---

### ✅ Workflow 7: Multiple Bookings & Bulk Invoice

**Objective**: Verify bulk invoice generation

**Steps**:
1. Create 3-5 bookings for same customer (CUST001) with different consignment numbers
2. Navigate to "Generate Invoice" page
3. Select all bookings for CUST001
4. Click "Generate Bulk Invoice"
5. Verify invoice created with multiple line items
6. Check invoice breakdown shows all bookings

**Expected Results**:
- ✅ Multiple bookings combined in one invoice
- ✅ Each booking appears as line item
- ✅ Total amount = sum of all booking amounts
- ✅ GST calculated on total
- ✅ Invoice links all bookings

**Debug Info**:
```sql
-- Check bulk invoice
SELECT 
  i.invoice_number,
  COUNT(ii.id) as item_count,
  SUM(ii.amount) as total_items
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.customer_id = 'CUST001'
GROUP BY i.id;
```

---

### ✅ Workflow 8: Rate Configuration & Calculation

**Objective**: Verify rate calculation from rate master

**Steps**:
1. Navigate to "Update Rate" or "Rate Master" page
2. Add new rate:
   - From Pincode: `110001`
   - To Pincode: `120001`
   - Service Type: `Air`
   - Weight Range: 0-5 kg
   - Rate: `200`
   - Fuel Surcharge: `10%`
   - GST: `18%`
3. Save rate
4. Create booking using this route:
   - Sender Pincode: `110001`
   - Receiver Pincode: `120001`
   - Weight: `2` kg
   - Service Type: `Air`
5. Verify amount calculated from rate master:
   - Amount should be calculated as (rate * weight) + fuel surcharge + GST

**Expected Results**:
- ✅ Rate saved in rate_master table
- ✅ Booking can retrieve rate by pincode and service type
- ✅ Amount calculated: (200 * 2) + (10% * 400) + (18% * 440) = ~599
- ✅ Manual amount override still works if provided

**Debug Info**:
```sql
-- Check rate master entry
SELECT * FROM rate_master 
WHERE from_pincode = '110001' 
  AND to_pincode = '120001' 
  AND service_type = 'Air';

-- Check rate used in booking
SELECT 
  b.consignment_no,
  b.rate_master_id,
  b.rate,
  b.amount,
  b.tax_amount,
  b.total
FROM bookings b
WHERE b.from_pincode = '110001'
  AND b.to_pincode = '120001'
  AND b.mode = 'Air';
```

---

### ✅ Workflow 9: Multiple Users & Role-Based Access

**Objective**: Verify different user roles and permissions

**Steps**:
1. Create additional users via admin panel (if available):
   - Franchisee User
   - Staff User
   - Cashier User
2. Login as each user
3. Verify access:
   - Franchisee: Can see all bookings for their franchise
   - Staff: Can create bookings, view invoices
   - Cashier: Can only see payments and record payments
4. Verify users cannot see other franchise's data

**Expected Results**:
- ✅ Role-based access control working
- ✅ Users only see their franchise's data
- ✅ Permissions enforced on both API and UI
- ✅ Unauthorized access returns 403 Forbidden

**Debug Info**:
```sql
-- Check users table
SELECT 
  u.username, 
  u.role, 
  f.franchise_name 
FROM users u
JOIN franchises f ON u.franchise_id = f.id;

-- Verify franchise isolation
SELECT 
  u.username,
  COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.franchise_id = b.franchise_id
GROUP BY u.id;
```

---

### ✅ Workflow 10: Data Consistency & Referential Integrity

**Objective**: Verify data relationships and integrity

**Steps**:
1. Create complete workflow (bookings → invoices → payments)
2. Attempt to delete booking that's linked to invoice
3. Verify system prevents orphaning or cascades properly
4. Verify all foreign key relationships intact

**Expected Results**:
- ✅ Delete operations respect foreign keys
- ✅ Cascade delete works for child records
- ✅ No orphaned records in database
- ✅ Referential integrity maintained

**Debug Info**:
```sql
-- Check orphaned invoices
SELECT * FROM invoices WHERE franchise_id NOT IN (
  SELECT id FROM franchises
);

-- Check orphaned payments
SELECT * FROM payments WHERE booking_id IS NOT NULL 
  AND booking_id NOT IN (SELECT id FROM bookings);

-- Check data consistency
SELECT 
  b.id,
  b.consignment_no,
  COUNT(DISTINCT i.id) as invoice_count,
  COUNT(DISTINCT p.id) as payment_count
FROM bookings b
LEFT JOIN invoices i ON b.invoice_id = i.id
LEFT JOIN payments p ON b.id = p.booking_id
GROUP BY b.id;
```

---

## Performance Testing

### Load Testing Script

```bash
#!/bin/bash
# File: load_test.sh

# Test concurrent login attempts
for i in {1..50}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password123"}' &
done
wait

# Test concurrent booking list retrieval
for i in {1..50}; do
  curl http://localhost:5000/api/bookings \
    -H "Authorization: Bearer $TOKEN" &
done
wait

echo "Load test complete"
```

---

## Error Scenarios Testing

### Test Invalid Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
# Expected: 401 Unauthorized
```

### Test Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"consignment_no":"TEST"}'
# Expected: 400 Bad Request - "Required fields missing"
```

### Test Duplicate Consignment Number
```bash
# Create booking
# Try to create another with same consignment_no
# Expected: 400 Conflict - "Consignment number already exists"
```

---

## Checklist: All Tests Passed ✅

- [ ] **Authentication**: Login/Logout works, JWT token generated
- [ ] **Booking Creation**: Booking saved with all fields, validations work
- [ ] **Booking Retrieval**: Can list and search bookings
- [ ] **Invoice Generation**: Invoice created and linked to booking
- [ ] **Invoice Display**: Invoice shows correct data and calculations
- [ ] **PDF Download**: PDF generated with proper formatting
- [ ] **Payment Recording**: Payment saved and linked to invoice
- [ ] **Status Updates**: Invoice status changes to paid
- [ ] **Tracking Updates**: Tracking status changes recorded
- [ ] **Rate Calculation**: Rates applied correctly from rate master
- [ ] **Multi-User**: Role-based access control working
- [ ] **Data Integrity**: Foreign keys and relationships intact
- [ ] **Error Handling**: Proper error messages on failures
- [ ] **Performance**: API responds within acceptable time
- [ ] **Security**: No sensitive data exposed in logs
- [ ] **CORS**: Frontend can communicate with backend
- [ ] **Email**: Notifications sent (if configured)
- [ ] **Mobile Responsive**: UI works on mobile devices

---

## Deployment Readiness Verification

Before going to production, verify:

1. **All tests pass** in staging environment
2. **Database backups** working
3. **SSL certificate** installed and valid
4. **Environment variables** properly configured
5. **Logs** configured and accessible
6. **Monitoring** tools set up
7. **Error tracking** in place
8. **Performance** acceptable under load
9. **Security** audit completed
10. **Documentation** complete

---

## Test Results Template

```markdown
## Test Date: [DATE]
## Environment: [Local/Staging/Production]
## Tested By: [Name]

### Results:
- Workflow 1 (Authentication): ✅ PASS / ❌ FAIL
- Workflow 2 (Booking Creation): ✅ PASS / ❌ FAIL
- Workflow 3 (Invoice Generation): ✅ PASS / ❌ FAIL
- Workflow 4 (PDF Download): ✅ PASS / ❌ FAIL
- Workflow 5 (Payment Recording): ✅ PASS / ❌ FAIL
- Workflow 6 (Tracking Update): ✅ PASS / ❌ FAIL
- Workflow 7 (Bulk Invoice): ✅ PASS / ❌ FAIL
- Workflow 8 (Rate Calculation): ✅ PASS / ❌ FAIL
- Workflow 9 (Multi-User Access): ✅ PASS / ❌ FAIL
- Workflow 10 (Data Integrity): ✅ PASS / ❌ FAIL

### Issues Found:
[List any issues here]

### Sign-off:
- [ ] All tests passed
- [ ] Ready for deployment
- [ ] Approved by [Name]
```

---

**Last Updated**: 2025-11-08  
**Version**: 1.0  
**Status**: Complete  
