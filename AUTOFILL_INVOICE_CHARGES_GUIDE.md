# Auto-Fill Invoice Charges from Company Rate Master

## 🎯 Feature Overview

The **Generate Single Invoice** page now automatically populates all invoice charge fields from the **Company Rate Master** settings when a customer ID is searched. This eliminates manual data entry and ensures consistency across all invoices for a customer.

## 📋 What Gets Auto-Filled

When you search for a customer, the following fields are automatically filled from the Company Rate Master:

| Form Field           | Data Source               | Default Value | Description                               |
| -------------------- | ------------------------- | ------------- | ----------------------------------------- |
| **GST %**            | Default (18% for India)   | 18            | Goods & Services Tax percentage           |
| **Fuel Surcharge %** | `fuel_surcharge_percent`  | 0             | Fuel surcharge as percentage of subtotal  |
| **Royalty Charge %** | `royalty_charges_percent` | 0             | Royalty charges as percentage of subtotal |
| **Docket Charge**    | `topay_charge`            | 0             | To-Pay charges (per consignment or flat)  |
| **Other Charge**     | `cod_charge`              | 0             | Cash-On-Delivery or miscellaneous charges |

## 🔄 Data Flow

```
User Input: Customer ID
    ↓
Search for Unbilled Consignments
    ↓
Fetch Company Rate Master by company_id
    ↓
Auto-Fill Form Fields
    ↓
User Adjusts Values (if needed)
    ↓
Generate Invoice
```

## 🛠️ Technical Implementation

### Backend Components

#### 1. **New API Endpoint**

```
GET /company-rates/by-id/:company_id
```

**Purpose**: Fetch company rate master settings by customer ID

**Response Format**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "franchise_id": 5,
    "company_id": "CODIGIIX INFOTECH",
    "company_name": "ABC Courier Services",
    "fuel_surcharge_percent": 5,
    "royalty_charges_percent": 2,
    "topay_charge": 50,
    "cod_charge": 25,
    "gst_percent": 18,
    "...": "other fields"
  }
}
```

**Fallback (if company not found)**:

```json
{
  "success": true,
  "data": {
    "company_id": "UNKNOWN",
    "gst_percent": 18,
    "fuel_surcharge_percent": 0,
    "royalty_charges_percent": 0,
    "topay_charge": 0,
    "cod_charge": 0,
    "invoice_discount": false
  }
}
```

#### 2. **New Controller Function**

**File**: `backend/src/controllers/companyRateMasterController.js`

```javascript
export const getCompanyByCompanyId = async (req, res) => {
  // Fetches company settings by company_id (string identifier)
  // Searches in: WHERE company_id = ? AND franchise_id = ?
  // Returns default values if company not found
};
```

#### 3. **New Route File**

**File**: `backend/src/routes/companyRateRoutes.js`

Routes registered:

- `GET /company-rates/` - Get all companies
- `GET /company-rates/by-id/:company_id` - Get company by company_id ✅ NEW
- `GET /company-rates/:id` - Get company by database id
- `POST /company-rates/` - Create company
- `PUT /company-rates/:id` - Update company
- `DELETE /company-rates/:id` - Delete company
- `POST /company-rates/upload` - Upload from Excel
- `GET /company-rates/template/download` - Download template

### Frontend Components

#### 1. **New Function in GenerateSingleInvoicePage.jsx**

```javascript
const fetchCompanySettings = async (customerId, token) => {
  // Called automatically after finding unbilled consignments
  // Fetches company rate master settings
  // Auto-fills form with fetched values
};
```

#### 2. **Updated Search Flow**

```javascript
const fetchConsignmentsForCustomer = async () => {
  // 1. Fetch unbilled consignments
  // 2. Call fetchCompanySettings() to auto-fill charges
  // 3. Display success message with counts
};
```

## 🔌 API Integration

### Request Example

```bash
curl -X GET \
  'http://localhost:5000/company-rates/by-id/CODIGIIX INFOTECH' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### JavaScript (Fetch)

```javascript
const token = localStorage.getItem("token");
const customerId = "CODIGIIX INFOTECH";

const response = await fetch(
  `${VITE_API_URL}/company-rates/by-id/${encodeURIComponent(customerId)}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
if (data.success) {
  // Auto-fill form with data.data
}
```

## 📊 User Experience Flow

### Step 1: Enter Customer ID

```
┌─────────────────────────┐
│ Customer ID: [________] │
│         [Search]        │
└─────────────────────────┘
```

### Step 2: Auto-Fill Happens

```
✅ Found 3 unbilled consignment(s)

[Table with consignments]

