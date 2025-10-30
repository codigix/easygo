# 🎯 AUTO INPUT DETECTION WORKFLOW

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (ChatbotAssistant.jsx)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  User Types Input (Line 163-167)          │
        │  ────────────────────────────────────────  │
        │  Input: "12345" OR "CODIGIIX INFOTECH108" │
        └───────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────┐
        │  STEP 1: AUTO INPUT DETECTION (Line 163)    │
        │  ────────────────────────────────────────   │
        │  const searchInput = inputValue.trim();     │
        │                                              │
        │  if (/^\d+$/.test(searchInput)) {           │
        │    → NUMERIC? → Customer ID Search          │
        │  } else {                                    │
        │    → ALPHANUMERIC? → Consignment Search     │
        │  }                                           │
        └──────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────────────┐
        │  STEP 2: BUILD API PARAMETERS (Line 162-167)        │
        │  ──────────────────────────────────────────────────  │
        │  const params = new URLSearchParams();               │
        │                                                       │
        │  IF Numeric (Customer ID):                           │
        │    params.append("customerId", searchInput);        │
        │                                                       │
        │  IF Alphanumeric (Consignment):                      │
        │    params.append("consignmentNo", searchInput);      │
        └──────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────────────────┐
        │  STEP 3: SEND API REQUEST (Line 169-178)                │
        │  ──────────────────────────────────────────────────────  │
        │  fetch(`/bookings/search-with-invoices?${params}`)      │
        │                                                           │
        │  Example URLs:                                           │
        │  • /bookings/search-with-invoices?customerId=12345      │
        │  • /bookings/search-with-invoices?consignmentNo=...     │
        └──────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND (bookingController.js - Line 976)               │
