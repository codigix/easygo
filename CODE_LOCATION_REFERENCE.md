# 📍 CODE LOCATION REFERENCE - Auto Input Detection Workflow

## 🎯 QUICK NAVIGATION MAP

```
FRONTEND FLOW
│
├─ 📁 frontend/src/components/ChatbotAssistant.jsx
│  ├─ Line 138-220: handleSendMessage() Function
│  │  ├─ Line 158: const searchInput = inputValue.trim();
│  │  ├─ Line 163-167: ✨ AUTO INPUT DETECTION LOGIC
│  │  │   if (/^\d+$/.test(searchInput))
│  │  │     → customerId search
│  │  │   else
│  │  │     → consignmentNo search
│  │  ├─ Line 169-178: Build & send API request
│  │  └─ Line 184-205: Handle response & display table
│  │
│  ├─ Line 69-136: handleDownloadInvoice() Function
│  │  └─ Downloads invoice when user clicks button
│  │
│  └─ Line 272-361: Render booking_table message type
│     └─ Displays results in interactive table format
│
└─ API CALL (Line 169-178)
   └─ GET /bookings/search-with-invoices?[params]


BACKEND FLOW
│
├─ 📁 backend/src/routes/bookingRoutes.js
│  └─ Line 37: Route definition
│     router.get("/search-with-invoices", authenticate, searchBookingsWithInvoices)
│
└─ 📁 backend/src/controllers/bookingController.js
   └─ Line 976-1047: searchBookingsWithInvoices() Function
      ├─ Line 978: Extract franchise_id from auth
      ├─ Line 979: Destructure { consignmentNo, customerId }
      ├─ Line 981-986: Validate at least one param exists
      ├─ Line 989-1006: Build base SQL query
      ├─ Line 1009-1017: ✨ CONDITIONAL QUERY BUILDING
      │   if (consignmentNo)
      │     → Add: AND LOWER(b.consignment_number) = LOWER(?)
      │   if (customerId)
      │     → Add: AND b.customer_id = ?
      ├─ Line 1019: Add sorting
      ├─ Line 1021: Execute query
      ├─ Line 1023-1031: Handle empty results
      └─ Line 1033-1039: Return JSON response


DATABASE
│
├─ bookings table
│  ├─ consignment_number (searched if alphanumeric)
│  └─ customer_id (searched if numeric)
│
├─ invoice_items table (junction)
│  ├─ booking_id → links to bookings
│  └─ invoice_id → links to invoices
│
└─ invoices table
   ├─ id
   └─ invoice_number
```

---

## 🔴 FRONTEND: ChatbotAssistant.jsx

### **Step 1: Line 158 - Get Input**

```javascript
handleSendMessage = async (e) => {
  e.preventDefault();
  if (!inputValue.trim()) return;

  const userMessage = {           // ← Line 145-150
    id: messageIdRef.current++,
    text: inputValue,
    sender: "user",
    type: "text",
  };

  setMessages((prev) => [...prev, userMessage]);
  setInputValue("");
  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");
    const searchInput = inputValue.trim();  // ← LINE 158: STORE INPUT
```

### **Step 2: Line 163-167 - AUTO INPUT DETECTION** ⭐

```javascript
// Check if input is numeric (customer ID) or alphanumeric (consignment)
const params = new URLSearchParams();

if (/^\d+$/.test(searchInput)) {
  // ← REGEX CHECK
  params.append("customerId", searchInput);
} else {
  params.append("consignmentNo", searchInput);
}
```

**What this regex does:**

```javascript
/^\d+$/ = Regular Expression
  ^   = Start of string
  \d  = Any digit (0-9)
  +   = One or more times
  $   = End of string

Examples:
✅ "12345".match(/^\d+$/)        → MATCHES (returns array) → TRUTHY
❌ "CODIGIIX108".match(/^\d+$/)  → NO MATCH (returns null) → FALSY
```