🔄 Fetching company settings...
```

### Step 3: Form Auto-Populated

```
Invoice Dates          Charges Configuration
─────────────────     ──────────────────────
Invoice Date: 2025-01 GST %: 18 ✅ (Auto-filled)
Period From:  2024-12 Fuel Surcharge %: 5 ✅
Period To:    2024-12 Royalty %: 2 ✅
              Docket: 50 ✅
              Other: 25 ✅

[Summary with calculations]
[Generate Invoice Button]
```

### Step 4: User Can Override

All fields are editable - users can change values if needed.

## ✅ Testing Checklist

- [ ] **Test 1**: Search for customer with company settings
  - Expected: Form auto-fills with company values
- [ ] **Test 2**: Search for customer WITHOUT company settings
  - Expected: Form fills with default values (18% GST, 0% others)
- [ ] **Test 3**: User can override auto-filled values
  - Expected: Changed values persist and calculate correctly
- [ ] **Test 4**: Generated invoice has correct charges
  - Expected: Uses values that were auto-filled (or overridden)
- [ ] **Test 5**: Summary calculates correctly with auto-filled values
  - Expected: Real-time updates as values change

## 🐛 Troubleshooting

### Issue: Fields not auto-filling

**Solution**:

1. Open browser DevTools (F12)
2. Check Network tab for `/company-rates/by-id/` request
3. Verify response contains valid data
4. Check Console for JavaScript errors

### Issue: Default values not showing

**Solution**:

1. Check if company exists in Company Rate Master
2. Verify customer_id matches exactly (case-sensitive)
3. Check if API returns success: true

### Issue: Values showing but not calculating

**Solution**:

1. Verify all form fields have valid numbers
2. Check if calculateTotals() function is being called
3. Inspect form data in React DevTools

## 📈 Future Enhancements

1. **GST Customization**: Add `gst_percent` to company_rate_master for company-specific GST rates
2. **Rate Templates**: Allow saving invoice charge templates
3. **Bulk Override**: Option to apply different rates to selected consignments
4. **Rate History**: Track which rates were used for each invoice
5. **Rate Versioning**: Maintain rate versions for historical accuracy

## 🔐 Security Notes

- ✅ Requires authentication (Bearer token)
- ✅ Scoped to franchise_id (multi-tenant safety)
- ✅ Searches by company_id AND franchise_id
- ✅ Returns default values if not found (no 404 errors)

## 📝 Database Fields Reference

### Company Rate Master Table

```sql
company_rate_master
├── id (Primary Key)
├── franchise_id (Foreign Key)
├── company_id (String - Customer ID) ← Used for lookup
├── company_name
├── fuel_surcharge_percent (Decimal)
├── royalty_charges_percent (Decimal)
├── topay_charge (Decimal)
├── cod_charge (Decimal)
├── gst_no (String)
├── insurance_percent (Decimal)
├── minimum_risk_surcharge (Decimal)
└── ... other fields
```

## 📞 API Documentation

### Endpoint: Get Company by Company ID

**URL**: `/company-rates/by-id/:company_id`

**Method**: `GET`

**Authentication**: Required (Bearer Token)

**Parameters**:

- `company_id` (URL Path) - String identifier from bookings.customer_id

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_id": "CODIGIIX INFOTECH",
    "fuel_surcharge_percent": 5.0,
    "royalty_charges_percent": 2.0,
    "topay_charge": 50.0,
    "cod_charge": 25.0,
    "gst_percent": 18
  }
}
```

**Fallback Response (200)**:

```json
{
  "success": true,
  "data": {
    "company_id": "UNKNOWN",
    "gst_percent": 18,
    "fuel_surcharge_percent": 0,
    "royalty_charges_percent": 0,
    "topay_charge": 0,
    "cod_charge": 0
  }
}
```

**Error Response (500)**:

```json
{
  "success": false,
  "message": "Failed to fetch company"
}
```

## 🎓 Implementation Summary

| Component           | Status      | Location                                                  |
| ------------------- | ----------- | --------------------------------------------------------- |
| Backend Route       | ✅ Created  | `/backend/src/routes/companyRateRoutes.js`                |
| Controller Function | ✅ Created  | `/backend/src/controllers/companyRateMasterController.js` |
| Route Registration  | ✅ Added    | `/backend/src/routes/index.js`                            |
| Frontend Hook       | ✅ Added    | `/frontend/src/pages/GenerateSingleInvoicePage.jsx`       |
| API Integration     | ✅ Complete | GET `/company-rates/by-id/:company_id`                    |

---

**Last Updated**: January 2025
**Feature**: Auto-Fill Invoice Charges from Company Rate Master
**Status**: ✅ Complete and Ready for Testing