│                                                                  │
│  searchBookingsWithInvoices(req, res) {                         │
│    const { consignmentNo, customerId } = req.query;            │
│                                                                  │
│    ✅ Check if at least ONE parameter exists                    │
│    if (!consignmentNo && !customerId) → ERROR 400              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────────────┐
        │  STEP 4: BUILD SQL QUERY (Line 989-1019)            │
        │  ──────────────────────────────────────────────────  │
        │  Base Query:                                          │
        │  SELECT b.*, i.* FROM bookings b                     │
        │  LEFT JOIN invoices i                                 │
        │  WHERE b.franchise_id = ?                            │
        │                                                       │
        │  IF consignmentNo provided:                          │
        │    ADD: AND LOWER(b.consignment_number) = LOWER(?) │
        │                                                       │
        │  IF customerId provided:                             │
        │    ADD: AND b.customer_id = ?                       │
        │                                                       │
        │  Final: ORDER BY b.booking_date DESC                 │
        └──────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────────────┐
        │  STEP 5: EXECUTE QUERY (Line 1021)                  │
        │  ──────────────────────────────────────────────────  │
        │  [bookings] = db.query(query, params)               │
        │                                                       │
        │  ✅ If bookings found → Return bookings array        │
        │  ❌ If NO bookings → Return empty array             │
        └──────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────────────────────────────────────────┐
        │  STEP 6: RETURN JSON RESPONSE (Line 1033-1039)      │
        │  ──────────────────────────────────────────────────  │
        │  {                                                    │
        │    success: true,                                    │
        │    data: {                                           │
        │      bookings: [                                     │
        │        {                                             │
        │          id,                                         │
        │          consignment_number,                         │
        │          customer_id,                                │
        │          destination,                                │
        │          weight: (act_wt),                           │
        │          mode,                                       │
        │          amount: (total),                            │
        │          invoice_id,                                 │
        │          invoice_number                              │
        │        },                                            │
        │        ...                                           │
        │      ],                                              │
        │      count: bookings.length                          │
        │    }                                                 │
        │  }                                                    │
        └──────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         FRONTEND - Display Results (ChatbotAssistant.jsx)       │
│                                                                  │
│  Line 184-205: Handle Response                                  │
│  • Parse JSON response                                           │
│  • Check if result.success && result.data.bookings.length > 0  │
│  • Create message object with type: "booking_table"            │
│  • Display in interactive table with Download button           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 DETAILED BREAKDOWN

### **FRONTEND - Line 163-167: Auto Input Detection Logic**

```javascript
const params = new URLSearchParams();

if (/^\d+$/.test(searchInput)) {
  // ← REGEX: Only numbers?
  params.append("customerId", searchInput);
} else {
  params.append("consignmentNo", searchInput);
}
```

**Regex Explanation:**

- `/^\d+$/` = Matches ONLY if string contains ONLY digits
- `^` = Start of string
- `\d+` = One or more digits
- `$` = End of string

**Examples:**

```
✅ "12345" → Matches → customerId search
✅ "54321" → Matches → customerId search
❌ "CODIGIIX" → No match → consignmentNo search
❌ "CODIGIIX108" → No match → consignmentNo search
❌ "123ABC" → No match → consignmentNo search
```

---

### **BACKEND - Line 1009-1017: Query Building**

```javascript
if (consignmentNo) {
  query += ` AND LOWER(b.consignment_number) = LOWER(?)`;
  params.push(consignmentNo.trim());
}

if (customerId) {
  query += ` AND b.customer_id = ?`;
  params.push(customerId.trim());
}
```

**Why LOWER()?**

- Case-insensitive search
- "CODIGIIX" = "codigiix" = "CoDigiix" ✅

---

### **DATABASE QUERY RESULTS**

**If searching by Customer ID "12345":**

```javascript
// Returns ALL bookings for customer 12345
[
  {
    id: 1,
    consignment_number: "CODIGIIX108",
    customer_id: "12345",
    destination: "Mumbai",
    weight: "5",
    mode: "Express",
    amount: "500",
    invoice_id: 101,
    invoice_number: "INV-2025-001",
  },
  {
    id: 2,
    consignment_number: "CODIGIIX109",
    customer_id: "12345",
    destination: "Delhi",
    weight: "3",
    mode: "Standard",
    amount: "300",
    invoice_id: 102,
    invoice_number: "INV-2025-002",
  },
  // More bookings...
];
```

**If searching by Consignment "CODIGIIX108":**

```javascript
// Returns only that ONE consignment
[
  {
    id: 1,
    consignment_number: "CODIGIIX108",
    customer_id: "12345",
    destination: "Mumbai",
    weight: "5",
    mode: "Express",
    amount: "500",
    invoice_id: 101,
    invoice_number: "INV-2025-001",
  },
];
```

---

## 📋 WHERE DATA COMES FROM (Database Tables)

```
BOOKINGS TABLE:
├── id                    (Primary Key)
├── franchise_id          (Authorization)
├── consignment_number    ← Search here (if alphanumeric)
├── customer_id           ← Search here (if numeric)
├── destination
├── act_wt (as weight)
├── mode
├── total (as amount)
├── booking_date
└── status

INVOICE_ITEMS TABLE (Junction):
├── id
├── booking_id           ← Joins to bookings
└── invoice_id           ← Joins to invoices

INVOICES TABLE:
├── id                   ← Matches invoice_id
├── invoice_number
└── [other invoice data]
```

---

## ✨ KEY FEATURES

| Feature                | Location                 | How It Works                          |
| ---------------------- | ------------------------ | ------------------------------------- |
| **Auto Detection**     | Frontend (Line 163)      | Regex `/^\d+$/` checks if numeric     |
| **Flexible Search**    | Frontend (Line 162-167)  | Build different params based on input |
| **Database Filter**    | Backend (Line 1014-1017) | Add WHERE clause based on param type  |
| **Invoice Join**       | Backend (Line 1003-1004) | LEFT JOIN to show related invoices    |
| **Case Insensitive**   | Backend (Line 1010)      | LOWER() function for consignment      |
| **Pagination by Date** | Backend (Line 1019)      | ORDER BY booking_date DESC            |
| **Authorization**      | Backend (Line 978)       | franchise_id from req.user            |

---

## 🎬 WORKFLOW SUMMARY

```
User Input → Auto Detect → Build Params → API Call →
Backend Query → Database Search → Join Invoices →
Return JSON → Display Table → Download Option
```

---

## 📍 FILE LOCATIONS

- **Frontend Logic**: `frontend/src/components/ChatbotAssistant.jsx` (Lines 163-178)
- **Backend Route**: `backend/src/routes/bookingRoutes.js` (Line 37)
- **Backend Controller**: `backend/src/controllers/bookingController.js` (Lines 976-1047)
- **API Endpoint**: `GET /bookings/search-with-invoices?customerId=X` or `?consignmentNo=Y`