### **Step 3: Line 169-178 - Build & Send API**

```javascript
const response = await fetch(
  `${
    import.meta.env.VITE_API_URL
  }/bookings/search-with-invoices?${params.toString()}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

**Generated URLs examples:**

- `http://localhost:5000/bookings/search-with-invoices?customerId=12345`
- `http://localhost:5000/bookings/search-with-invoices?consignmentNo=CODIGIIX108`

### **Step 4: Line 180-205 - Handle Response**

```javascript
if (!response.ok) {
  throw new Error("Search failed");
}

const result = await response.json();

if (result.success && result.data.bookings.length > 0) {
  const assistantMessage = {
    id: messageIdRef.current++,
    sender: "assistant",
    type: "booking_table",
    bookings: result.data.bookings, // ← STORE BOOKINGS
    text: `Found ${result.data.count} booking(s)`,
  };
  setMessages((prev) => [...prev, assistantMessage]);
}
```

### **Step 5: Line 272-361 - Display Results**

```javascript
    {message.type === "booking_table" && message.bookings && (
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-sm mb-2">{message.text}</p>
        <div className="overflow-x-auto bg-white text-gray-900 rounded">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b">
                <th>Consignment</th>
                <th>Destination</th>
                <th>Weight</th>
                <th>Mode</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {message.bookings.map((booking, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-100">
                  <td>{booking.consignment_number}</td>
                  <td>{booking.destination || "N/A"}</td>
                  <td>{booking.weight || "N/A"} kg</td>
                  <td>{booking.mode || "N/A"}</td>
                  <td className="text-right">₹{booking.amount || 0}</td>
                  <td className="text-center">
                    {booking.invoice_id ? (
                      <button onClick={() => handleDownloadInvoice(...)}>
                        Download
                      </button>
                    ) : (
                      <span>No Invoice</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
```

---

## 🔵 BACKEND: bookingController.js

### **Line 976-1047: searchBookingsWithInvoices()**

```javascript
export const searchBookingsWithInvoices = async (req, res) => {
  try {
    // LINE 978: Get franchise from authenticated user
    const franchiseId = req.user.franchise_id;

    // LINE 979: Get query parameters
    const { consignmentNo, customerId } = req.query;

    // LINE 981-986: Validate input
    if (!consignmentNo && !customerId) {
      return res.status(400).json({
        success: false,
        message: "Please provide either consignmentNo or customerId",
      });
    }

    const db = getDb();

    // LINE 989-1006: Base SQL Query
    let query = `
      SELECT DISTINCT
        b.id,
        b.consignment_number,
        b.customer_id,
        b.destination,
        b.act_wt as weight,
        b.mode,
        b.total as amount,
        b.booking_date,
        b.status,
        i.id as invoice_id,
        i.invoice_number
      FROM bookings b
      LEFT JOIN invoice_items ii ON b.id = ii.booking_id
      LEFT JOIN invoices i ON ii.invoice_id = i.id
      WHERE b.franchise_id = ?
    `;

    const params = [franchiseId];

    // LINE 1009-1012: If consignmentNo provided
    if (consignmentNo) {
      query += ` AND LOWER(b.consignment_number) = LOWER(?)`;
      params.push(consignmentNo.trim());
    }

    // LINE 1014-1017: If customerId provided
    if (customerId) {
      query += ` AND b.customer_id = ?`;
      params.push(customerId.trim());
    }

    // LINE 1019: Sort by date
    query += ` ORDER BY b.booking_date DESC`;

    // LINE 1021: Execute query
    const [bookings] = await db.query(query, params);

    // LINE 1023-1031: If no results
    if (bookings.length === 0) {
      return res.json({
        success: true,
        data: {
          bookings: [],
          message: "No bookings found for the selected criteria.",
        },
      });
    }

    // LINE 1033-1039: Success response
    res.json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
      },
    });
  } catch (error) {
    console.error("Search bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search bookings",
    });
  }
};
```

