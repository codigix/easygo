# Generate & View Single Invoice - Implementation Complete ✅

## What Was Implemented

Based on the video **"Chapter 27 - Generate & View Single Invoice"**, we've implemented the ability to generate ONE invoice for ALL bulk consignments of a customer.

### 🎥 Video Reference

- **Feature**: Generate a single invoice for bulk consignments using customer ID
- **Link**: https://youtu.be/_5jj1ozy0I0?si=OoRHN-vO4I8nQXwN

---

## 📋 New Features Added

### 1. Backend: New Endpoint - `POST /invoices/generate-customer-bulk`

**File**: `backend/src/controllers/invoiceController.js`

**New Function**: `generateBulkInvoiceForCustomer`

**What it does:**

- Accepts customer ID
- Automatically fetches ALL unbilled consignments for that customer
- Calculates totals for all consignments combined
- Generates ONE invoice covering all consignments
- Links all bookings to the generated invoice
- Updates invoice_id on each booking

**Request Body:**

```json
{
  "customer_id": "12345",
  "invoice_date": "2025-01-01",
  "period_from": "2024-12-01",
  "period_to": "2024-12-31",
  "address": "Customer Address",
  "gst_percent": 18,
  "fuel_surcharge_percent": 5,
  "royalty_charge": 2,
  "docket_charge": 1,
  "other_charge": 100,
  "invoice_discount": false,
  "reverse_charge": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice generated for 5 consignments",
  "data": {
    "id": 123,
    "invoice_number": "INV/2025/0001",
    "consignment_count": 5,
    "total_weight": "45.50",
    "net_amount": "5425.00"
  }
}
```

### 2. Backend: Updated Booking API

**File**: `backend/src/controllers/bookingController.js`

**Changes to**: `getAllBookings` function

**New Query Parameters:**

- `unbilledOnly=true` - Shows only unbilled consignments
- `customerId=12345` - Filters by customer
- `consignmentNo=CONS123` - Filters by consignment number

**Example URLs:**

```
GET /bookings?customerId=12345&unbilledOnly=true
GET /bookings?consignmentNo=CONS123
GET /bookings?customerId=12345&unbilledOnly=true&limit=1000
```

### 3. Frontend: Redesigned Generate Single Invoice Page

**File**: `frontend/src/pages/GenerateSingleInvoicePage.jsx`

**New Workflow:**

1. **Customer Selection**

   - Enter customer ID
   - Click "Search" button
   - System fetches all unbilled consignments for that customer

2. **Consignment Preview**

   - Shows all found consignments in a table
   - Displays: Consignment #, Destination, Weight, Mode, Amount
   - Shows count and subtotal

3. **Invoice Configuration**

   - **Invoice Dates**: Invoice Date, Period From, Period To
   - **Tax & Charges**: GST %, Fuel Surcharge %, Royalty %
   - **Additional Charges**: Docket %, Other Charge (₹)
   - **Options**: Invoice Discount, Reverse Charge

4. **Live Summary**

   - Shows real-time calculation as user modifies charges
   - Displays: Subtotal, Fuel Surcharge, Royalty, GST, Net Amount
   - Color-coded summary card

5. **Actions**
   - Clear button to reset form
   - Generate Invoice button to create invoice
   - Shows success/error messages with details

---

## 🔄 Complete Data Flow

### Step 1: Customer Search

```
User enters Customer ID → Frontend requests /bookings?customerId=xxx&unbilledOnly=true
→ Backend filters bookings → Returns list of unbilled bookings
```

### Step 2: Invoice Generation

```
User clicks "Generate Invoice" → Frontend sends POST /invoices/generate-customer-bulk
→ Backend:
   1. Fetches all unbilled bookings for customer
   2. Calculates totals for all bookings
   3. Creates single invoice record
   4. Creates invoice_items for each booking
   5. Updates invoice_id on each booking
   6. Returns invoice details
→ Frontend shows success message
```

### Step 3: View Invoice

Users can view the generated invoice using the existing **"View Single Invoices"** page which shows:

- Filter by company name, invoice number, date range
- Summary of paid/unpaid amounts
- Complete invoice details table

---

## 📊 Database Changes

### Bookings Table

- Now tracks `invoice_id` (links to invoices table)
- Unbilled consignments: `invoice_id IS NULL`

### Invoices Table

- Stores invoice details with all charges
- Links to multiple bookings via invoice_items

### Invoice Items Table

- Each row represents one consignment in the invoice
- Stores booking_id, amount, description

---

## ✨ Key Features

1. **Auto-Detection**: System automatically finds all unbilled consignments
2. **Bulk Processing**: One invoice covers multiple consignments
3. **Flexible Charges**: Support for GST, fuel surcharge, royalty, docket charges
4. **Live Calculations**: Summary updates in real-time as user changes percentages
5. **Comprehensive Summary**: Shows weight, count, amounts at a glance
6. **Error Handling**: Clear error messages for edge cases (no consignments, validation errors)
7. **Success Feedback**: Shows invoice number and details when generated successfully