---

## 📊 SQL QUERY EXAMPLES

### **When searching by Customer ID "12345":**

```sql
SELECT DISTINCT
  b.id, b.consignment_number, b.customer_id, b.destination,
  b.act_wt as weight, b.mode, b.total as amount,
  b.booking_date, b.status, i.id as invoice_id, i.invoice_number
FROM bookings b
LEFT JOIN invoice_items ii ON b.id = ii.booking_id
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE b.franchise_id = 1
  AND b.customer_id = '12345'
ORDER BY b.booking_date DESC
```

**Result:** ✅ ALL bookings for customer 12345 (bulk invoices)

### **When searching by Consignment "CODIGIIX108":**

```sql
SELECT DISTINCT
  b.id, b.consignment_number, b.customer_id, b.destination,
  b.act_wt as weight, b.mode, b.total as amount,
  b.booking_date, b.status, i.id as invoice_id, i.invoice_number
FROM bookings b
LEFT JOIN invoice_items ii ON b.id = ii.booking_id
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE b.franchise_id = 1
  AND LOWER(b.consignment_number) = LOWER('CODIGIIX108')
ORDER BY b.booking_date DESC
```

**Result:** ✅ Only that specific consignment

---

## 🎬 DATA FLOW EXAMPLE

**User Input:** "12345"

```
STEP 1: Frontend detects
  /^\d+$/.test("12345")  → true
  → Use customerId search

STEP 2: Build params
  params.append("customerId", "12345")

STEP 3: API Call
  GET /bookings/search-with-invoices?customerId=12345

STEP 4: Backend receives
  req.query = { customerId: "12345" }
  franchiseId = req.user.franchise_id (from auth)

STEP 5: Build query
  WHERE b.franchise_id = 1
    AND b.customer_id = '12345'

STEP 6: Execute SQL
  SELECT ... FROM bookings
  WHERE franchise_id = 1 AND customer_id = '12345'

STEP 7: Get results
  [
    { consignment_number: "CODIGIIX108", amount: 500, invoice_id: 101 },
    { consignment_number: "CODIGIIX109", amount: 300, invoice_id: 102 },
    { consignment_number: "CODIGIIX110", amount: 200, invoice_id: 103 }
  ]

STEP 8: Return to Frontend
  {
    success: true,
    data: {
      bookings: [...],
      count: 3
    }
  }

STEP 9: Display in Table
  ┌─────────────────┬──────────────┬─────────┐
  │ Consignment     │ Destination  │ Amount  │ Action
  ├─────────────────┼──────────────┼─────────┤
  │ CODIGIIX108     │ Mumbai       │ ₹500    │ Download
  │ CODIGIIX109     │ Delhi        │ ₹300    │ Download
  │ CODIGIIX110     │ Bangalore    │ ₹200    │ Download
  └─────────────────┴──────────────┴─────────┘
```

---

## ✅ SUMMARY: WHERE EACH FEATURE IS IMPLEMENTED

| Feature                | File                 | Line      | Code                                    |
| ---------------------- | -------------------- | --------- | --------------------------------------- |
| **Auto Detection**     | ChatbotAssistant.jsx | 163       | `/^\d+$/.test(searchInput)`             |
| **Parameter Building** | ChatbotAssistant.jsx | 162-167   | `URLSearchParams`                       |
| **API Call**           | ChatbotAssistant.jsx | 169-178   | `fetch(/bookings/search-with-invoices)` |
| **Response Handling**  | ChatbotAssistant.jsx | 184-205   | Parse JSON & display                    |
| **Route Definition**   | bookingRoutes.js     | 37        | `router.get()`                          |
| **Query Building**     | bookingController.js | 1009-1017 | Conditional WHERE clause                |
| **Database Query**     | bookingController.js | 1021      | `db.query()`                            |
| **Response Return**    | bookingController.js | 1033-1039 | JSON response                           |