---

## 🧪 Testing

### Test Scenario 1: Generate Invoice for Customer with Multiple Unbilled Consignments

```
1. Go to "Generate Single Invoice" page
2. Enter customer ID: "12345"
3. Click "Search"
4. Verify: Shows all unbilled consignments for that customer
5. Set invoice dates and charges
6. Click "Generate Invoice"
7. Verify: Success message with invoice number
8. Go to "View Single Invoices" to verify invoice was created
```

### Test Scenario 2: Customer with No Unbilled Consignments

```
1. Go to "Generate Single Invoice" page
2. Enter customer ID for a customer with all billed consignments
3. Click "Search"
4. Verify: Error message "No unbilled consignments found"
```

### Test Scenario 3: View Generated Invoices

```
1. Go to "View Single Invoices" page
2. Search by customer ID or invoice number
3. Verify: Generated invoice appears in results
4. Verify: All consignments are included in invoice_items
```

---

## 🔧 Technical Details

### Backend Implementation

- **Language**: JavaScript (Node.js)
- **Database**: MySQL
- **Pattern**: Transaction-based (rollback on error)
- **Query Optimization**: Uses LEFT JOIN for efficient data retrieval

### Frontend Implementation

- **Framework**: React
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState)
- **Icons**: lucide-react

### API Response Format

All responses follow standardized format:

```json
{
  "success": boolean,
  "message": string,
  "data": {
    // Response data
  },
  "error": string // Only on error
}
```

---

## 📝 Files Modified

### Backend

1. `/backend/src/controllers/invoiceController.js`

   - Added: `generateBulkInvoiceForCustomer` function
   - Modified: Nothing else

2. `/backend/src/routes/invoiceRoutes.js`

   - Added: `generateBulkInvoiceForCustomer` import
   - Added: POST route `/generate-customer-bulk`

3. `/backend/src/controllers/bookingController.js`
   - Modified: `getAllBookings` function to support filters

### Frontend

1. `/frontend/src/pages/GenerateSingleInvoicePage.jsx`
   - Completely rewritten
   - New UI/UX for bulk invoice generation
   - New workflow for customer-based invoice generation

---

## 🎯 Next Steps

1. **Testing**: Run the application and test the workflow
2. **Integration**: Ensure navigation menu links to the pages
3. **Validation**: Add more field validations if needed
4. **Reporting**: View generated invoices in "View Single Invoices" page
5. **Download**: Users can download generated invoices as PDFs

---

## 💡 Features Comparison

| Feature                              | Video | Implementation |
| ------------------------------------ | ----- | -------------- |
| Customer ID Search                   | ✅    | ✅             |
| Generate Single Invoice              | ✅    | ✅             |
| Multiple Consignments in One Invoice | ✅    | ✅             |
| Tax & Charges Configuration          | ✅    | ✅             |
| View Generated Invoices              | ✅    | ✅             |
| Live Calculations                    | ❌    | ✅ BONUS       |
| Bulk Charge Display                  | ❌    | ✅ BONUS       |
| Error Handling                       | ❌    | ✅ BONUS       |

---

## 🚀 How to Use

### For Users:

1. **Generate Invoice**

   - Navigate to "Generate Single Invoice" page
   - Enter customer ID
   - Click Search to preview unbilled consignments
   - Set invoice dates and charges
   - Click Generate Invoice

2. **View Invoice**

   - Navigate to "View Single Invoices" page
   - Filter by customer or date
   - Click to view invoice details

3. **Download Invoice**
   - Click download button on invoice row
   - Invoice downloads as HTML/PDF

---

## ⚙️ Configuration

### Default Values

- Invoice Date: Today's date
- GST %: 18%
- Fuel Surcharge: 0%
- Royalty Charge: 0%
- Docket Charge: 0%
- Other Charge: 0%
- Invoice Discount: No
- Reverse Charge: No

### Environment Variables

Make sure these are set in your `.env` file:

- `VITE_API_URL`: Backend API base URL

---

## 🐛 Error Handling

The system handles the following errors gracefully:

1. **No Customer ID**: Shows error "Please enter a customer ID"
2. **No Unbilled Consignments**: Shows error "No unbilled consignments found"
3. **Missing Invoice Dates**: Shows error "Please select period from and to dates"
4. **API Errors**: Shows detailed error messages
5. **Network Errors**: Shows connection error message

---

## 📞 Support

If you encounter any issues:

1. Check browser console for error details
2. Verify backend is running and API is accessible
3. Check database for invoice records
4. Review error messages for specific guidance

---

**Implementation Date**: January 2025
**Status**: ✅ Complete and Ready to Test
**Tested**: Manual testing scenarios provided above
